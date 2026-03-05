import { Request, Response } from 'express';
import Order from '../orders/order.model';
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

        const orderStats = await Order.aggregate([
            { $match: { tenantId, createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
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

        // 2. Buscar en las 3 colecciones filtrando por esas fechas
        const orders = await Order.find({ tenantId, createdAt: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' } });
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
        console.error("Error en getReportsData:", error);
        res.status(500).json({ message: 'Error en reportes detallados' });
    }
};