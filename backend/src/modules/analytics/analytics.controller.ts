import { Request, Response } from 'express';
import Order from '../orders/order.model';
import Product from '../products/product.model';
import Client from '../clients/client.model';
import Expense from '../expense/expense.model'; // 👈 IMPORTAR GASTOS
import Sale from '../sales/sale.model';           // 👈 IMPORTAR VENTAS

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const tenantId = 'global3d_hq';
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Ingresos por Pedidos (Custom Prints)
        const orderStats = await Order.aggregate([
            { $match: { tenantId, createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        // 2. Ingresos por Ventas (Filamentos/Insumos)
        const saleStats = await Sale.aggregate([
            { $match: { tenantId, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);

        // 3. Gastos Totales
        const expenseStats = await Expense.aggregate([
            { $match: { tenantId, date: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const incomeOrders = orderStats[0]?.total || 0;
        const incomeSales = saleStats[0]?.total || 0;
        const totalExpenses = expenseStats[0]?.total || 0;

        // Cálculo Final: (Pedidos + Filamentos) - Gastos
        const netProfit = (incomeOrders + incomeSales) - totalExpenses;

        res.json({
            income: incomeOrders + incomeSales, // Ingreso Bruto
            profit: netProfit,                  // Ganancia Real (Neta)
            expenses: totalExpenses,
            ordersPending: await Order.countDocuments({ tenantId, status: 'pending' }),
            stockWarning: await Product.countDocuments({ tenantId, $expr: { $lte: ["$stock", "$minStock"] } }),
            clients: await Client.countDocuments({ tenantId })
        });

    } catch (error) {
        res.status(500).json({ message: 'Error en reportes' });
    }
};