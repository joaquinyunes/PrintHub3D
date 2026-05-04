import { z } from 'zod';

// Schema para crear/editar producto
export const ProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  category: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  price: z.number().min(0, 'El precio debe ser positivo'),
  cost: z.number().min(0).optional(),
  stock: z.number().min(0, 'El stock debe ser positivo').optional(),
  minStock: z.number().min(0).optional(),
  isPublic: z.boolean().optional(),
  sku: z.string().optional(),
});

// Schema para búsqueda de productos
export const ProductSearchSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  inStock: z.boolean().optional(),
});

// Tipos inferidos
export type ProductInput = z.infer<typeof ProductSchema>;
export type ProductSearchInput = z.infer<typeof ProductSearchSchema>;
