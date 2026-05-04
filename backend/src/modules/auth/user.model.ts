import mongoose, { Schema, Document } from 'mongoose';
import { appConfig } from '../../config';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'client';
    tenantId: string;
    createdAt: Date;
    verified: boolean;
    verificationToken?: string;
    verificationExpires?: Date;
    magicCode?: string;
    magicCodeExpires?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    loginAttempts?: number;
    lockUntil?: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'client'], default: 'client' }, 
    tenantId: { type: String, default: appConfig.defaultTenantId },
    verified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationExpires: { type: Date },
    magicCode: { type: String },
    magicCodeExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
