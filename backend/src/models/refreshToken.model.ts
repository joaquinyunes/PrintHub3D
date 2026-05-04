import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
}

const RefreshTokenSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
