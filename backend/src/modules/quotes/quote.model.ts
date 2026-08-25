import mongoose, { Schema, Document } from 'mongoose';

export interface IQuote extends Document {
  clientName: string;
  contact: string; // whatsapp / email
  material: string;
  dimensionsMm: { x: number; y: number; z: number };
  solidity: string; // hueco | normal | solido
  infill: number;
  quantity: number;
  finish: string; // estandar | premium
  rush: boolean;
  notes: string;
  fileUrl?: string;
  estimate: {
    weightGrams: number;
    printHours: number;
    materialCost: number;
    machineCost: number;
    laborCost: number;
    unitPrice: number;
    total: number;
  };
  status: 'nuevo' | 'contactado' | 'convertido' | 'descartado';
  tenantId: string;
  createdAt: Date;
}

const QuoteSchema: Schema = new Schema(
  {
    clientName: { type: String, required: true },
    contact: { type: String, required: true },
    material: { type: String, default: 'PLA' },
    dimensionsMm: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
    solidity: { type: String, default: 'normal' },
    infill: { type: Number, default: 20 },
    quantity: { type: Number, default: 1 },
    finish: { type: String, default: 'estandar' },
    rush: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    estimate: {
      weightGrams: Number,
      printHours: Number,
      materialCost: Number,
      machineCost: Number,
      laborCost: Number,
      unitPrice: Number,
      total: Number,
    },
    status: { type: String, enum: ['nuevo', 'contactado', 'convertido', 'descartado'], default: 'nuevo' },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

QuoteSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model<IQuote>('Quote', QuoteSchema);
