import {Router, Response} from 'express';
import Bid from '../models/Bid';
import Task from '../models/Task';
import {authMiddleware, AuthRequest} from '../middleware/auth';
import Auth from "./auth";
import User from '../models/User';
import Transaction from '../models/Transaction';
import Notification from '../models/Notification';

const router = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const {taskId, bidAmount, estimatedTime, message} = req.body;
        if (!taskId || !bidAmount || !estimatedTime) {
            res.status(400).json({error: 'Please specify task ID, bid amount, and estimated time.'});
            return;
        }
        const task = await Task.findById(taskId);
        if (!task) {
            res.status(400).json({error: 'Task not found.'});
            return;
        }
        if (task.status !== 'open') {
            res.status(400).json({error: 'This task is no longer accepting bids.'});
            return;
        }
        if (task.client.toString() === req.userId) {
            res.status(400).json({error: 'You cannot bid on your own task.'});
            return;
        }
        const existingBid = await Bid.findOne({task: taskId, tasker: req.userId});
        if (existingBid) {
            res.status(400).json({error: 'You have already placed a bid on this task.'});
            return;
        }

        const newBid = new Bid({
            task: taskId,
            tasker: req.userId,
            bidAmount,
            estimatedTime,
            message,
            status: 'pending'
        });
        await newBid.save();
        const newNotification = new Notification({
            user: task.client,
            title: 'New Bid Received! 💸',
            body: `A new bid of ₹${bidAmount} has been placed on your errand: "${task.title}".`,
            type: 'bid_received',
            task: task._id
        });
        await newNotification.save();
        const io = req.app.get('io');
        io.to(task.client.toString()).emit('new_notification', newNotification);
        res.status(201).json(newBid);
    } catch (error) {
        console.error('Place bid error:', error);
        res.status(500).json({error: 'Server error placing bid.'});
    }
});

router.get('/task/:taskId', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const {taskId} = req.params;
        const task = await Task.findById(taskId);
        if (!task) {
            res.status(400).json({error: 'Task not found.'});
            return;
        }
        if (task.client.toString() === req.userId) {
            const bids = await Bid.find({task: taskId})
                .populate('tasker', 'name rating isVerified reviewCount')
                .sort({createdAt: -1});
            res.json(bids);
            return;
        }
        const myBid = await Bid.find({task: taskId, tasker: req.userId})
            .populate('tasker', 'name rating isVerified reviewCount');
        res.json(myBid);
    } catch (error) {
        console.error('Fetch bids error:', error);
        res.status(500).json({error: 'Server error fetching bids.'});
    }
});

router.post('/:id/accept', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid) {
            res.status(404).json({error: 'Bid not found.'});
            return;
        }
        const task = await Task.findById(bid.task);
        if (!task) {
            res.status(404).json({error: 'Associated task not found.'});
            return;
        }
        if (task.client.toString() !== req.userId) {
            res.status(403).json({error: 'Not authorized to accept bids on this task.'});
            return;
        }
        if (task.status !== 'open') {
            res.status(400).json({error: 'This task is no longer open for hire.'});
            return;
        }
        const client = await User.findById(req.userId);
        if (!client) {
            res.status(404).json({error: 'Client profile not found.'});
            return;
        }
        if (client.walletBalance < bid.bidAmount) {
            res.status(400).json({error: `Insufficient wallet balance. You need ₹${bid.bidAmount} but only have ₹${client.walletBalance.toFixed(2)}. Please add funds to your wallet.`});
            return;
        }
        bid.status = 'accepted';
        await bid.save();

        await Bid.updateMany(
            {task: task._id, _id: {$ne: bid._id}},
            {status: 'rejected'}
        );
        client.walletBalance -= bid.bidAmount;
        await client.save();

        task.status = 'assigned';
        task.assignedTasker = bid.tasker;
        task.escrowAmount = bid.bidAmount;
        await task.save();

        const transaction = new Transaction({
            user: client._id,
            amount: -bid.bidAmount,
            type:'escrow_lock',
            task: task._id,
            description: `Funds locked in escrow for errand: "${task.title}"`
        });
        await transaction.save();
        const taskerNotification = new Notification({
            user: bid.tasker,
            title: 'Offer Accepted! 🎉',
            body: `Your bid of ₹${bid.bidAmount} was accepted for the errand: "${task.title}". You are hired!`,
            type: 'bid_accepted',
            task: task._id
        });
        await taskerNotification.save();
        const io = req.app.get('io');
        io.to(bid.tasker.toString()).emit('new_notification', taskerNotification);
        res.json({message: 'Bid accepted, payment locked in escrow, and tasker hired!,task, bid'});
    } catch (error) {
        console.error('Accept bid error:', error);
        res.status(500).json({error: 'server error accepting bid.'});
    }
});

router.post('/:id/counter', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const {counterAmount} = req.body;
        if (!counterAmount || counterAmount <= 0) {
            res.status(400).json({error: 'Please specify a valid counter-offer amount.'});
            return;
        }
        const bid = await Bid.findById(req.params.id);
        if (!bid) {
            res.status(404).json({error: 'Bid not found.'});
            return;
        }
        const task = await Task.findById(bid.task);
        if (!task) {
            res.status(404).json({error: 'Associated task not found.'});
            return;
        }
        if (task.client.toString() !== req.userId) {
            res.status(403).json({error: 'Not authorized to negotiate on this task.'});
            return;
        }
        if (task.status !== 'open') {
            res.status(400).json({error: 'This task is no longer open.'});
            return;
        }
        bid.status = 'countered';
        bid.counterAmount = counterAmount;
        await bid.save();
        const counterNotification = new Notification({
            user: bid.tasker,
            title: 'Counter-Offer Received! 🤝',
            body: `Client offered a counter budget of ₹${counterAmount} for: "${task.title}".`,
            type: 'bid_received',
            task: task._id
    });
        await counterNotification.save();
        const io = req.app.get('io');
        io.to(bid.tasker.toString()).emit('new_notification', counterNotification);
        res.json({message: 'Counter-offer submitted successfully'});
    } catch (error) {
        console.error('Counter bid error:', error);
        res.status(500).json({error: 'Server error counter-offering'});
    }
});

router.post('/:id/accpt-counter', authMiddleware, async(req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid || bid.status !== 'countered' || !bid.counterAmount) {
            res.status(400).json({error: 'No active counter-offer exists on this bid.'});
            return;
        }
        if (bid.tasker.toString() !== req.userId) {
            res.status(403).json({error: 'Not authorized to accept this counter-offer.'});
            return;
        }
        const task = await Task.findById(bid.task);
        if(!task || task.status !== 'open') {
            res.status(400).json({error: 'Associated task is not open.'});
            return;
        }
        const client = await User.findById(task.client);
        if (!client) {
            res.status(404).json({error: 'Client account not found.'});
            return;
        }
        const finalAmount = bid.counterAmount;
        if (client.walletBalance < finalAmount) {
            res.status(400).json({error: 'Client has insufficient wallet balance to cover the countered budget.'});
            return;
        }
        bid.status = 'accepted';
        bid.bidAmount = finalAmount;
        bid.counterAmount = undefined;
        await bid.save();

        await Bid.updateMany(
            {task: task._id, _id: {$ne: bid._id}},
            {status: 'rejected'}
        );
        client.walletBalance -= finalAmount;
        await client.save();

        task.status = 'assigned';
        task.assignedTasker = bid.tasker;
        task.escrowAmount = finalAmount;
        await task.save();

        const transaction = new Transaction ({
            user: client._id,
            amount: -finalAmount,
            type: 'escrow_lock',
            task: task._id,
            description: `Escrow payment locked for: "${task.title}" (Countered)`
        });
        await transaction.save();

        const acceptNotification = new Notification({
            user: task.client,
            title: 'Counter-Offer Accepted! 🎉',
            body: `Tasker accepted your counter budget of ₹${finalAmount} for errand: "${task.title}".`,
            type: 'bid_accepted',
            task: task._id
        });
        await acceptNotification.save();

        const io = req.app.get('io');
        io.to(task.client.toString()).emit('new_notification', acceptNotification);
        res.json({message: 'Counter accepted, tasker hired, and payment locked in escrow.', bid, task});
    } catch (error) {
        console.error('Accept counter error:', error);
        res.status(500).json({error: 'Server error accepting counter.'});
    }
});

router.post('/:id/reject-counter', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid || bid.status !== 'countered') {
            res.status(400).json({error: 'No active counter-offer exists on this bid.'});
            return;
        }
        if (bid.tasker.toString() !== req.userId) {
            res.status(403).json({error: 'Not authorized.'});
            return;
        }
        const task = await Task.findById(bid.task);
        if (!task) {
            res.status(404).json({error: 'Task not found.'});
            return;
        }
        bid.status = 'rejected';
        bid.counterAmount = undefined;
        await bid.save();

        const declineNotification = new Notification({
            user: task.client,
            title: 'Counter-Offer Declined ❌',
            body: `Tasker declined your counter-offer on errand: "${task.title}".`,
            type: 'bid_received',
            task: task._id
        });
        await declineNotification.save();

        const io = req.app.get('io');
        io.to(task.client.toString()).emit('new_notification', declineNotification);
        res.json({message: 'Counter-offer declined and bid rejected.', bid});
    } catch (error) {
        console.error('Reject counter error:', error);
        res.status(500).json({error: 'Server error declining counter.'});
    }
});

export default router;