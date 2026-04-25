import mongoose, { Document, Schema } from 'mongoose';

export interface IHomePrinter extends Document {
  name: string;
  price?: number;
  imageUrl?: string;
  link?: string;
  description?: string;
  category?: string;
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const HomePrinterSchema: Schema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  link: { type: String, default: '' },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  tenantId: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IHomePrinter>('HomePrinter', HomePrinterSchema);
