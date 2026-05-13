import { Request, Response } from "express";
import { ProductRepository } from '../../repositories/product.repository';
import Sale from "../sales/sale.model";
import { InventoryService } from "./inventory.service";

const productRepository = new ProductRepository();

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

    const products = await productRepository.findByTenant(tenantId, {
      search: search || undefined,
      category: category || undefined,
      lowStock,
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
    const tenantId = String(req.query.tenantId || process.env.DEFAULT_TENANT_ID || "global3d_hq");

    const products = await productRepository.findByTenant(tenantId, {
      isPublic: true,
      inStock: true,
    });

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
    let product = await productRepository.findBySkuOrName(tenantId, sku, name);

    // 🔄 CASO A: EL PRODUCTO YA EXISTE -> ACTUALIZAR Y SUMAR STOCK
    if (product) {
      product.stock += numbers.stock;
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
    const newProduct = await productRepository.create({
      name,
      sku: sku || `GEN-${Date.now()}`,
      category: category || "General",
      price: numbers.price,
      cost: numbers.cost,
      stock: numbers.stock,
      minStock: numbers.minStock,
      description: description || "",
      imageUrl: imageUrl || "",
      isPublic: Boolean(isPublic),
      tenantId,
    } as any);

    return res.status(201).json(newProduct);

  } catch (error: any) {
    console.error("createProduct:", error);
    const detail = process.env.NODE_ENV !== 'production' ? (error?.message ?? String(error)) : undefined;
    return res.status(500).json({ message: 'Error guardando producto' + (detail ? `: ${detail}` : '') });
  }
};

/* ======================================================
   ❌ ELIMINAR PRODUCTO (SOFT DELETE)
====================================================== */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;

    const deleted = await productRepository.delete(id, tenantId);
    
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

    const updatedProduct = await productRepository.update(id, updates, tenantId);

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
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const user = (req as any).user;
        if (!tenantId) {
            return res.status(401).json({ message: "No autorizado" });
        }

        try {
            const { product, sale } = await InventoryService.quickSell(
                tenantId,
                req.params.id,
                user?.id,
                user?.name,
            );

            res.json({ message: "Venta registrada", product, sale });
        } catch (serviceError: any) {
            if (serviceError.message === "Producto no encontrado") {
                return res.status(404).json({ message: serviceError.message });
            }
            if (serviceError.message === "Sin stock") {
                return res.status(400).json({ message: serviceError.message });
            }
            throw serviceError;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error en venta rápida" });
    }
};

export const bulkAddStock = async (req: Request, res: Response) => {
    try {
        const { items } = req.body;
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const user = (req as any).user;

        if (!tenantId) {
            return res.status(401).json({ message: "No autorizado" });
        }

        const results = await InventoryService.bulkAddStock(
            tenantId,
            items,
            user?.id,
            user?.name,
        );

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

        const summary = await productRepository.getProductsSummary(tenantId);
        return res.json(summary);
    } catch (error) {
        console.error('getProductsSummary:', error);
        return res.status(500).json({ message: 'Error obteniendo resumen de inventario' });
    }
};
