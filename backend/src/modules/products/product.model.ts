import mongoose, { Schema, Document } from "mongoose";
import mongooseDelete from "mongoose-delete";

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
  sku?: string;
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
    sku: { type: String, default: "" }, 
  },
  {
    timestamps: true,
    deletedAt: true,
    deletedBy: false
  }
);

// 🔍 Búsqueda por texto y índices compuestos
ProductSchema.index({ name: "text" });
ProductSchema.index({ tenantId: 1, category: 1, createdAt: -1 });
ProductSchema.index({ tenantId: 1, isPublic: 1, stock: 1 });
ProductSchema.index({ tenantId: 1, sku: 1 }, { unique: false });

// Aplicar plugin de soft delete
ProductSchema.plugin(mongooseDelete, { 
  deletedAt: true,
  overrideMethods: true 
});

export default mongoose.model<IProduct>("Product", ProductSchema);
