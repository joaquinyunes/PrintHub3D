import mongoose, { Schema, Document } from 'mongoose';

export interface IFilament extends Document {
  brand: string;
  material: string; // PLA, PETG, ABS, TPU...
  color: string;
  costPerKg: number; // costo de una bobina de 1kg
  gramsTotal: number; // gramos que trae la bobina (default 1000)
  gramsRemaining: number; // gramos disponibles ahora
  spools: number; // cantidad de bobinas de este tipo
  lowThresholdGrams: number; // alerta cuando gramsRemaining cae por debajo
  sku?: string;        // SKU del catálogo (hoja "Stock Sync")
  salePrice?: number;  // precio de venta de la bobina
  notes: string;
  importBatch?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const FilamentSchema: Schema = new Schema(
  {
    brand: { type: String, required: true, trim: true },
    material: { type: String, required: true, trim: true, default: 'PLA' },
    color: { type: String, required: true, trim: true, default: 'Negro' },
    costPerKg: { type: Number, required: true, default: 0, min: 0 },
    gramsTotal: { type: Number, default: 1000, min: 0 },
    gramsRemaining: { type: Number, default: 1000, min: 0 },
    spools: { type: Number, default: 1, min: 0 },
    lowThresholdGrams: { type: Number, default: 200, min: 0 },
    sku: { type: String, default: '', trim: true, index: true },
    salePrice: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
    importBatch: { type: String, index: true },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

FilamentSchema.index({ tenantId: 1, material: 1, color: 1 });

export default mongoose.model<IFilament>('Filament', FilamentSchema);
