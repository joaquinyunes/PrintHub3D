export interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

export interface OrderItem {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
  isCustom?: boolean;
  printTimeMinutes?: number;
  productType?: string;
  printedQuantity?: number;
}

export interface OrderFile {
  name: string;
  url: string;
}

export interface Order {
  _id: string;
  clientName: string;
  origin?: string;
  paymentMethod?: string;
  deposit?: number;
  notes?: string;
  total: number;
  trackingCode?: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  isSaleRegistered?: boolean;
  dueDate?: string;
  files?: OrderFile[];
  chatLink?: string;
}

export type TabId = 'production' | 'ready' | 'history';

/** Fila de "Videos por código" (Admin → Inicio web) que define un tipo de producto. */
export interface CustomCode {
  code?: string;
  name?: string;
}

export interface ProductTypeOption {
  value: string;
  label: string;
}
