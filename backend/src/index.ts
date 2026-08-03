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
import notificationRoutes from './routes/notifications';
import Message from './models/Message';
import reviewRoutes from './routes/reviews';
import chatbotRoutes from './routes/chatbot';

dotenv.config();

const app = express();
const PORT = process.env.post || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dihadi';

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        methods: ['GET', 'POST']
    }
});

app.set('io', io);

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb', extended: true}));
app.use(cors({origin: ['http://localhost:5173', 'http://localhost:5174']}));
app.use(helmet({contentSecurityPolicy: false}));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/notifcations', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({status: 'ok', message: 'Dihadi.com Backend Server is running smoothly!'});
});
const onlineUsers = new Map<string, string>();
const userSockets = new Map<string, string>();

io.on('connection', (socket) => {
    console.log(`User connected to socket: ${socket.id}`);
    socket.on('register_active_user', (data: {userId: string, taskId: string}) => {
        const {userId, taskId} = data;
        onlineUsers.set(userId, socket.id);
        userSockets.set(socket.id, userId);
        io.to(taskId).emit('user_status_update', {userId, isOnline: true});
    });
    socket.on('check_user_online', (data: {targetUserId: string}, callback: (isOnline: boolean) => void) => {
        const isOnline = onlineUsers.has(data.targetUserId);
        callback(isOnline);
    });
    socket.on('join_room', (taskId: string) => {
        socket.join(taskId);
        console.log(`Socket ${socket.id} joined chat room: ${taskId}`);
    });

    socket.on('share_location', (data: {taskId: string; coordinated: [number, number]}) => {
        io.to(data.taskId).emit('location_update', data.coordinated);
    });

    socket.on('send_message', async (data: {taskId: string; senderId: string; text?: string; attachment?: string; audio?: string}) => {
        try {
            const {taskId, senderId, text, attachment, audio} = data;
            const message = new Message ({
                task: taskId,
                sender: senderId,
                text,
                attachment,
                audio
            });
            await message.save();
            const populatedMessage = await message.populate('sender', 'name');
            io.to(taskId).emit('receive_message', populatedMessage);
        } catch (err) {
            console.error('Socket message error:', err);
        }
    });

    socket.on('add_reaction', async (data: {messageId: string; userId: string; emoji: string}) => {
        try {
            const {messageId, userId, emoji} = data;
            const msg = await Message.findById(messageId);
            if (!msg) return;

            if (!msg.reactions) {
                msg.reactions = [];
            }
            const existingIdx = msg.reactions.findIndex(r => r.user.toString() === userId);

            if (existingIdx > -1) {
                if (msg.reactions[existingIdx].emoji === emoji) {
                    msg.reactions.splice(existingIdx, 1);
                } else {
                    msg.reactions[existingIdx].emoji = emoji;
                }
            } else {
                msg.reactions.push({user: new mongoose.Types.ObjectId(userId) as any, emoji});
            }
            await msg.save();

            const populatedMsg = await msg.populate([
                {path: 'sender', select: 'name'},
                {path: 'reactions.user', select: 'name'}
            ]);
            io.to(msg.task.toString()).emit('reactions_updated', populatedMsg);
        } catch (err) {
            console.error('Socket reaction error:', err);
        }
    });

    socket.on('typing_status', (data: {taskId: string; userId: string; name: string; isTyping: boolean}) => {
        socket.to(data.taskId).emit('typing_update', data);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        const userId = userSockets.get(socket.id);
        if (userId) {
            onlineUsers.delete(userId);
            userSockets.delete(socket.id);
            io.emit('user_status_update', {userId, isOnline: false});
        }
    });
});

mongoose.connect(MONGO_URI)
.then(() => {
    console.log('Successfully connected to MongoDB Database');
    server.listen(PORT, () => {
        console.log(`Sever is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
});