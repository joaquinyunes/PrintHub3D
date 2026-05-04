import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantSettings extends Document {
  tenantId: string;
  name: string;
  currency: {
    code: string;    // USD, ARS, EUR, MXN
    symbol: string;   // $, €, etc.
    exchangeRate: number; // Tasa de cambio respecto a USD
  };
  locale: string;     // es-AR, en-US, es-ES
  features: {
    mercadoPago: boolean;
    whatsapp: boolean;
    inventoryAudit: boolean;
    externalApi: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSettingsSchema: Schema = new Schema({
  tenantId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Mi Tienda' },
  currency: {
    code: { type: String, default: 'USD' },
    symbol: { type: String, default: '$' },
    exchangeRate: { type: Number, default: 1 },
  },
  locale: { type: String, default: 'es-AR' },
  features: {
    mercadoPago: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    inventoryAudit: { type: Boolean, default: true },
    externalApi: { type: Boolean, default: false },
  },
}, { timestamps: true });

export default mongoose.model<ITenantSettings>('TenantSettings', TenantSettingsSchema);
