import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dihadi';

app.use(express.json());
app.use(cors({origin: ['http://localhost:5173' ,'http://localhost:5174']}));
app.use(helmet());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (req: Request, res:Response)=> {
    res.json({status: 'ok', message: 'Dihadi.com Backend Server is running smoothly!'});
});

mongoose.connect(MONGO_URI)
.then(() => {
    console.log('Successfully connected to MongoDB Database');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
});