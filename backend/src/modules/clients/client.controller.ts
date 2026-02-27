import { Request, Response } from 'express';
import Client from './client.model';

export const getClients = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const {
            page = '1',
            pageSize = '50',
            search = '',
            from,
            to,
        } = req.query as Record<string, string | undefined>;

        const pageNumber = Math.max(parseInt(page || '1', 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(pageSize || '50', 10) || 50, 1), 200);
        const skip = (pageNumber - 1) * limit;

        const query: any = { tenantId };

        const trimmedSearch = String(search || '').trim();
        if (trimmedSearch) {
            query.$or = [
                { name: { $regex: trimmedSearch, $options: 'i' } },
                { email: { $regex: trimmedSearch, $options: 'i' } },
                { phone: { $regex: trimmedSearch, $options: 'i' } },
                { socialHandle: { $regex: trimmedSearch, $options: 'i' } },
            ];
        }

        if (from || to) {
            query.lastOrderDate = {};
            if (from) query.lastOrderDate.$gte = new Date(from);
            if (to) query.lastOrderDate.$lte = new Date(to);
        }

        const [items, total] = await Promise.all([
            Client.find(query)
                .sort({ totalSpent: -1 })
                .skip(skip)
                .limit(limit),
            Client.countDocuments(query),
        ]);

        res.json({
            items,
            total,
            page: pageNumber,
            pageSize: limit,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo clientes' });
    }
};