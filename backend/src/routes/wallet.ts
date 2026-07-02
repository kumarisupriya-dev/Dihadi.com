import {Router, Response} from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';
import {authMiddleware, AuthRequest} from '../middleware/auth';

const router = Router();

router.post('/deposit', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const {amount} = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({error: 'Please enter a valid deposit amount.'});
            return;
        }
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).json({error: 'User not found'});
            return;
        }
        user.walletBalance += Number(amount);
        await user.save();
        const transaction = new Transaction({
            user: user._id,
            amount: Number(amount),
            type: 'deposit',
            description: `Deposited ₹${amount} into wallet.`
        });
        await transaction.save();
        res.json({walletBalance: user.walletBalance, transaction});
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({error: 'Server error depositing funds.'});
    }
});

router.post ('/withdraw',authMiddleware,async (req: AuthRequest,  res: Response): Promise<void> => {
    try {
        const {amount} = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({error: 'Please enter a valid withdrawal amount.'});
            return;
        }
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).json({error: 'User not found'});
            return;
        }
        if (user.walletBalance < amount) {
            res.status(400).json({error: 'Insufficient wallet balance.'});
            return;
        }
        user.walletBalance -= Number(amount);
        await user.save();
        const transaction = new Transaction({
            user: user._id,
            amount: -Number(amount),
            type: 'withdraw',
            description: `withdrew ₹${amount} from wallet.`
        });
        await transaction.save();
        res.json({walletBalance: user.walletBalance, transaction});
    } catch (error) {
        console.error('Withdraw error:', error);
        res.status(500).json({error: 'Server error withdrawing funds.'});
    }
});

router.get('/transactions', authMiddleware, async (req: AuthRequest, res: Response):
Promise<void> => {
    try {
        const transactions = await Transaction.find({user: req.userId}).sort({createdAt: -1});
        res.json(transactions);
    } catch (error) {
        console.error('Fetch transactions error:', error);
        res.status(500).json({error: 'Server error fetching transactions.'});
    }
});

export default router;