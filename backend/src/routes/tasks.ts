import {Router, Response} from 'express';
import Task from '../models/Task';
import {authMiddleware, AuthRequest} from '../middleware/auth';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Notification from '../models/Notification';
import SystemTreasury  from '../models/SystemTreasury';

const router = Router();
router.post('/', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const {title, description, category, budget, coordinates, address} = req.body;
        if (!title || !description || !category || !budget || !coordinates || !address) {
            res.status(400).json({error: 'Please enter all required fields, including location.'});
            return;
        }
        if (coordinates.length !==2 || typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
            res.status(400).json({error: 'Invalid location coordinates. Must be [longitude, latitude].'});
            return;
        }
        const newTask= new Task({
            title,
            description,
            category,
            budget,
            location: {
                type: 'Point',
                coordinates
            },
            address,
            client:  req.userId,
            status: 'open'
        });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Create task error:, error');
        res.status(400).json({error: 'Server error creating task'});
    }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response):
    Promise<void> => {
    try {
        const {category, lat, lng, radius} = req.query;
        const query: any = {status: 'open'};
        if (category) {
            query.category = category;
        }
        if (lat && lng) {
            const radiusInKm = parseFloat(radius as string) || 10;
            const distanceInMeters = radiusInKm * 1000;
            query['location.coordinates'] = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng as string), parseFloat(lat as string)]
                    },
                    $maxDistance: distanceInMeters
                }
            };
        }
        const tasks = await Task.find(query).populate('client', 'name rating isVerified');
        res.json(tasks);
    } catch (error) {
        console.error('Fetch tasks error:', error);
        res.status(500).json({error: 'Server error fetching tasks. Ensure MongoDB 2dsphere index is built.'});
    }
    });

router.get('/my-posts', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const tasks = await Task.find({client: req.userId}).sort({createdAt: -1});
        res.json(tasks);
    } catch (error) {
        console.error('Fetch client tasks error:', error);
        res.status(500).json({error: 'Server error fetching client tasks'});
    }
});

router.get('/my-jobs', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const tasks = await Task.find({assignedTasker: req.userId}).populate('client', 'name').sort({createdAt: -1});
        res.json(tasks);
    } catch (error) {
        console.error('Fetch assigned tasks error:', error);
        res.status(500).json({error: 'Server error fetching assigned tasks.'});
    }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('client', 'name email rating isVerified reviewCount')
            .populate('assignedTasker', 'name email rating isVerified ');
        if (!task) {
            res.status(404).json({error: 'Task not found'});
            return;
        }
        res.json(task);
    } catch (error) {
        console.error('Fetch single task error:', error);
        res.status(500).json({error: 'Server error fetching tasks details'});
    }
});

router.post('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            res.status(404).json({error: 'Errand not found.'});
            return;
        }
        if (task.status !== 'assigned') {
            res.status(400).json({error: 'Errand is not currently in progress.'});
            return;
        }
        if (task.client.toString() !== req.userId) {
            res.status(403).json({error: 'Not authorized to complete this task.'});
            return;
        }
        const tasker = await User.findById(task.assignedTasker);
        if (!tasker) {
            res.status(404).json({error: 'Hired tasker account not found.'});
            return;
        }

        const feeAmount = Math.round(task.escrowAmount * 0.05);
        const releaseAmount = task.escrowAmount - feeAmount;

        tasker.walletBalance += releaseAmount;
        await tasker.save();

        await SystemTreasury.findOneAndUpdate(
            {},
            {$inc: {totalFeesCollected: feeAmount}, updatedAt: new Date()},
            {upsert: true, new: true}
        );
        task.status = 'completed';
        task.escrowAmount = 0;
        await task.save();

        const taskerTx = new Transaction({
            user: tasker._id,
            amount: releaseAmount,
            type: 'payment_received',
            task: task._id,
            description: `Received payment for: "${task.title}" (Escrow payout minus 5% platform fee)`
        });
        await taskerTx.save();
    if (task.assignedTasker) {
        const payoutNotification = new Notification({
            user: task.assignedTasker,
            title: 'Payment Released! 💰',
            body: `Client confirmed completion. Payout of ₹${releaseAmount} (escrow budget minus 5% platform commission) is released to your wallet.`,
            type: 'payment_released',
            task: task._id
        });
        await payoutNotification.save();

        const io = req.app.get('io');
        io.to(task.assignedTasker.toString()).emit('new_notification', payoutNotification);
    }
        res.json({message: 'Task marked completed, platform fee deducted, and payment released!', task});
    } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({error: 'Server error marking task completed.'});
    }
});

router.post('/:id/submit-proof', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const {documentBase64, comment} = req.body;
        if (!documentBase64) {
            res.status(400).json({error: 'Please upload an image as proof of completion.'});
            return;
        }
        const task = await Task.findById(req.params.id);
        if (!task) {
            res.status(404).json({error: 'Errand not found.'});
            return;
        }
        if (task.status !== 'assigned') {
            res.status(400).json({error: 'Proof can only be submitted for assigned, in-progress tasks.'});
            return;
        }
        if (task.assignedTasker?.toString() !== req.userId) {
            res.status(403).json({error: 'Only the assigned tasker can submit completion proof.'});
            return;
        }
        task.completionProof = {
            documentBase64,
            comment,
            submittedAt: new Date()
        };
        await task.save();
        const proofNotification = new Notification({
            user: task.client,
            title: 'Completion Proof Submitted! 📸',
            body: `Tasker submitted photo proof for errand: "${task.title}". Review it now.`,
            type: 'bid_received',
            task: task._id
        });
        await proofNotification.save();

        const io = req.app.get('io');
        io.to(task.client.toString()).emit('new_notification', proofNotification);
        res.json({message: 'Completion proof submitted successfully.', task});
    } catch (error) {
        console.error('Submit proof error:', error);
        res.status(500).json({error: 'Server error submitting completion proof.'});
    }
});

router.post('/:id/dispute', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const {reason} = req.body;
        if (!reason) {
            res.status(400).json({error: 'Please specify a reason for raising the dispute.'});
            return;
        }
        const task = await Task.findById(req.params.id);
        if (!task) {
            res.status(404).json({error: 'Errand not found.'});
            return;
        }
        if (task.status !== 'assigned') {
            res.status(400).json({error: 'Disputes can only be raised on in-progress errands.'});
            return;
        }
        if (task.client.toString() !== req.userId) {
            res.status(403).json({error: 'Only the client can dispute this errand.'});
            return;
        }
        task.status = 'disputed';
        task.disputeReason = reason;
        await task.save();

        if (task.assignedTasker) {
            const disputeNotification = new Notification({
                user: task.assignedTasker,
                title: 'Errand Disputed! ⚠️',
                body: `Client raised a dispute for: "${task.title}". Escrow funds are locked.`,
                type: 'bid_received',
                task: task._id
            });
            await disputeNotification.save();
            const io = req.app.get('io');
            io.to(task.assignedTasker.toString()).emit('new_notification', disputeNotification);
        }
        res.json({message: 'Dispute raised. Funds are frozen in escrow for administrator review.', task});
    } catch (error) {
        console.error('Raise dispute error:', error);
        res.status(500).json({error: 'Server error raising dispute.'});
    }
});

router.get('/disputed-errands', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const adminUser = await User.findById(req.userId);
        if (!adminUser || !adminUser.isAdmin) {
            res.status(403).json({error: 'Admin access denied.'});
            return;
        }
        const disputedTasks = await Task.find({status: 'disputed'})
            .populate('client', 'name email rating')
            .populate('assignedTasker', 'name email rating');
        res.json(disputedTasks);
    } catch (error) {
        console.error('Fetch disputed tasks error:', error);
        res.status(500).json({error: 'Server error loading disputed tasks.'});
    }
});

router.post('/:id/resolve-dispute', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const {action} = req.body;
        if (!action || !['release_to_tasker', 'refund_to_client'].includes(action)) {
            res.status(400).json({error: 'Please specify a valid dispute resolution action.'});
            return;
        }
        const adminUser = await User.findById(req.userId);
        if (!adminUser || !adminUser.isAdmin) {
            res.status(403).json({error: 'Admin access denied.'});
            return;
        }
        const task = await Task.findById(req.params.id);
        if (!task || task.status !== 'disputed') {
            res.status(400).json({error: 'Task is not currently disputed.'});
            return;
        }
        const escrow = task.escrowAmount;
        if (escrow <= 0) {
            res.status(400).json({error: 'No locked escrow amount exists for this dispute.'});
            return;
        }
        const client = await User.findById(task.client);
        const tasker = await User.findById(task.assignedTasker);
        if (!client || !tasker) {
            res.status(404).json({error: 'Client or tasker accounts not found.'});
            return;
        }
        const io = req.app.get('io');
        if (action === 'release_to_tasker') {
            const feeAmount = Math.round(escrow * 0.05);
            const releaseAmount = escrow - feeAmount;
            tasker.walletBalance += releaseAmount;
            await tasker.save();

            await SystemTreasury.findOneAndUpdate(
                {},
                {$inc: {totalFeesCollected: feeAmount}, updatedAt: new Date()},
                {upsert: true, new: true}
            );

            const taskerTx = new Transaction({
                user: tasker._id,
                amount: releaseAmount,
                type: 'payment_received',
                task: task._id,
                description: `Dispute Resolution: Payout released for completes on: "${task.title}" (Escrow minus 5% fee)`
            });
            await taskerTx.save();

            task.status = 'completed';
            task.escrowAmount = 0;
            await task.save();

            const taskerNotif = new Notification({
                user: tasker._id,
                title: 'Escrow Payout Credited! 💰',
                body: `Admin resolved dispute for: "${task.title}" in your favor. ₹${releaseAmount} credited.`,
                type: 'payment_released',
                task: task._id
            });
            await taskerNotif.save();
            io.to(tasker._id.toString()).emit('new_notification', taskerNotif);

            const clientNotif = new Notification({
                user: client._id,
                title: 'Dispute Resolved (Escrow Released) ⚖️',
                body: `Admin resolved dispute for: "${task.title}". Escrow was released to the tasker.`,
                type: 'payment_released',
                task: task._id
            });
            await clientNotif.save();
            io.to(client._id.toString()).emit('new_notification', clientNotif);
        } else if (action === 'refund_to_client') {
            client.walletBalance += escrow;
            await client.save();

            const clientTx = new Transaction({
                user: client._id,
                amount: escrow,
                type: 'deposit',
                task: task._id,
                description: `Dispute Refund: Escrow returned from resolved dispute on: "${task.title}"`
            });
            await clientTx.save();

            task.status = 'completed';
            task.escrowAmount = 0;
            await task.save();

            const taskerNotif = new Notification({
                user: tasker._id,
                title: 'Dispute Resolved (Escrow Refunded) ❌',
                body: `Admin resolved dispute for: "${task.title}". Escrow refunded to client.`,
                type: 'payment_released',
                task: task._id
            });
            await taskerNotif.save();
            io.to(tasker._id.toString()).emit('new_notification', taskerNotif);

            const clientNotif = new Notification({
                user: 'client._id',
                title: 'Escrow Refund Credited! 💰',
                body: `Admin refunded escrow for: "${task.title}". ₹${escrow} returned to wallet.`,
                type: 'payment_released',
                task: task._id
            });
            await clientNotif.save();
            io.to(client._id.toString()).emit('new_notification', clientNotif);
        }
        res.json({message: `Dispute resolved successfully with action: ${action}.`, task});
    } catch (error) {
        console.error('Resolve dispute error:, error');
        res.status(500).json({error: 'Server error resolving dispute.'});
    }
});

router.get('/treasury-stats', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const adminUser = await User.findById(req.userId);
        if (!adminUser || !adminUser.isAdmin) {
            res.status(403).json({error: 'Admin access denied.'});
            return;
        }
        const treasury = await SystemTreasury.findOne({});

        const lockedEscrow = await Task.aggregate([
            {$match: {status: {$in: ['assigned', 'disputed']}}},
            {$group: {_id: null, total: {$sum: '$escrowAmount'}}}
        ]);
        const activeEscrowAmount = lockedEscrow[0]?.total || 0;

        res.json({
            totalFeesCollected: treasury?.totalFeesCollected || 0,
            activeEscrowAmount
        });
    } catch (error) {
        console.error('Fetch treasury stats error:', error);
        res.status(500).json({error: 'Server error retrieving system treasury statistics.'});
    }
});

export default router;