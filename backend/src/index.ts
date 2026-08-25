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
import reviewRoutes from './routes/reviews';
import chatbotRoutes from './routes/chatbot';
import {setupSockets} from "./sockets/socketHandler";

dotenv.config();

const app = express();
const PORT = process.env.post || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dihadi';

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            callback(null, true);
        },
        methods: ['GET', 'POST']
    }
});

app.set('io', io);
setupSockets(io);

app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({limit: '10mb', extended: true}));
app.use(cors({
    origin: (origin, callback) => {
        callback(null, true);
    },
    credentials: true
}));
app.use(helmet({contentSecurityPolicy: false}));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({status: 'ok', message: 'Dihadi.com Backend Server is running smoothly!'});
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