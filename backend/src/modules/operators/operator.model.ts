import mongoose, { Schema, Document } from 'mongoose';

export interface IOperator extends Document {
  tenantId: string;
  name: string;
  pinHash: string;
  active: boolean;
  failedAttempts: number;
  lockUntil: Date | null;
  lastLoginAt: Date | null;
}

const OperatorSchema = new Schema<IOperator>(
  {
    tenantId: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    pinHash: { type: String, required: true, select: false },
    active: { type: Boolean, default: true },
    failedAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);
OperatorSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export default mongoose.model<IOperator>('Operator', OperatorSchema);
