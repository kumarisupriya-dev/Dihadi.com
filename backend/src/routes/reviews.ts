import {Router, Response, Request} from 'express';
import Review from '../models/Review';
import Task from '../models/Task';
import User from '../models/User';
import {authMiddleware, AuthRequest} from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const {taskId, rating, comment} = req.body;
        if (!taskId || !rating || rating < 1 || rating > 5) {
            res.status(400).json({error: 'Please specify task ID and a rating between 1 and 5.'});
            return;
        }
        const task = await Task.findById(taskId);
        if (!task) {
            res.status(404).json({error: 'Task not found.'});
            return;
        }
        if (task.status !== 'completed') {
            res.status(400).json({error: 'Reviews can only be submitted for completed errands.'});
            return;
        }
        if (task.client.toString() !== req.userId) {
            res.status(403).json({error: 'Not authorized to submit a review for this errand.'});
            return;
        }
        if (!task.assignedTasker) {
            res.status(400).json({error: 'No tasker was assigned to this errand.'});
            return;
        }
        const existingReview = await Review.findOne({task: taskId});
        if (existingReview) {
            res.status(400).json({error: 'You have already submitted a review for this errand.'});
            return;
        }
        const newReview = new Review({
            task: taskId,
            reviewer: req.userId,
            reviewee: task.assignedTasker,
            rating,
            comment
        });
        await newReview.save();
        const reviews = await Review.find({reviewee: task.assignedTasker});
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = totalRating / reviews.length;

        await User.findByIdAndUpdate(task.assignedTasker, {
            rating: avgRating,
            reviewCount: reviews.length
        });
        res.status(201).json({message: 'Review submitted successfully!', review: newReview});
    } catch (error) {
        console.error('Submit review error:', error);
        res.status(500).json({error: 'Server error submitting review.'});
    }
});

router.get('/user/:userId', async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const reviews = await Review.find({reviewee: req.params.userId})
            .populate('reviewer', 'name')
            .sort({createdAt: -1});
        res.json(reviews);
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({error: 'Server error retrieving reviews'});
    }
});

export default router;