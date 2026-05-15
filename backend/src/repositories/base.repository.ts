import mongoose, { Document, Model as MongooseModel } from 'mongoose';
import cacheService from '../services/cache.service';

type UpdateQuery<T> = Record<string, unknown>;
type FilterQuery<T> = Record<string, unknown>;
type SortOrder = 1 | -1;

export { FilterQuery, UpdateQuery, SortOrder };

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sort?: string;
  sortDir?: 1 | -1;
}

export interface FilterOptions {
  search?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
  dateFrom?: Date;
  dateTo?: Date;
  dateField?: string;
}

export interface FindResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export abstract class BaseRepository<T extends Document> {
  protected model: any;
  protected useCache: boolean = false;
  protected cacheTTL: number = 300;
  protected collectionName: string;

  constructor(model: any, options?: { useCache?: boolean; cacheTTL?: number }) {
    this.model = model;
    this.collectionName = model.collection?.collectionName || 'unknown';
    if (options?.useCache !== undefined) this.useCache = options.useCache;
    if (options?.cacheTTL) this.cacheTTL = options.cacheTTL;
  }

  protected buildCacheKey(operation: string, tenantId?: string, extra: string = ''): string {
    return cacheService.buildKey(this.collectionName, tenantId, operation, extra);
  }

  async create(data: Partial<T>): Promise<T> {
    const document = new this.model(data);
    const saved = await document.save();
    if (this.useCache) {
      await cacheService.delPattern(`cache:${this.collectionName}:*`);
    }
    return saved;
  }

  async findById(id: string, tenantId?: string): Promise<T | null> {
    const cacheKey = this.buildCacheKey('findById', tenantId, id);
    
    if (this.useCache) {
      const cached = await cacheService.get<T>(cacheKey);
      if (cached) return cached as any;
    }

    const query: FilterQuery<T> = { _id: id } as FilterQuery<T>;
    if (tenantId) {
      (query as any).tenantId = tenantId;
    }
    const result = await this.model.findOne(query);
    
    if (this.useCache && result) {
      await cacheService.set(cacheKey, result, { ttl: this.cacheTTL });
    }
    return result;
  }

  async findOne(query: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(query);
  }

  async find(query: FilterQuery<T> = {}, options?: {
    sort?: Record<string, SortOrder>;
    skip?: number;
    limit?: number;
  }): Promise<T[]> {
    let q = this.model.find(query);
    if (options?.sort) q = q.sort(options.sort);
    if (options?.skip) q = q.skip(options.skip);
    if (options?.limit) q = q.limit(options.limit);
    return await q.exec();
  }

  buildQuery(baseQuery: FilterQuery<T>, filterOptions?: FilterOptions): FilterQuery<T> {
    const query = { ...baseQuery };

    if (filterOptions?.search && filterOptions?.searchFields?.length) {
      const searchRegex = { $regex: filterOptions.search, $options: 'i' };
      query.$or = filterOptions.searchFields.map(field => ({
        [field]: searchRegex
      })) as any;
    }

    if (filterOptions?.filters) {
      Object.entries(filterOptions.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          (query as any)[key] = value;
        }
      });
    }

    if (filterOptions?.dateFrom || filterOptions?.dateTo) {
      const dateField = filterOptions.dateField || 'createdAt';
      (query as any)[dateField] = {};
      if (filterOptions.dateFrom) {
        (query as any)[dateField].$gte = filterOptions.dateFrom;
      }
      if (filterOptions.dateTo) {
        (query as any)[dateField].$lte = filterOptions.dateTo;
      }
    }

    return query;
  }

  async findWithPagination(
    query: FilterQuery<T>,
    options: PaginationOptions = {},
    filterOptions?: FilterOptions
  ): Promise<FindResult<T>> {
    const page = Math.max(options.page || 1, 1);
    const limit = Math.min(Math.max(options.pageSize || 50, 1), 200);
    const skip = (page - 1) * limit;

    const sortField = options.sort?.startsWith('-') 
      ? options.sort.substring(1) 
      : options.sort || 'createdAt';
    const sortDir = options.sort?.startsWith('-') ? -1 : (options.sortDir || 1);
    const sortObj: Record<string, SortOrder> = { [sortField]: sortDir };

    const finalQuery = filterOptions 
      ? this.buildQuery(query, filterOptions) 
      : query;

    const cacheKey = this.useCache 
      ? this.buildCacheKey('pagination', (query as any).tenantId, `${JSON.stringify(finalQuery)}:${page}:${limit}:${JSON.stringify(sortObj)}`)
      : null;

    if (cacheKey) {
      const cached = await cacheService.get<FindResult<T>>(cacheKey);
      if (cached) return cached;
    }

    const [items, total] = await Promise.all([
      this.model.find(finalQuery).sort(sortObj).skip(skip).limit(limit),
      this.model.countDocuments(finalQuery),
    ]);

    const result: FindResult<T> = {
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };

    if (cacheKey) {
      await cacheService.set(cacheKey, result, { ttl: this.cacheTTL });
    }

    return result;
  }

  async update(id: string, data: UpdateQuery<T>, tenantId?: string): Promise<T | null> {
    const query: FilterQuery<T> = { _id: id } as FilterQuery<T>;
    if (tenantId) {
      (query as any).tenantId = tenantId;
    }
    const result = await this.model.findOneAndUpdate(query, data, { new: true });
    if (this.useCache) {
      await cacheService.delPattern(`cache:${this.collectionName}:*`);
    }
    return result;
  }

  async delete(id: string, tenantId?: string): Promise<T | null> {
    const query: FilterQuery<T> = { _id: id } as FilterQuery<T>;
    if (tenantId) {
      (query as any).tenantId = tenantId;
    }
    const result = await this.model.findOneAndDelete(query);
    if (this.useCache) {
      await cacheService.delPattern(`cache:${this.collectionName}:*`);
    }
    return result;
  }

  async count(query: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(query);
  }

  async exists(query: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.exists(query);
    return !!result;
  }

  async invalidateCache(): Promise<void> {
    if (this.useCache) {
      await cacheService.delPattern(`cache:${this.collectionName}:*`);
    }
  }
}
