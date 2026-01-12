import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    text: string;
    completed: boolean;
    tenantId: string;
    createdAt: Date;
}

const TaskSchema: Schema = new Schema({
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    tenantId: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<ITask>('Task', TaskSchema);