export interface UserData {
  id?: string;
  name?: string;
  role: 'admin' | 'client';
  email?: string;
  tenantId?: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category: string;
  description?: string;
}

export interface Idea {
  name: string;
  downloads: string;
  desc: string;
  link: string;
  image?: string;
  price: number;
  trending?: boolean;
}

export interface Printer {
  name: string;
  price: number;
  imageUrl?: string;
  link: string;
  description: string;
}
