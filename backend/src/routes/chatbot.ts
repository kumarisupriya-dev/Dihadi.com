import express, {Request, Response} from 'express';
import {ChatbotService} from "../services/chatbotService";

const router = express.Router();

router.post('/', (req: Request, res: Response) => {
    try {
        const {message} = req.body;
        if (!message) {
            return res.status(400).json({message: 'Message content is required.'});
        }
        const reply = ChatbotService.generateReply(message);
        return res.json({reply});
    } catch (err: any) {
        return res.status(500).json({message: err.message || 'Internal server error.'});
    }
});

export default router;