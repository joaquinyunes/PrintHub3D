import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'staff' | 'client';
    tenantId: string; // A qué negocio pertenece
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff', 'client'], default: 'client' },
    tenantId: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);