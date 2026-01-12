import { Request, Response } from "express";
import Sale from "./sale.model";
import Product from "../products/product.model";

/* ==========================================================================
   1. OBTENER LISTA SIMPLE (Para validaciones rápidas)
   ========================================================================== */
export const getSales = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    
    // Trae absolutamente todas las ventas históricas
    const sales = await Sale.find({ tenantId }).sort({ createdAt: -1 });
    
    return res.json(sales);
  } catch (error) {
    console.error("Error en getSales:", error);
    return res.status(500).json({ message: "Error al obtener historial de ventas." });
  }
};

/* ==========================================================================
   2. REGISTRAR VENTA (Acción del botón VENDER)
   ========================================================================== */
export const registerSale = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { productId, quantity = 1 } = req.body;

    // 1. Validar Producto
    const product = await Product.findOne({ _id: productId, tenantId });
    if (!product) {
        return res.status(404).json({ message: "Producto no encontrado en inventario." });
    }
    
    // 2. Validar Stock
    if (product.stock < quantity) {
        return res.status(400).json({ message: `Stock insuficiente. Solo quedan ${product.stock}.` });
    }

    // 3. Cálculos Financieros (Asegurando tipos numéricos)
    const salePrice = Number(product.price) * Number(quantity);
    const unitCost = Number(product.cost) || 0;
    const totalCost = unitCost * Number(quantity);
    const profit = salePrice - totalCost;

    // 4. Crear Registro de Venta
    const newSale = new Sale({
      productId: product._id,
      productName: product.name,
      price: salePrice,
      cost: totalCost,
      quantity: Number(quantity),
      profit: profit,
      category: product.category || "General",
      tenantId
    });
    
    await newSale.save();

    // 5. Descontar del Inventario
    product.stock -= Number(quantity);
    await product.save();

    return res.status(201).json({ 
        message: "Venta registrada exitosamente.", 
        sale: newSale,
        remainingStock: product.stock 
    });

  } catch (error) {
    console.error("Error en registerSale:", error);
    return res.status(500).json({ message: "Error interno al procesar la venta." });
  }
};

/* ==========================================================================
   3. ANALÍTICAS AVANZADAS (Gráficos + Historial Filtrado)
   Esta es la función "pesada" que alimenta tu dashboard.
   ========================================================================== */
export const getSalesAnalytics = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { year, month } = req.query;

    // --- CONFIGURACIÓN DE FECHAS ---
    const currentYear = Number(year) || new Date().getFullYear();
    let startDate, endDate;

    if (month !== undefined && month !== "all") {
       // Si seleccionó un mes específico
       startDate = new Date(currentYear, Number(month), 1);
       endDate = new Date(currentYear, Number(month) + 1, 0, 23, 59, 59, 999);
    } else {
       // Si seleccionó "Todo el Año"
       startDate = new Date(currentYear, 0, 1);
       endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    }

    // Filtro principal para Mongo
    const matchStage = { 
      tenantId, 
      createdAt: { $gte: startDate, $lte: endDate } 
    };

    // --- AGREGACIONES (GRÁFICOS) ---
    
    // 1. Datos para Gráfico de Línea (Tiempo)
    const timeStats = await Sale.aggregate([
      { $match: matchStage },
      { 
        $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            ventas: { $sum: "$price" }, 
            ganancia: { $sum: "$profit" } 
        } 
      },
      { $sort: { _id: 1 } } // Ordenar por fecha ascendente
    ]);

    // 2. Datos para Gráfico de Torta (Categorías)
    const categoryStats = await Sale.aggregate([
      { $match: matchStage },
      { 
        $group: { 
            _id: "$category", 
            total: { $sum: "$price" }, 
            count: { $sum: "$quantity" } 
        } 
      },
      { $sort: { total: -1 } } // Categoría con más ingresos primero
    ]);

    // 3. Top Productos (Ranking)
    const topProducts = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$productName",
          sales: { $sum: "$price" },
          quantity: { $sum: "$quantity" },
          category: { $first: "$category" }
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 10 } // Top 10 para KPI
    ]);

    // --- HISTORIAL DETALLADO (LA TABLA) ---
    // Aquí buscamos los registros individuales para llenar la tabla grande
    const salesHistory = await Sale.find(matchStage)
        .sort({ createdAt: -1 }) // Los más recientes arriba
        .limit(500); // Límite de seguridad para no explotar la UI si hay miles

    // --- TOTALES GENERALES (KPIs) ---
    const totals = timeStats.reduce((acc, curr) => ({
        sales: acc.sales + curr.ventas,
        profit: acc.profit + curr.ganancia
    }), { sales: 0, profit: 0 });

    // Responder con todo el paquete de datos
    return res.json({ 
        chartData: timeStats, 
        categoryData: categoryStats, 
        topProducts, 
        salesHistory, // <--- ESTO ES LO QUE TE FALTABA EN LA TABLA
        totals 
    });

  } catch (error) {
    console.error("Error en getSalesAnalytics:", error);
    return res.status(500).json({ message: "Error al generar analíticas." });
  }
};