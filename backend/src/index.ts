import express, {Request, Response} from 'express';
import http from 'http';
import {Server} from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import bidRoutes from './routes/bids';
import walletRoutes from './routes/wallet';
import messageRoutes from './routes/messages';
import Message from './models/Message';
import reviewRoutes from './routes/reviews';

dotenv.config();

const app = express();
const PORT = process.env.POST || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dihadi';

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        methods: ['GET', 'POST']
    }
});

app.use(express.json());
app.use(cors({origin: ['http://localhost:5173', 'http://localhost:5174']}));
app.use(helmet({contentSecurityPolicy: false}));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews',reviewRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({status: 'ok', message: 'Dihadi.com Backend Server is running smoothly!'});
});
io.on('connection', (socket) => {
    console.log(`User connected to socket: ${socket.id}`);

    socket.on('join_room', (taskId: string) => {
        socket.join(taskId);
        console.log(`Socket ${socket.id} joined chat room: ${taskId}`);
    });

    socket.on('Send_message', async (data: {taskId: string; senderId: string;  text: string}) => {
        try {
            const {taskId, senderId, text} = data;
            const newMessage = new Message({
                task: taskId,
                sender: senderId,
                text
            });
            await newMessage.save();
            const populatedMsg = await newMessage.populate('sender', 'name');
            io.to(taskId).emit('receive_message', populatedMsg);
        } catch (err) {
            console.error('Socket message save error:', err);
        }
    });
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

mongoose.connect(MONGO_URI)
.then(() => {
    console.log('Successfully connected to MongoDB Database');
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
});