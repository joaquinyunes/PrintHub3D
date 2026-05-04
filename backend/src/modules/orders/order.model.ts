import mongoose, { Schema, Document } from 'mongoose';
import mongooseDelete from 'mongoose-delete';

export interface IOrder extends Document {
    clientName: string;
    origin: string;
    status: string;
    paymentMethod: string;
    deposit: number;
    total: number;
    notes: string;
    trackingCode: string;
    customerContact?: string;
    
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
        printedQuantity?: number;
        printTimeMinutes?: number;
    }>;

    // Producción y Sistema
    printTimeMinutes?: number;
    startedAt?: Date;
    finishedAt?: Date;
    adminNotified?: boolean;
    isSaleRegistered: boolean;
    customerSatisfaction?: number;
    customerFeedback?: string;
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
    trackingCode: { type: String, required: true, index: true },
    customerContact: { type: String, default: "" },
    
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
        isCustom: { type: Boolean, default: false },
        printedQuantity: { type: Number, default: 0 },
        printTimeMinutes: { type: Number, default: 30 }
    }],

    printTimeMinutes: { type: Number, default: 0 },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    adminNotified: { type: Boolean, default: false },
    isSaleRegistered: { type: Boolean, default: false },
    customerSatisfaction: { type: Number, min: 1, max: 5 },
    customerFeedback: { type: String, default: "" },
    tenantId: { type: String, required: true }
}, { 
    timestamps: true,
    // Soft delete configurado aquí
    deletedAt: true,
    deletedBy: false
});

// Índices para consultas por tenant, fecha y estado
OrderSchema.index({ tenantId: 1, createdAt: -1 });
OrderSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ trackingCode: 1, deleted: 1 });

// Aplicar plugin de soft delete
OrderSchema.plugin(mongooseDelete, { 
    deletedAt: true,
    overrideMethods: true 
});

export default mongoose.model<IOrder>('Order', OrderSchema);