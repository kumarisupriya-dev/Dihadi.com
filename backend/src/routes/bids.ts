import {Router, Response} from 'express';
import Bid from '../models/Bid';
import Task from '../models/Task';
import {authMiddleware, AuthRequest} from '../middleware/auth';
import Auth from "./auth";

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
        if (task.client.toString() !== req.userId) {
            res.status(403).json({error: 'Not authorized to view bids for this task.'})
            return;
        }
        const bids = await Bid.find({task: taskId})
            .populate('tasker', 'name rating isVerified reviewCount')
            .sort({createdAt: -1});

        res.json(bids);
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
        bid.status = 'accepted';
        await bid.save();

        await Bid.updateMany(
            {task: task._id, id: {$ne: bid._id} },
            {status: 'rejected'}
        );
        task.status = 'assigned';
        task.assignedTasker = bid.tasker;
        await task.save();
        res.json({message: 'Bid accepted successfully and tasker assigned!', task, bid});
    } catch (error) {
        console.error('Accept bid error:', error);
        res.status(500).json({error: 'Server error accepting bid.'});
    }
});

export default router;