import { z } from 'zod';

// Schema para crear pedido
export const CreateOrderSchema = z.object({
  clientName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  origin: z.string().optional(),
  paymentMethod: z.string().optional(),
  deposit: z.number().min(0).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().min(1, 'Nombre del producto requerido'),
    quantity: z.number().min(1, 'Cantidad mínima es 1'),
    price: z.number().min(0, 'Precio debe ser positivo'),
    isCustom: z.boolean().optional(),
    productType: z.string().optional(),
    printTimeMinutes: z.number().min(0).optional(),
  })).min(1, 'Debe haber al menos un producto'),
  dueDate: z.union([z.string(), z.date(), z.null()]).optional(),
  files: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional(),
  customerContact: z.string().optional(),
});

// Schema para actualizar estado
export const UpdateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }),
  printTimeMinutes: z.number().min(0).optional(),
  printerId: z.string().optional(),
});

// Schema para feedback
export const OrderFeedbackSchema = z.object({
  rating: z.number().min(1).max(5, 'La calificación debe estar entre 1 y 5'),
  feedback: z.string().optional(),
});

// Tipos inferidos automáticamente
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderFeedbackInput = z.infer<typeof OrderFeedbackSchema>;
