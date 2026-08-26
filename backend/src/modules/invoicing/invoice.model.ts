import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  orderId?: mongoose.Types.ObjectId;
  saleId?: mongoose.Types.ObjectId;
  type: 'A' | 'B' | 'C' | 'NC-A' | 'NC-B' | 'NC-C';
  pointOfSale: number;
  number: number;
  cae: string;
  caeExpires: Date;
  total: number;
  net: number;
  vat: number;
  customerDoc: string; // CUIT/DNI
  customerName: string;
  pdfUrl?: string;
  status: 'emitida' | 'anulada' | 'error';
  raw?: unknown;
  tenantId: string;
  createdAt: Date;
}

const InvoiceSchema: Schema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    saleId: { type: Schema.Types.ObjectId, ref: 'Sale' },
    type: { type: String, required: true },
    pointOfSale: { type: Number, default: 1 },
    number: { type: Number },
    cae: { type: String },
    caeExpires: { type: Date },
    total: { type: Number, required: true },
    net: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },
    customerDoc: { type: String, default: '' },
    customerName: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    status: { type: String, enum: ['emitida', 'anulada', 'error'], default: 'emitida' },
    raw: { type: Schema.Types.Mixed },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export default mongoose.model<IInvoice>('Invoice', InvoiceSchema);
