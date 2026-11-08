import mongoose, { Schema, Document } from 'mongoose';

// Insumos que no son filamento (argollas, imanes, cajas, lijas): se llevan por nombre y unidad.
export interface ISupply extends Document {
  tenantId: string;
  name: string;
  nameKey: string; // nombre normalizado: evita "Imán" e "iman " como dos insumos
  unit: string;
  stock: number;
  minStock: number;
  source: 'manual' | 'sheet';
}

export const supplyKey = (name: string): string =>
  name.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ');

const SupplySchema = new Schema<ISupply>(
  {
    tenantId: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    nameKey: { type: String, required: true },
    unit: { type: String, default: 'unidades', trim: true, maxlength: 20 },
    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    source: { type: String, enum: ['manual', 'sheet'], default: 'manual' },
  },
  { timestamps: true },
);
SupplySchema.index({ tenantId: 1, nameKey: 1 }, { unique: true });

export default mongoose.model<ISupply>('Supply', SupplySchema);
