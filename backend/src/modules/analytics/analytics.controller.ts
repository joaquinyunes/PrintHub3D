import { Request, Response } from 'express';
import Order from '../orders/order.model';
import Product from '../products/product.model';
import Client from '../clients/client.model';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const tenantId = 'global3d_hq';

        // 1. Calcular Finanzas (Ingresos y Ganancias)
        const financials = await Order.aggregate([
            { $match: { tenantId } }, // Filtramos por tu empresa
            { $group: { 
                _id: null, 
                totalIncome: { $sum: "$totalAmount" },
                totalProfit: { $sum: "$profit" } // 👈 Suma total de ganancias
            }}
        ]);

        const income = financials.length > 0 ? financials[0].totalIncome : 0;
        const profit = financials.length > 0 ? financials[0].totalProfit : 0;

        // 2. Contar Pedidos Activos (Pendientes o Imprimiendo)
        const ordersPending = await Order.countDocuments({ 
            tenantId, 
            status: { $in: ['pendiente', 'imprimiendo'] } 
        });

        // 3. Contar Alertas de Stock
        const lowStock = await Product.countDocuments({
            tenantId,
            $expr: { $lte: ["$stock", "$minStock"] }
        });

        // 4. Contar Clientes Totales
        const totalClients = await Client.countDocuments({ tenantId });

        // Enviar respuesta al Frontend
        res.json({
            income,
            profit, 
            orders: ordersPending,
            stockWarning: lowStock,
            clients: totalClients
        });

    } catch (error) {
        console.error("Error analytics:", error);
        res.status(500).json({ message: 'Error analytics' });
    }
};