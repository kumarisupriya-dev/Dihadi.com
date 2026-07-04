import mongoose, {Schema, Document} from 'mongoose';

export interface IMessage extends Document {
    task: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
}

const MessageSchema: Schema = new Schema({
    task: {type: Schema.Types.ObjectId, ref: 'Task', required: true},
    sender: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    text: {type: String, required: true},
    createdAt: {type: Date, default: Date.now}
});

export default mongoose.model<IMessage>('Message', MessageSchema);