import mongoose, {Schema, Document} from 'mongoose';

export interface ITransaction extends Document {
    user: mongoose.Types.ObjectId;
    amount: number;
    type: 'deposit' | 'withdraw' | 'escrow_lock' | 'escrow_release' | 'payment_received';
    task?: mongoose.Types.ObjectId;
    description: string;
    createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    amount: {type: Number, required: true},
    type: {
        type: String,
        enum: ['deposit', 'withdraw', 'escrow_lock', 'escrow_release', 'payment_received'],
        required: true
    },
    task: {type: Schema.Types.ObjectId, ref: 'Task'},
    description: {type: String, required: true},
    createdAt: {type: Date, default: Date.now}
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);