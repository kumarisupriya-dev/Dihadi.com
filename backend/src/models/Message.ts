import mongoose, {Schema, Document} from 'mongoose';

export interface IMessage extends Document {
    task: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    text?: string;
    attachment?: string;
    audio?: string;
    reactions: {
        user: mongoose.Types.ObjectId;
        emoji: string;
    }[];
    createdAt: Date;
}

const MessageSchema: Schema = new Schema({
    task: {type: Schema.Types.ObjectId, ref: 'Task', required: true},
    sender: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    text: {type: String},
    attachment: {type: String},
    audio: {type: String},
    reactions: [{
        user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
        emoji: {type: String, required: true}
    }],
    createdAt: {type: Date, default: Date.now}
});

export default mongoose.model<IMessage>('Message', MessageSchema);