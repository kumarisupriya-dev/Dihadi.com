import {Router, Response} from 'express';
import Notification from '../models/Notification';
import {authMiddleware, AuthRequest} from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const notifications = await Notification.find({user: req.userId})
            .sort({createdAt: -1})
            .limit(50);
        res.json(notifications);
    } catch (error) {
        console.error('Fetch notifications error:', error);
        res.status(500).json({error: 'Server error fetching notifications.'});
    }
});

router.post('/read-all', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        await Notification.updateMany({user: req.userId, isRead: false}, {isRead: true});
        res.json({message: 'All notifications marked as read.'});
    } catch (error) {
        console.error('Mark read notifications error:', error);
        res.status(500).json({error: 'Server error updating notifications.'});
    }
});

export default router;