import { Request, Response } from 'express';
import Order from '../orders/order.model';
import Product from '../products/product.model';
import User from '../users/user.model';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // En producción usaremos req.user.tenantId
        const tenantId = 'global3d_hq';

        // 1. Calcular Ingresos Totales (Suma de todos los pedidos 'terminado' o 'entregado')
        const sales = await Order.aggregate([
            { $match: { 
                tenantId, 
                status: { $in: ['terminado', 'entregado'] } 
            }},
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const income = sales.length > 0 ? sales[0].total : 0;

        // 2. Contar Pedidos Activos (Pendientes o Imprimiendo)
        const activeOrders = await Order.countDocuments({
            tenantId,
            status: { $in: ['pendiente', 'imprimiendo'] }
        });

        // 3. Stock Crítico (Productos con stock menor a su mínimo)
        // Ojo: $expr permite comparar dos campos del mismo documento
        const stockWarning = await Product.countDocuments({
            tenantId,
            $expr: { $lte: ["$stock", "$minStock"] }
        });

        // 4. Clientes Totales (Contar usuarios rol 'client')
        // Si no tienes usuarios clientes registrados aún, cuenta los nombres únicos en las órdenes
        const uniqueClients = await Order.distinct('customerName', { tenantId });
        const clientsCount = uniqueClients.length;

        res.json({
            income,
            orders: activeOrders,
            stockWarning,
            clients: clientsCount
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error calculando estadísticas' });
    }
};