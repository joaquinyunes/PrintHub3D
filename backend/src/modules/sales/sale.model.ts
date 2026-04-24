import mongoose, { Schema, Document } from "mongoose";

export interface ISale extends Document {
  productId: string;
  productName: string;
  price: number;
  cost: number;
  quantity: number;
  profit: number;
  category: string; // 👈 Campo clave para tus gráficos
  tenantId: string;
  createdAt: Date;
}

const SaleSchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    cost: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true, default: 1 },
    profit: { type: Number, required: true },
    category: { type: String, required: true, default: "General" }, // 👈 Guardamos la categoría
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// Índice compuesto para listados por tenant y fecha
SaleSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model<ISale>("Sale", SaleSchema);