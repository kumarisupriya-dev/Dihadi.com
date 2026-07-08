import {Router, Response} from 'express';
import Task from '../models/Task';
import {authMiddleware, AuthRequest} from '../middleware/auth';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Notification from '../models/Notification';

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
            res.status(404).json({error: 'Task not found.'});
            return;
        }
        if (task.client.toString() !== req.userId) {
            res.status(403).json({error: 'Not authorized to complete this task.'});
            return;
        }
        if (task.status !== 'assigned') {
            res.status(400).json({error: 'Task must be in assigned state to be completed.'});
            return;
        }
        if (!task.assignedTasker) {
            res.status(400).json({error: 'No tasker is assigned to this task.'});
            return;
        }
        const tasker = await User.findById(task.assignedTasker);
        if (!tasker) {
            res.status(404).json({error: 'Assigned tasker not found.'});
            return;
        }
        const releaseAmount = task.escrowAmount;
        tasker.walletBalance += releaseAmount;
        await tasker.save();

        task.status ='completed';
        await task.save();

        const taskerTx = new Transaction({
            user: tasker._id,
            amount: releaseAmount,
            type: 'payment_received',
            task: task._id,
            description: `Received payment for completing errand: "${task.title}"`
        });
        await taskerTx.save();
        const payoutNotification = new Notification({
            user: task.assignedTasker,
            title: 'Payment Released! 💰',
            body: `Client confirmed completion. Payout of ₹${task.escrowAmount} has been released to your wallet.`,
            type: 'payment_released',
            task: task._id
        });
        await payoutNotification.save();
        const io = req.app.get('io');
        io.to(task.assignedTasker.toString()).emit('new_notification', payoutNotification);
        res.json({message: 'Task marked completed and payment released to tasker!', task});
    } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({error:'Server error marking task completed.'});
    }
});


export default router;