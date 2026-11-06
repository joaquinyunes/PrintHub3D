import mongoose, { Schema, Document } from 'mongoose';
import { appConfig } from '../../config';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user' | 'staff' | 'reseller';
    tenantId: string;
    createdAt: Date;
    verified: boolean;
    active: boolean;
    avatar?: string;
    verificationToken?: string;
    verificationExpires?: Date;
    magicCode?: string;
    magicCodeExpires?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    loginAttempts?: number;
    lockUntil?: Date;
    tokenVersion?: number;
    totpSecret?: string;
    totpEnabled?: boolean;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user', 'staff', 'reseller'], default: 'user' }, 
    tenantId: { type: String, default: appConfig.defaultTenantId },
    verified: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    verificationToken: { type: String },
    verificationExpires: { type: Date },
    magicCode: { type: String },
    magicCodeExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    tokenVersion: { type: Number, default: 0 },
    totpSecret: { type: String, select: false },
    totpEnabled: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
