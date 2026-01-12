import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    clientName: string;
    origin: string;
    status: string;
    paymentMethod: string;
    deposit: number;
    total: number;
    notes: string;
    
    // 🆕 DATOS CLAVE
    chatLink?: string; // Link al chat del cliente
    dueDate?: Date;    // Fecha de entrega
    files: Array<{ name: string; url: string }>; // Archivos adjuntos
    
    items: Array<{
        productId?: string;
        productName: string;
        quantity: number;
        price: number;
        isCustom: boolean;
    }>;

    // Producción y Sistema
    printTimeMinutes?: number;
    startedAt?: Date;
    finishedAt?: Date;
    adminNotified?: boolean;
    isSaleRegistered: boolean;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
    clientName: { type: String, required: true },
    origin: { type: String, default: "Local" },
    status: { 
        type: String, 
        enum: ['pending', 'in_progress', 'completed', 'delivered', 'cancelled'], 
        default: 'pending' 
    },
    paymentMethod: { type: String, default: "Efectivo" },
    deposit: { type: Number, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String, default: "" },
    
    // 🆕 NUEVOS CAMPOS (Asegurados)
    chatLink: { type: String, default: "" },
    dueDate: { type: Date }, 
    files: [{ 
        name: { type: String }, 
        url: { type: String } 
    }],

    items: [{
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        isCustom: { type: Boolean, default: false }
    }],

    printTimeMinutes: { type: Number, default: 0 },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    adminNotified: { type: Boolean, default: false },
    isSaleRegistered: { type: Boolean, default: false },
    tenantId: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);