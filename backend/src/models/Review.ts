import mongoose, {Schema, Document} from 'mongoose';

export interface IReview extends Document {
    task: mongoose.Types.ObjectId;
    reviewer: mongoose.Types.ObjectId;
    reviewee: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
    task: {type: Schema.Types.ObjectId, ref: 'Task', required: true},
    reviewer: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    reviewee: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    rating: {type: Number, required: true, min: 1, max: 5},
    comment: {type: String, trim: true},
    createdAt: {type: Date, default: Date.now}
});

ReviewSchema.index({task: 1}, {unique: true});

export default mongoose.model<IReview>('Review', ReviewSchema);