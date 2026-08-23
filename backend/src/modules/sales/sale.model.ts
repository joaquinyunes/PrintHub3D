import mongoose, { Schema, Document } from "mongoose";

export interface ISale extends Document {
  productId?: string;
  productName: string;
  price: number;
  cost: number;
  quantity: number;
  profit: number;
  category: string; // 👈 Campo clave para tus gráficos
  orderId?: mongoose.Types.ObjectId; // Si la venta viene de un pedido entregado/cobrado
  client?: string;
  paymentMethod?: string;
  notes?: string;
  tenantId: string;
  createdAt: Date;
}

const SaleSchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    cost: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true, default: 1 },
    profit: { type: Number, required: true },
    category: { type: String, required: true, default: "General" }, // 👈 Guardamos la categoría
    orderId: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    client: { type: String, default: "" },
    paymentMethod: { type: String, default: "" },
    notes: { type: String, default: "" },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

// Índice compuesto para listados por tenant y fecha
SaleSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model<ISale>("Sale", SaleSchema);