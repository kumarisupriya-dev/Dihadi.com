import mongoose, {Schema, Document} from 'mongoose';

export interface INotification extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    body: string;
    type: 'bid_received' | 'bid_accepted' | 'payment_released' | 'chat_message';
    task?: mongoose.Types.ObjectId;
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    title: {type: String, required: true},
    body: {type: String, required: true},
    type: {
        type: String,
        enum: ['bid_received', 'bid_accepted', 'payment_released', 'chat_message'],
        required: true
    },
    task: {type: Schema.Types.ObjectId, ref: 'Task'},
    isRead: {type: Boolean, default: false},
    createdAt: {type: Date, default: Date.now}
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
