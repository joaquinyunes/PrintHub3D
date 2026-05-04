import mongoose, { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    return await document.save();
  }

  async findById(id: string, tenantId?: string): Promise<T | null> {
    const query: FilterQuery<T> = { _id: id } as FilterQuery<T>;
    if (tenantId) {
      (query as any).tenantId = tenantId;
    }
    return await this.model.findOne(query);
  }

  async findOne(query: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(query);
  }

  async find(query: FilterQuery<T> = {}, options?: {
    sort?: Record<string, 1 | -1>;
    skip?: number;
    limit?: number;
  }): Promise<T[]> {
    let q = this.model.find(query);
    if (options?.sort) q = q.sort(options.sort);
    if (options?.skip) q = q.skip(options.skip);
    if (options?.limit) q = q.limit(options.limit);
    return await q.exec();
  }

  async findWithPagination(query: FilterQuery<T>, options: {
    page?: number;
    pageSize?: number;
    sort?: string;
  }): Promise<{ items: T[]; total: number }> {
    const page = Math.max(options.page || 1, 1);
    const limit = Math.min(Math.max(options.pageSize || 50, 1), 200);
    const skip = (page - 1) * limit;

    const sortField = options.sort?.startsWith('-') 
      ? options.sort.substring(1) 
      : options.sort || 'createdAt';
    const sortDir = options.sort?.startsWith('-') ? -1 : 1;
    const sortObj: Record<string, 1 | -1> = { [sortField]: sortDir };

    const [items, total] = await Promise.all([
      this.model.find(query).sort(sortObj).skip(skip).limit(limit),
      this.model.countDocuments(query),
    ]);

    return { items, total };
  }

  async update(id: string, data: UpdateQuery<T>, tenantId?: string): Promise<T | null> {
    const query: FilterQuery<T> = { _id: id } as FilterQuery<T>;
    if (tenantId) {
      (query as any).tenantId = tenantId;
    }
    return await this.model.findOneAndUpdate(query, data, { new: true });
  }

  async delete(id: string, tenantId?: string): Promise<T | null> {
    const query: FilterQuery<T> = { _id: id } as FilterQuery<T>;
    if (tenantId) {
      (query as any).tenantId = tenantId;
    }
    return await this.model.findOneAndDelete(query);
  }

  async count(query: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(query);
  }

  async exists(query: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.exists(query);
    return !!result;
  }
}
