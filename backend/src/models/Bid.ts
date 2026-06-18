import mongoose, {Schema, Document} from 'mongoose';

export interface IBid extends Document {
    task: mongoose.Types.ObjectId;
    tasker: mongoose.Types.ObjectId;
    bidAmount: number;
    estimatedTime: string;
    message?: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
}

const BidSchema: Schema = new Schema({
    task: {type: Schema.Types.ObjectId, ref: 'Task', required: true},
    tasker: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    bidAmount: {type: Number, required: true, min: 1},
    estimatedTime: {type: String, required: true},
    message: {type: String},
    status: {type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending'},
    createdAt: {type: Date, default: Date.now}
});
BidSchema.index({task: 1, tasker: 1}, {unique: true});

export default mongoose.model<IBid>('Bid', BidSchema);
