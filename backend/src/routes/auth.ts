import {Router, Request, Response} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import {authMiddleware, AuthRequest} from "../middleware/auth";

const router = Router();
const generateToken = (userId: string): string => {
    return jwt.sign(
        {userId},
        process.env.JWT_SECRET || 'dihadi_super_secure_secret_key_2026',
        {expiresIn: '7d'}
    );
};

router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
      const {name, email, password, coordinates} = req.body;
      const existingUser = await User.findOne({email});
      if (existingUser) {
          res.status(400).json({error: 'User already exists with this email'});
          return;
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const newUser = new User({
          name,
          email,
          passwordHash,
          location: coordinates ? {type: 'Point', coordinates} : undefined
      });

      await newUser.save();
      const token = generateToken(newUser._id.toString());
      res.status(201).json({
          token,
          user: {
              id: newUser._id,
              name: newUser.name,
              email: newUser.email,
              walletBalance: newUser.walletBalance,
              location: newUser.location,
              isVerified: newUser.isVerified
          }
      });
  } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({error: 'Server error during registration'});
      return;
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if (!user) {
            res.status(400).json({error: 'Invalid email or password'});
            return;
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(400).json({error: 'Invalid email or password'});
            return;
        }
        const token = generateToken(user._id.toString());
        res.json({token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            walletBalance: user.walletBalance,
            location: user.location,
            isVerified: user.isVerified
        }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({error: 'Server error during login'});
    }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) : Promise<void> => {
    try {
        const user = await User.findById(req.userId).select('-passwordHash');
        if (!user) {
            res.status(404).json({error: 'User not found'});
            return;
        }
        res.json({user});
    } catch (error) {
        res.status(500).json({error: 'server error fetching profile'});
    }
});

export default router;