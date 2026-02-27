import mongoose, { Schema, Document } from "mongoose";

// 1. 👇 Agrega 'sku' a la Interfaz (TypeScript)
export interface IProduct extends Document {
  name: string;
  category: string;
  description?: string;
  imageUrl?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  isPublic: boolean;
  tenantId: string;
  sku?: string; // 👈 ESTO ES LO QUE TE FALTA AQUI
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: "General" },
    description: { type: String },
    imageUrl: { type: String },
    price: { type: Number, required: true },
    cost: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    minStock: { type: Number, default: 5 },
    isPublic: { type: Boolean, default: false },
    tenantId: { type: String, required: true, index: true },
    
    // 2. 👇 Agrega 'sku' al Schema (Base de Datos)
    sku: { type: String, required: false, default: "" }, 
  },
  {
    timestamps: true,
  }
);



// 🔍 Búsqueda por texto
ProductSchema.index({ name: "text" });

export default mongoose.model<IProduct>("Product", ProductSchema);
