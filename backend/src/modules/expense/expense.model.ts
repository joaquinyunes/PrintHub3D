import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
    description: string;
    amount: number;
    category: string; // Ej: Luz, Materiales, Alquiler, Mantenimiento
    date: Date;
    type: 'local' | 'casa'; // Gasto del negocio vs. personal (hoja "Gastos Local" / "Gastos Casa")
    provider?: string;      // Proveedor
    paymentMethod?: string; // Medio de pago
    status: 'pendiente' | 'pagado';
    notes?: string;
    importBatch?: string;   // etiqueta de lote de importación (para re-importar sin duplicar)
    tenantId: string;
}

const ExpenseSchema: Schema = new Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, default: 'General' },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['local', 'casa'], default: 'local', index: true },
    provider: { type: String, default: '' },
    paymentMethod: { type: String, default: '' },
    status: { type: String, enum: ['pendiente', 'pagado'], default: 'pagado' },
    notes: { type: String, default: '' },
    importBatch: { type: String, index: true },
    tenantId: { type: String, required: true }
}, { timestamps: true });

// Índice para listados por tenant y fecha
ExpenseSchema.index({ tenantId: 1, date: -1 });
ExpenseSchema.index({ tenantId: 1, type: 1, date: -1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);