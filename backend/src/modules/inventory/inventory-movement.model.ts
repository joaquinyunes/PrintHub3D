import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryMovement extends Document {
  tenantId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'adjustment_add' | 'adjustment_remove' | 'order_consumption' | 'initial_stock';
  quantity: number;
  previousStock: number;
  newStock: number;
  unit: string;
  reason?: string;
  userId?: string;
  userName?: string;
  orderId?: string;
  createdAt: Date;
}

const InventoryMovementSchema: Schema = new Schema({
  tenantId: { type: String, required: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  productName: { type: String, required: true },
  type: {
    type: String,
    enum: ['sale', 'adjustment_add', 'adjustment_remove', 'order_consumption', 'initial_stock'],
    required: true,
  },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  unit: { type: String, default: 'unidades' },
  reason: { type: String },
  userId: { type: String },
  userName: { type: String },
  orderId: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

InventoryMovementSchema.index({ tenantId: 1, createdAt: -1 });
InventoryMovementSchema.index({ productId: 1, createdAt: -1 });

export default mongoose.model<IInventoryMovement>('InventoryMovement', InventoryMovementSchema);
