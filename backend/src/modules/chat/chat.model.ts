import mongoose, { Schema, Document } from 'mongoose';
import { appConfig } from '../../config';

export interface IMessage extends Document {
    from: string;      // El ID del cliente (Número de Teléfono o ID de Instagram/FB)
    to: string;        // Tu ID
    body: string;      // El texto
    platform: 'whatsapp' | 'instagram' | 'facebook'; // 👈 CLAVE: Distinguir la red
    senderName: string;
    timestamp: Date;
    isMine: boolean;   // True si lo escribiste tú, False si lo escribió el cliente
    tenantId: string;
}

const ChatSchema: Schema = new Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    body: { type: String, required: true },
    platform: { 
        type: String, 
        enum: ['whatsapp', 'instagram', 'facebook'], 
        required: true 
    },
    senderName: { type: String, default: 'Usuario' },
    timestamp: { type: Date, default: Date.now },
    isMine: { type: Boolean, default: false },
    tenantId: { type: String, default: appConfig.defaultTenantId }
});

// Índices para que el chat cargue rápido
ChatSchema.index({ from: 1, to: 1, timestamp: -1 });
ChatSchema.index({ tenantId: 1, timestamp: -1 });

export default mongoose.model<IMessage>('Chat', ChatSchema);