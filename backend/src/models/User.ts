import mongoose, {Schema, Document} from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    location?: {
        type: 'Point';
        coordinates: [number, number];
    };
    walletBalance: number;
    isVerified: boolean;
    rating: number;
    reviewCount: number;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true, lowercase: true, trim: true},
    passwordHash: {type: String, required: true},
    location: {
        type: {type: String, enum: ['Point'], default: 'Point'},
        coordinates: {type: [Number], index: '2dsphere'}
    },
    walletBalance: {type: Number, default: 0},
    isVerified: {type: Boolean, default: false},
    rating: {type:Number, default: 0},
    reviewCount: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now}
});

export default mongoose.model<IUser>('User', UserSchema);