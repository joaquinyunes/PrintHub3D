import mongoose from 'mongoose';
import { BaseRepository, FilterQuery } from './base.repository';
import Product from '../modules/products/product.model';
type IProduct = mongoose.Document;

export class ProductRepository extends BaseRepository<IProduct> {
  constructor() {
    super(Product);
  }

  async findByTenant(
    tenantId: string,
    options?: {
      search?: string;
      category?: string;
      lowStock?: boolean;
      isPublic?: boolean;
      inStock?: boolean;
    }
  ): Promise<IProduct[]> {
    const query: FilterQuery<IProduct> = { tenantId } as FilterQuery<IProduct>;

    if (options?.search) {
      query.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { sku: { $regex: options.search, $options: 'i' } },
      ];
    }

    if (options?.category) {
      query.category = options.category;
    }

    if (options?.lowStock) {
      query.$expr = { $lte: ['$stock', { $ifNull: ['$minStock', 5] }] };
    }

    if (options?.isPublic !== undefined) {
      query.isPublic = options.isPublic;
    }

    if (options?.inStock) {
      query.stock = { $gt: 0 };
    }

    return await this.model.find(query).sort({ category: 1, name: 1 });
  }

  async findBySkuOrName(tenantId: string, sku?: string, name?: string): Promise<IProduct | null> {
    if (sku) {
      const product = await this.model.findOne({ tenantId, sku } as FilterQuery<IProduct>);
      if (product) return product;
    }

    if (name) {
      return await this.model.findOne({
        tenantId,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
      } as FilterQuery<IProduct>);
    }

    return null;
  }

  async addStock(id: string, tenantId: string, quantity: number): Promise<IProduct | null> {
    const query: FilterQuery<IProduct> = { _id: id, tenantId } as FilterQuery<IProduct>;
    return await this.model.findOneAndUpdate(
      query,
      { $inc: { stock: quantity } },
      { new: true }
    );
  }

  async getProductsSummary(tenantId: string): Promise<{
    totalProducts: number;
    totalUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
    inventorySaleValue: number;
    inventoryCostValue: number;
    estimatedGrossMarginValue: number;
  }> {
    const products = await this.model.find({ tenantId } as FilterQuery<IProduct>)
      .select('stock minStock price cost');

    const summary = {
      totalProducts: 0,
      totalUnits: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      inventorySaleValue: 0,
      inventoryCostValue: 0,
      estimatedGrossMarginValue: 0,
    };

    products.forEach((product: any) => {
      const stock = Number(product.stock || 0);
      const minStock = Number(product.minStock ?? 5);
      const price = Number(product.price || 0);
      const cost = Number(product.cost || 0);

      summary.totalProducts++;
      summary.totalUnits += stock;
      summary.inventorySaleValue += stock * price;
      summary.inventoryCostValue += stock * cost;

      if (stock <= 0) summary.outOfStockCount += 1;
      if (stock > 0 && stock <= minStock) summary.lowStockCount += 1;
    });

    summary.estimatedGrossMarginValue = summary.inventorySaleValue - summary.inventoryCostValue;

    return summary;
  }

  async decrementStock(id: string, tenantId: string, quantity: number): Promise<IProduct | null> {
    const query: FilterQuery<IProduct> = { 
      _id: id, 
      tenantId,
      stock: { $gte: quantity }
    } as FilterQuery<IProduct>;
    
    return await this.model.findOneAndUpdate(
      query,
      { $inc: { stock: -quantity } },
      { new: true }
    );
  }
}
