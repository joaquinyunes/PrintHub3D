import mongoose, { Document, Schema } from 'mongoose';

export interface IHomeIdea extends Document {
  name: string;
  image?: string;
  downloads?: string;
  link?: string;
  price?: number;
  category?: string;
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
  trending?: boolean;
}

const HomeIdeaSchema: Schema = new Schema({
  name: { type: String, required: true },
  image: { type: String, default: '' },
  downloads: { type: String, default: '' },
  link: { type: String, default: '' },
  price: { type: Number, default: 0 },
  category: { type: String, default: '' },
  tenantId: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IHomeIdea>('HomeIdea', HomeIdeaSchema);
