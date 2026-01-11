import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    customerName: string;
    source: string;
    status: 'pendiente' | 'imprimiendo' | 'terminado' | 'entregado' | 'cancelado';
    items: Array<{
        productId?: mongoose.Types.ObjectId;
        productName: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number; // Ingreso Venta
    totalCost: number;   // Costo Producción
    profit: number;      // Ganancia Neta
    printTimeMinutes: number;
    startedAt?: Date;
    finishedAt?: Date;
    dueDate?: Date;
    adminNotified: boolean;
    notes?: string;
    tenantId: string;
    createdAt: Date;
}

const OrderSchema: Schema = new Schema({
    customerName: { type: String, required: true },
    source: { type: String, default: 'local' },
    status: { 
        type: String, 
        enum: ['pendiente', 'imprimiendo', 'terminado', 'entregado', 'cancelado'], 
        default: 'pendiente' 
    },
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        productName: String,
        quantity: Number,
        price: Number
    }],
    totalAmount: { type: Number, required: true },
    totalCost: { type: Number, default: 0 }, // 👈 Nuevo
    profit: { type: Number, default: 0 },    // 👈 Nuevo
    
    printTimeMinutes: { type: Number, default: 0 },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    dueDate: { type: Date },
    adminNotified: { type: Boolean, default: false },
    notes: { type: String },
    tenantId: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);