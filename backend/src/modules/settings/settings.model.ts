import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    businessName: string;
    adminPhone: string; // El número que recibe las alertas (Ej: 549379...)
    currencySymbol: string;
    welcomeMessage: string; // Para el bot
    filamentCostAverage: number; // Costo promedio por kg (para cálculos rápidos)
    tenantId: string;
}

const SettingsSchema: Schema = new Schema({
    businessName: { type: String, default: 'Global 3D' },
    adminPhone: { type: String, default: '' }, 
    currencySymbol: { type: String, default: '$' },
    welcomeMessage: { type: String, default: 'Hola, bienvenido a Global 3D.' },
    filamentCostAverage: { type: Number, default: 15000 },
    tenantId: { type: String, default: 'global3d_hq' }
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);