import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
    name: string;
    email?: string;
    phone?: string;
    socialHandle?: string;
    source: string;
    avatar?: string;
    totalSpent: number;
    orderCount: number;
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
    avatar: { type: String },
    
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