import mongoose, {Schema, Document} from 'mongoose';

export interface ISystemTreasury extends Document {
    totalFeesCollected: number;
    updatedAt: Date;
}

const SystemTreasurySchema: Schema = new Schema({
    totalFeesCollected: {type: Number, default :0},
    updatedAt: {type: Date, default: Date.now}
});

export default mongoose.model<ISystemTreasury>('SystemTreasury', SystemTreasurySchema);
