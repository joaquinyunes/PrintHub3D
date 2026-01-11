import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'client'; // 👈 CLAVE: Define permisos
    tenantId: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Por defecto, cualquiera que se registre es CLIENTE
    role: { type: String, enum: ['admin', 'client'], default: 'client' }, 
    tenantId: { type: String, default: 'global3d_hq' }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);