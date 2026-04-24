import mongoose, { Schema, Document } from 'mongoose';
import { appConfig } from '../../config';

export interface IUser extends Document {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    role: 'admin' | 'client';
    tenantId: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'client'], default: 'client' }, 
    tenantId: { type: String, default: appConfig.defaultTenantId }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);