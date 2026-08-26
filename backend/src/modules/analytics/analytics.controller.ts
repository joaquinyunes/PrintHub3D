import { Request, Response } from 'express';
import Order from '../orders/order.model';
import logger from '../../config/logger';
import Product from '../products/product.model';
import Client from '../clients/client.model';
import Expense from '../expense/expense.model';
import Sale from '../sales/sale.model';
import { appConfig } from '../../config';

// ==========================================
// 1. DASHBOARD PRINCIPAL (HOME)
// ==========================================
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Solo pedidos que todavia NO generaron un registro de venta (evita doble conteo:
        // al entregarse/cobrarse un pedido se crea un Sale con el mismo importe).
        const orderStats = await Order.aggregate([
            { $match: { tenantId, createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' }, isSaleRegistered: { $ne: true } } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);

        const saleStats = await Sale.aggregate([
            { $match: { tenantId, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);

        const expenseStats = await Expense.aggregate([
            { $match: { tenantId, date: { $gte: startOfMonth } } }, // Asumiendo que Expense usa 'date'
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const incomeOrders = orderStats[0]?.total || 0;
        const incomeSales = saleStats[0]?.total || 0;
        const totalExpenses = expenseStats[0]?.total || 0;
        const netProfit = (incomeOrders + incomeSales) - totalExpenses;

        res.json({
            income: incomeOrders + incomeSales,
            profit: netProfit,
            expenses: totalExpenses,
            ordersPending: await Order.countDocuments({ tenantId, status: 'pending' }),
            stockWarning: await Product.countDocuments({ tenantId, $expr: { $lte: ["$stock", "$minStock"] } }),
            clients: await Client.countDocuments({ tenantId })
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en dashboard' });
    }
};

// ==========================================
// 2. REPORTES ANALÍTICOS (FILTRADOS)
// ==========================================
export const getReportsData = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
        const { year, month } = req.query;

        // 1. Configurar los límites de fecha según el filtro del frontend
        const y = parseInt(year as string) || new Date().getFullYear();
        let startDate: Date, endDate: Date;

        if (month === 'all') {
            startDate = new Date(y, 0, 1);
            endDate = new Date(y, 11, 31, 23, 59, 59);
        } else {
            const m = parseInt(month as string) || new Date().getMonth();
            startDate = new Date(y, m, 1);
            endDate = new Date(y, m + 1, 0, 23, 59, 59); // Último día del mes
        }

        // 2. Buscar en las 3 colecciones filtrando por esas fechas.
        // Los pedidos ya convertidos en venta (isSaleRegistered) se excluyen para no
        // contarlos dos veces: su importe ya viaja en la coleccion Sale.
        const orders = await Order.find({ tenantId, createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' }, isSaleRegistered: { $ne: true } });
        const sales = await Sale.find({ tenantId, createdAt: { $gte: startDate, $lte: endDate } });
        const expenses = await Expense.find({ tenantId, date: { $gte: startDate, $lte: endDate } });

        // 3. Calcular Totales Exactos
        const totalOrders = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);
        const totalSales = sales.reduce((acc, s) => acc + Number(s.price || 0), 0);
        const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
        
        const totalIncome = totalOrders + totalSales;
        const netProfit = totalIncome - totalExpenses; // Facturación Bruta - Gastos = Neta

        // 4. Armar Historial Detallado Unificado
        const history: any[] = [];
        
        orders.forEach(o => history.push({
            _id: o._id, createdAt: o.createdAt, productName: o.clientName || 'Pedido Personalizado', 
            category: 'Impresión', type: 'order', price: o.total, profit: o.total
        }));
        
        sales.forEach(s => history.push({
            _id: s._id, createdAt: s.createdAt, productName: s.productName || 'Venta Stock', 
            category: s.category || 'Stock', type: 'sale', price: s.price, profit: s.profit || s.price
        }));
        
        expenses.forEach(e => history.push({
            _id: e._id, createdAt: e.date, productName: e.description || 'Gasto General', 
            category: e.category || 'Gasto', type: 'expense', price: e.amount, amount: e.amount
        }));

        // Ordenar del más nuevo al más viejo
        history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // 5. Armar datos para el gráfico (Flujo de Caja por días o meses)
        const chartMap = new Map();
        history.forEach(item => {
            const d = new Date(item.createdAt);
            // Si es "todo el año" agrupamos por mes, si no, agrupamos por día
            const key = month === 'all' 
                ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` 
                : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            if (!chartMap.has(key)) chartMap.set(key, { _id: key, ventas: 0, gastos: 0 });
            
            const current = chartMap.get(key);
            if (item.type === 'expense') {
                current.gastos += item.price;
            } else {
                current.ventas += item.price;
            }
        });
        const chartData = Array.from(chartMap.values()).sort((a, b) => a._id.localeCompare(b._id));

        // 6. Armar datos para la Torta (Categorías de Ingresos)
        const catMap = new Map();
        [...orders.map(o => ({ cat: 'Impresión', val: o.total })), ...sales.map(s => ({ cat: s.category || 'Stock', val: s.price }))].forEach(item => {
            catMap.set(item.cat, (catMap.get(item.cat) || 0) + item.val);
        });
        const categoryData = Array.from(catMap.entries()).map(([k, v]) => ({ _id: k, total: v }));

        // 7. Enviar respuesta con la estructura exacta que pide el Frontend
        res.json({
            totals: { sales: totalIncome, expenses: totalExpenses, profit: netProfit },
            salesHistory: history,
            chartData,
            categoryData
        });

    } catch (error) {
        logger.error("Error en getReportsData:", error);
        res.status(500).json({ message: 'Error en reportes detallados' });
    }
};
// ==========================================
// 4. RENTABILIDAD / P&L (Margen real con COGS)
// ==========================================
export const getProfitability = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
        const { year, month } = req.query as Record<string, string | undefined>;

        const y = parseInt(year || '') || new Date().getFullYear();
        let start: Date, end: Date;
        if (!month || month === 'all') {
            start = new Date(y, 0, 1);
            end = new Date(y, 11, 31, 23, 59, 59, 999);
        } else {
            const m = parseInt(month);
            start = new Date(y, m, 1);
            end = new Date(y, m + 1, 0, 23, 59, 59, 999);
        }

        const [sales, expenses, openOrders] = await Promise.all([
            Sale.find({ tenantId, createdAt: { $gte: start, $lte: end } }).lean(),
            Expense.find({ tenantId, date: { $gte: start, $lte: end } }).lean(),
            // Pedidos aún no convertidos en venta: su margen todavía no está "realizado"
            Order.find({ tenantId, createdAt: { $gte: start, $lte: end }, status: { $ne: 'cancelled' }, isSaleRegistered: { $ne: true } }).lean(),
        ]);

        const revenue = sales.reduce((s, v: any) => s + Number(v.price || 0), 0);
        const cogs = sales.reduce((s, v: any) => s + Number(v.cost || 0), 0);
        const grossProfit = revenue - cogs;
        const totalExpenses = expenses.reduce((s, e: any) => s + Number(e.amount || 0), 0);
        const netProfit = grossProfit - totalExpenses;

        const pipeline = openOrders.reduce((s, o: any) => s + Number(o.total || 0), 0);
        const pipelineProfit = openOrders.reduce((s, o: any) => s + Number(o.profit || 0), 0);

        // Margen por producto
        const byProduct = new Map<string, { name: string; units: number; revenue: number; cost: number; profit: number }>();
        for (const v of sales as any[]) {
            const key = v.productName || 'Sin nombre';
            const cur = byProduct.get(key) || { name: key, units: 0, revenue: 0, cost: 0, profit: 0 };
            cur.units += Number(v.quantity || 1);
            cur.revenue += Number(v.price || 0);
            cur.cost += Number(v.cost || 0);
            cur.profit += Number(v.profit ?? (Number(v.price || 0) - Number(v.cost || 0)));
            byProduct.set(key, cur);
        }
        const products = Array.from(byProduct.values())
            .map((p) => ({ ...p, margin: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0 }))
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 20);

        // Gastos por categoría
        const byCategory = new Map<string, number>();
        for (const e of expenses as any[]) {
            byCategory.set(e.category || 'General', (byCategory.get(e.category || 'General') || 0) + Number(e.amount || 0));
        }
        const expensesByCategory = Array.from(byCategory.entries())
            .map(([category, total]) => ({ category, total }))
            .sort((a, b) => b.total - a.total);

        res.json({
            period: { year: y, month: month || 'all' },
            totals: {
                revenue,
                cogs,
                grossProfit,
                grossMargin: revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0,
                expenses: totalExpenses,
                netProfit,
                netMargin: revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0,
            },
            pipeline: { value: pipeline, estimatedProfit: pipelineProfit, orders: openOrders.length },
            products,
            expensesByCategory,
        });
    } catch (error) {
        logger.error('Error en getProfitability:', error);
        res.status(500).json({ message: 'Error calculando rentabilidad' });
    }
};
