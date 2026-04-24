import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
    name: string;
    email?: string; // Opcional (a veces solo tienes Instagram o WhatsApp)
    phone?: string;
    socialHandle?: string; // Ej: @juanperez (IG)
    source: string; // De dónde vino (Instagram, Local, etc)
    totalSpent: number; // Cuánto dinero nos dejó en total
    orderCount: number; // Cuántas veces compró
    lastOrderDate: Date;
    notes?: string;
    tenantId: string;
}

const ClientSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    socialHandle: { type: String },
    source: { type: String, default: 'local' },
    
    // Métricas Automáticas
    totalSpent: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    lastOrderDate: { type: Date },
    
    notes: { type: String },
    tenantId: { type: String, required: true }
}, { timestamps: true });

// Índice para buscar rápido por nombre o red social
ClientSchema.index({ name: 'text', socialHandle: 'text' });
ClientSchema.index({ tenantId: 1, totalSpent: -1 });

export default mongoose.model<IClient>('Client', ClientSchema);