import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    userId?: string;
}
export const authMiddleware= (req:AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        res.status(401).json({error: 'Authorization denied. No token provided.'});
        return;
    }
const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dihadi_super_secure_secret_key_2026') as {userId: string};
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({error: 'Token is invalid or expired.'});
    }
};
