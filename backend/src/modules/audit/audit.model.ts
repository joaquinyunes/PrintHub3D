import mongoose, { Schema } from 'mongoose';

// Registro de auditoría de solo-agregar: ningún endpoint ni hook permite editarlo o borrarlo (S7).
const AuditSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    actorKind: { type: String, enum: ['admin', 'staff', 'operator', 'system'], required: true },
    actorId: { type: String, default: '' },
    actorName: { type: String, default: '' },
    target: { type: String, default: '' },
    detail: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
AuditSchema.index({ tenantId: 1, createdAt: -1 });

const immutable = () => {
  throw new Error('El registro de auditoría no se puede modificar ni borrar');
};
for (const op of ['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete'] as const) {
  AuditSchema.pre(op, immutable);
}
AuditSchema.pre('save', function () {
  if (!this.isNew) immutable();
});

export default mongoose.model('AuditLog', AuditSchema);
