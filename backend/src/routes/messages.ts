import {Router, Response} from 'express';
import Message from '../models/Message';
import Task from '../models/Task';
import {authMiddleware, AuthRequest} from '../middleware/auth';

const router = Router();

router.get('/:taskId', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const {taskId} = req.params;
        const task = await Task.findById(taskId);
        if (!task) {
            res.status(404).json({error: 'Task not found.'});
            return;
        }
        if (task.client.toString() !== req.userId && task.assignedTasker?.toString() !== req.userId) {
            res.status(403).json({error: 'NNot authorized to view messages on this errand.'});
            return;
        }
        const messages = await Message.find({task: taskId})
            .populate('sender', 'name')
            .sort({createdAt: -1});
        res.json(messages);
    } catch (error) {
        console.error('Fetch messages error:', error);
        res.status(500).json({error: 'Server error fetching message logs.'});
    }
});

export default router;