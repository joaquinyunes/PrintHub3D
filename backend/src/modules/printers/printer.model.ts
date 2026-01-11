import mongoose, { Schema, Document } from 'mongoose';

// 1. Definimos la Interfaz (Hereda de Document de Mongoose)
export interface IPrinter extends Document {
    name: string;
    printerModel: string;
    status: 'idle' | 'printing' | 'maintenance';
    currentOrderId?: string; // Puede ser string o ObjectId
    tenantId: string;
}

// 2. Definimos el Schema
const PrinterSchema: Schema = new Schema({
    name: { type: String, required: true },
    printerModel: { type: String, default: 'Generica' },
    status: { 
        type: String, 
        enum: ['idle', 'printing', 'maintenance'], 
        default: 'idle' 
    },
    currentOrderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    tenantId: { type: String, default: 'global3d_hq' }
}, { timestamps: true });

// 3. Exportamos el Modelo (Usando la interfaz IPrinter)
export default mongoose.model<IPrinter>('Printer', PrinterSchema);