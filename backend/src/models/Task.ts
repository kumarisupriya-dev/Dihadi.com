import mongoose, {Schema, Document} from 'mongoose';

export interface ITask extends Document {
    title: string;
    description: string;
    category: string;
    budget: number;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    address: string;
    status: 'open' | 'assigned' | 'completed';
    client: mongoose.Types.ObjectId;
    assignedTasker?: mongoose.Types.ObjectId;
    escrowAmount: number;
    createdAt: Date;
}

const TaskSchema: Schema = new Schema({
    title: {type: String, required: true, trim: true},
    description: {type: String, required: true},
    category: {type: String, required: true},
    budget: {type: Number, required: true, min: 1},
    location: {
        type: {type: String, enum: ['Point'], default: 'Point', required: true},
        coordinates: {type: [Number], required: true, index:'2dsphere'},
    },
    address: {type: String, required: true},
    status: {type: String, enum: ['open', 'assigned', 'completed'], default: 'open'},
    client: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    assignedTasker: {type: Schema.Types.ObjectId, ref: 'User'},
    escrowAmount: {type: Number, default: 0},
    createdAt: {type: Date, default: Date.now}
});

export default mongoose.model<ITask>('Task', TaskSchema);
