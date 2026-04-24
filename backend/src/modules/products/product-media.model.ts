import mongoose, { Schema, Document } from 'mongoose';

export interface IProductMedia extends Document {
    productName: string; // Nombre que activa esta imagen ej: "vaso river"
    imageUrl?: string;
    videoUrl?: string;
    type: 'image' | 'video';
    tenantId: string;
}

const ProductMediaSchema: Schema = new Schema({
    productName: { type: String, required: true },
    imageUrl: { type: String },
    videoUrl: { type: String },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    tenantId: { type: String, required: true }
}, { timestamps: true });

ProductMediaSchema.index({ productName: 'text', tenantId: 1 });

export default mongoose.model<IProductMedia>('ProductMedia', ProductMediaSchema);