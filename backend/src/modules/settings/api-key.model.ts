import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface IApiKey extends Document {
  tenantId: string;
  name: string;
  key: string;
  hashedKey: string;
  scopes: string[];
  active: boolean;
  lastUsed?: Date;
  expiresAt?: Date;
  createdBy?: string;
  createdAt: Date;
}

const ApiKeySchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  key: { type: String },
  hashedKey: { type: String, required: true, unique: true },
  scopes: [{ type: String, enum: ['orders:read', 'orders:write', 'products:read', 'products:write'] }],
  active: { type: Boolean, default: true },
  lastUsed: { type: Date },
  expiresAt: { type: Date },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
});

ApiKeySchema.index({ tenantId: 1, active: 1 });

ApiKeySchema.pre('save', function(next) {
  if (this.isNew && !this.key) {
    const raw = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
    this.key = raw;
    this.hashedKey = crypto.createHash('sha256').update(raw).digest('hex');
  }
  next();
});

export default mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
