import { Request, Response } from "express";
import Product from "./product.model";
import Sale from "../sales/sale.model"; // 👈 IMPORTANTE: Asegúrate de importar el modelo de Ventas
/* ======================================================
   🔒 ADMIN – OBTENER PRODUCTOS
====================================================== */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ message: "No autorizado" });
    }

    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();
    const lowStock = String(req.query.lowStock || "false") === "true";

    const query: any = { tenantId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (lowStock) {
      query.$expr = { $lte: ["$stock", { $ifNull: ["$minStock", 5] }] };
    }

    const products = await Product.find(query).sort({
      category: 1,
      name: 1,
    });

    return res.json(products);
  } catch (error) {
    console.error("getProducts:", error);
    return res.status(500).json({ message: "Error interno" });
  }
};

/* ======================================================
   🌍 PÚBLICO – TIENDA (Para tu E-commerce o catálogo)
====================================================== */
export const getPublicProducts = async (req: Request, res: Response) => {
  try {
    const tenantId = String(req.query.tenantId || "global3d_hq");

    const products = await Product.find({
      tenantId,
      isPublic: true,
      stock: { $gt: 0 },
    }).sort({ createdAt: -1 });

    return res.json(products);
  } catch (error) {
    console.error("getPublicProducts:", error);
    return res.status(500).json({ message: "Error cargando tienda pública" });
  }
};

/* ======================================================
   ➕ CREAR O FUSIONAR (SMART MERGE)
   Si existe SKU o Nombre -> Suma Stock. Si no -> Crea.
====================================================== */
const sanitizeProductNumbers = (payload: any) => {
  const price = Number(payload.price);
  const cost = Number(payload.cost ?? 0);
  const stock = Number(payload.stock ?? 0);
  const minStock = Number(payload.minStock ?? 5);

  if (!Number.isFinite(price) || price < 0) return { error: "Precio inválido" };
  if (!Number.isFinite(cost) || cost < 0) return { error: "Costo inválido" };
  if (!Number.isFinite(stock) || stock < 0) return { error: "Stock inválido" };
  if (!Number.isFinite(minStock) || minStock < 0) return { error: "Stock mínimo inválido" };

  return { price, cost, stock, minStock };
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) return res.status(401).json({ message: "No autorizado" });

    const {
      name, category, price, cost, stock, minStock,
      description, imageUrl, isPublic, sku
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: "Nombre y precio son obligatorios" });
    }

    const numbers = sanitizeProductNumbers({ price, cost, stock, minStock });
    if ("error" in numbers) {
      return res.status(400).json({ message: numbers.error });
    }

    // 1. INTENTAR BUSCAR EXISTENTE (Por SKU o Por Nombre)
    let product = null;

    // Prioridad 1: Buscar por SKU exacto
    if (sku) {
        product = await Product.findOne({ tenantId, sku });
    }

    // Prioridad 2: Si no hay SKU o no encontró, buscar por Nombre (Insensible a mayúsculas)
    if (!product) {
        product = await Product.findOne({
            tenantId,
            name: { $regex: new RegExp(`^${name}$`, "i") }
        });
    }

    // 🔄 CASO A: EL PRODUCTO YA EXISTE -> ACTUALIZAR Y SUMAR STOCK
    if (product) {
      product.stock += numbers.stock; // ✨ AQUÍ ESTÁ LA MAGIA: SUMA, NO REEMPLAZA

      // Actualizamos datos si vienen nuevos
      product.price = numbers.price;
      product.cost = numbers.cost;
      product.minStock = numbers.minStock;
      if (sku) product.sku = sku;
      if (category) product.category = category;
      if (description) product.description = description;
      if (imageUrl) product.imageUrl = imageUrl;
      if (isPublic !== undefined) product.isPublic = isPublic;

      await product.save();
      return res.json({ message: "Stock actualizado y datos fusionados", product });
    }

    // ✨ CASO B: NO EXISTE -> CREAR NUEVO
    const newProduct = new Product({
      name,
      sku: sku || `GEN-${Date.now()}`, // Si no pones SKU, genera uno automático
      category: category || "General",
      price: numbers.price,
      cost: numbers.cost,
      stock: numbers.stock,
      minStock: numbers.minStock,
      description: description || "",
      imageUrl: imageUrl || "",
      isPublic: Boolean(isPublic),
      tenantId,
    });

    await newProduct.save();
    return res.status(201).json(newProduct);

  } catch (error: any) {
    console.error("createProduct:", error);
    return res.status(500).json({ message: "Error guardando producto" });
  }
};

/* ======================================================
   ❌ ELIMINAR PRODUCTO
====================================================== */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    
    const deleted = await Product.findOneAndDelete({ _id: req.params.id, tenantId });

    if (!deleted) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    return res.json({ message: "Producto eliminado" });
  } catch (error) {
    return res.status(500).json({ message: "Error al eliminar" });
  }
};

/* ======================================================
   🔄 ACTUALIZAR PRODUCTO (EDICIÓN MANUAL)
====================================================== */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;

    const allowedFields = [
      "name",
      "category",
      "description",
      "imageUrl",
      "isPublic",
      "sku",
      "price",
      "cost",
      "stock",
      "minStock",
    ];

    const updates: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.price !== undefined && (!Number.isFinite(Number(updates.price)) || Number(updates.price) < 0)) {
      return res.status(400).json({ message: "Precio inválido" });
    }

    if (updates.cost !== undefined && (!Number.isFinite(Number(updates.cost)) || Number(updates.cost) < 0)) {
      return res.status(400).json({ message: "Costo inválido" });
    }

    if (updates.stock !== undefined && (!Number.isFinite(Number(updates.stock)) || Number(updates.stock) < 0)) {
      return res.status(400).json({ message: "Stock inválido" });
    }

    if (updates.minStock !== undefined && (!Number.isFinite(Number(updates.minStock)) || Number(updates.minStock) < 0)) {
      return res.status(400).json({ message: "Stock mínimo inválido" });
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, tenantId },
      updates,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    return res.json(updatedProduct);
  } catch (error) {
    return res.status(500).json({ message: "Error al actualizar" });
  }
};

/* ======================================================
   ⚡ VENTA RÁPIDA (CORREGIDA)
====================================================== */
export const quickSell = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId;
        const product = await Product.findOne({ _id: req.params.id, tenantId });
        
        if(!product) return res.status(404).json({message: "No encontrado"});
        
        if(product.stock > 0) {
            // 1. Restar Stock
            product.stock -= 1;
            await product.save();

            // 🛡️ CORRECCIÓN MATEMÁTICA: Asegurar números
            const price = Number(product.price) || 0;
            const cost = Number(product.cost) || 0;
            const profit = price - cost;

            // 2. Crear Venta
            const newSale = new Sale({
                productId: product._id,
                productName: product.name,
                category: product.category,
                quantity: 1,
                price: price,
                cost: cost,
                profit: profit, // ✅ Ahora es seguro
                tenantId,
                createdAt: new Date()
            });
            await newSale.save();

            res.json({ message: "Venta registrada", product, sale: newSale });
        } else {
            return res.status(400).json({ message: "Sin stock" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error en venta rápida" });
    }
};

// 👇 AGREGA ESTO AL FINAL DEL CONTROLADOR DE PRODUCTOS
export const bulkAddStock = async (req: Request, res: Response) => {
    try {
        const { items } = req.body; // Recibimos el array [{name: "gorilon rojo", quantity: 3}, ...]
        const tenantId = (req as any).user?.tenantId;

        const results = [];

        for (const item of items) {
            // Buscamos si ya existe un producto con ese nombre (o similar)
            // Usamos una expresión regular para buscar sin importar mayúsculas
            let product = await Product.findOne({ 
                name: { $regex: new RegExp(`^${item.name}$`, "i") }, 
                tenantId 
            });

            if (product) {
                // Si existe, sumamos al stock
                product.stock += item.quantity;
                await product.save();
                results.push({ name: item.name, status: "Actualizado", newStock: product.stock });
            } else {
                // Si no existe, lo creamos como "Filamento"
                const newProduct = new Product({
                    name: item.name,
                    price: 0, // Precio de venta 0 por defecto (es insumo)
                    cost: 0,  // Costo a definir luego
                    stock: item.quantity,
                    category: "Filamento",
                    tenantId
                });
                await newProduct.save();
                results.push({ name: item.name, status: "Creado", newStock: item.quantity });
            }
        }

        res.json({ message: "Stock procesado correctamente", results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al cargar stock masivo" });
    }
};

export const getProductsSummary = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId;
        if (!tenantId) return res.status(401).json({ message: 'No autorizado' });

        const products = await Product.find({ tenantId }).select('stock minStock price cost');

        let totalProducts = products.length;
        let totalUnits = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;
        let inventorySaleValue = 0;
        let inventoryCostValue = 0;

        products.forEach((product: any) => {
            const stock = Number(product.stock || 0);
            const minStock = Number(product.minStock ?? 5);
            const price = Number(product.price || 0);
            const cost = Number(product.cost || 0);

            totalUnits += stock;
            inventorySaleValue += stock * price;
            inventoryCostValue += stock * cost;

            if (stock <= 0) outOfStockCount += 1;
            if (stock > 0 && stock <= minStock) lowStockCount += 1;
        });

        return res.json({
            totalProducts,
            totalUnits,
            lowStockCount,
            outOfStockCount,
            inventorySaleValue,
            inventoryCostValue,
            estimatedGrossMarginValue: inventorySaleValue - inventoryCostValue,
        });
    } catch (error) {
        console.error('getProductsSummary:', error);
        return res.status(500).json({ message: 'Error obteniendo resumen de inventario' });
    }
};
