import mongoose, { Schema, Document } from 'mongoose';

// 👇 ESTA ES LA PARTE IMPORTANTE (La Interfaz)
// Si no agregas los campos aquí, TypeScript marcará error en el controlador.
export interface IProduct extends Document {
    name: string;
    category: string;
    description?: string; // 👈 Campo Nuevo
    imageUrl?: string;    // 👈 Campo Nuevo
    isPublic: boolean;    // 👈 Campo Nuevo
    price: number;
    cost: number;
    stock: number;
    minStock: number;
    tenantId: string;
}

const ProductSchema: Schema = new Schema({
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    
    // Campos nuevos en la Base de Datos
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    isPublic: { type: Boolean, default: false },

    price: { type: Number, required: true },
    cost: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 5 },
    tenantId: { type: String, required: true }
}, { timestamps: true });

// Índice de texto para búsquedas
ProductSchema.index({ name: 'text' });

export default mongoose.model<IProduct>('Product', ProductSchema);