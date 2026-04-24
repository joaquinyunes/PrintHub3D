import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
    description: string;
    amount: number;
    category: string; // Ej: Luz, Materiales, Alquiler, Mantenimiento
    date: Date;
    tenantId: string;
}

const ExpenseSchema: Schema = new Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: 'General' },
    date: { type: Date, default: Date.now },
    tenantId: { type: String, required: true }
}, { timestamps: true });

// Índice para listados por tenant y fecha
ExpenseSchema.index({ tenantId: 1, date: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);