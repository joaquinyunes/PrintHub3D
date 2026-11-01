import mongoose, { Schema, Document } from 'mongoose';

export interface IPiece extends Document {
  tenantId: string;
  orderId: mongoose.Types.ObjectId;
  trackingCode: string;
  clientName: string;
  customerKey: string;
  itemName: string;
  label: string;
  color: string | null;
  quantityTotal: number;
  quantityDone: number;
  status: 'pending' | 'printing' | 'done';
  dueDate: string; // YYYY-MM-DD o ''
  createdAt: Date;
  updatedAt: Date;
}

const PieceSchema = new Schema<IPiece>(
  {
    tenantId: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    trackingCode: { type: String, default: '' },
    clientName: { type: String, default: '' },
    customerKey: { type: String, default: '' },
    itemName: { type: String, default: '' },
    label: { type: String, required: true },
    color: { type: String, default: null },
    quantityTotal: { type: Number, required: true, min: 1 },
    quantityDone: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['pending', 'printing', 'done'], default: 'pending' },
    dueDate: { type: String, default: '' },
  },
  { timestamps: true },
);

PieceSchema.index({ tenantId: 1, status: 1, dueDate: 1 });
PieceSchema.index({ tenantId: 1, orderId: 1 });

export default mongoose.model<IPiece>('Piece', PieceSchema);
