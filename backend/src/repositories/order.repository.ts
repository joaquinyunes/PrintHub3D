import { FilterQuery, Types } from 'mongoose';
import { BaseRepository } from './base.repository';
import Order, { IOrder } from '../modules/orders/order.model';

export class OrderRepository extends BaseRepository<IOrder> {
  constructor() {
    super(Order);
  }

  async findByTrackingCode(trackingCode: string): Promise<IOrder | null> {
    return await this.model.findOne({ 
      trackingCode: trackingCode.toUpperCase() 
    } as FilterQuery<IOrder>);
  }

  async findByTenantAndStatus(
    tenantId: string, 
    status?: string,
    dateRange?: { from?: string; to?: string }
  ): Promise<IOrder[]> {
    const query: FilterQuery<IOrder> = { tenantId } as FilterQuery<IOrder>;
    
    if (status) {
      query.status = status;
    }

    if (dateRange?.from || dateRange?.to) {
      query.createdAt = {};
      if (dateRange.from) (query.createdAt as any).$gte = new Date(dateRange.from);
      if (dateRange.to) (query.createdAt as any).$lte = new Date(dateRange.to);
    }

    return await this.model.find(query).sort({ createdAt: -1 });
  }

  async findWithPaginationByTenant(
    tenantId: string,
    options: {
      page?: number;
      pageSize?: number;
      sort?: string;
      status?: string;
      from?: string;
      to?: string;
    }
  ): Promise<{ items: IOrder[]; total: number }> {
    const query: FilterQuery<IOrder> = { tenantId } as FilterQuery<IOrder>;

    if (options.status) {
      query.status = options.status;
    }

    if (options.from || options.to) {
      query.createdAt = {};
      if (options.from) (query.createdAt as any).$gte = new Date(options.from);
      if (options.to) (query.createdAt as any).$lte = new Date(options.to);
    }

    return await this.findWithPagination(query, {
      page: options.page,
      pageSize: options.pageSize,
      sort: options.sort || '-createdAt',
    });
  }

  async getOrdersSummary(tenantId: string): Promise<{
    totalOrders: number;
    pending: number;
    inProgress: number;
    completed: number;
    delivered: number;
    cancelled: number;
    monthlyRevenue: number;
    averageSatisfaction: number;
  }> {
    const orders = await this.model.find({ tenantId } as FilterQuery<IOrder>)
      .select('status total createdAt customerSatisfaction dueDate finishedAt');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const summary = {
      totalOrders: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      delivered: 0,
      cancelled: 0,
      monthlyRevenue: 0,
      averageSatisfaction: 0,
    };

    let ratingsCount = 0;
    let ratingsTotal = 0;

    orders.forEach((order: any) => {
      summary.totalOrders++;
      if (order.status === 'pending') summary.pending += 1;
      if (order.status === 'in_progress') summary.inProgress += 1;
      if (order.status === 'completed') summary.completed += 1;
      if (order.status === 'delivered') summary.delivered += 1;
      if (order.status === 'cancelled') summary.cancelled += 1;

      if (order.createdAt >= monthStart && order.status !== 'cancelled') {
        summary.monthlyRevenue += Number(order.total || 0);
      }

      if (Number.isFinite(Number(order.customerSatisfaction))) {
        ratingsCount += 1;
        ratingsTotal += Number(order.customerSatisfaction);
      }
    });

    summary.averageSatisfaction = ratingsCount ? Number((ratingsTotal / ratingsCount).toFixed(2)) : 0;

    return summary;
  }

  async updateStatus(
    id: string, 
    tenantId: string, 
    status: string, 
    additionalUpdates?: Record<string, any>
  ): Promise<IOrder | null> {
    const query: FilterQuery<IOrder> = { _id: id, tenantId } as FilterQuery<IOrder>;
    const updates: Record<string, any> = { status, ...additionalUpdates };
    return await this.model.findOneAndUpdate(query, updates, { new: true });
  }
}
