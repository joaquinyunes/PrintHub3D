import { Request, Response } from 'express';
import Product from './product.model';

// 1. OBTENER TODOS LOS PRODUCTOS (Para el Panel de Admin)
export const getProducts = async (req: Request, res: Response) => {
    try {
        // El middleware 'protect' inyecta el tenantId en req.user
        // Usamos "as any" porque TypeScript no sabe que extendimos el request
        const tenantId = (req as any).user?.tenantId; 

        if (!tenantId) {
             return res.status(401).json({ message: 'No autorizado. Falta identificación de tienda.' });
        }

        // Filtramos SOLO los productos de este usuario
        const products = await Product.find({ tenantId }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error("Error obteniendo productos:", error);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
};

// 2. OBTENER PRODUCTOS PÚBLICOS (Para la Tienda del Cliente /shop)
export const getPublicProducts = async (req: Request, res: Response) => {
    try {
        // En el futuro esto vendrá del subdominio (ej: nike.mishop.com)
        // Por ahora, permitimos probar pasando ?tenantId=... o usamos uno por defecto para test
        const tenantId = req.query.tenantId || 'global3d_hq';

        const products = await Product.find({ 
            tenantId,
            isPublic: true,    // SOLO los marcados como visibles
            stock: { $gt: 0 }  // SOLO los que tienen stock
        }).sort({ createdAt: -1 });
        
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error cargando tienda pública' });
    }
};

// 3. CREAR O ACTUALIZAR PRODUCTO (Dinámico)
export const createProduct = async (req: Request, res: Response) => {
    try {
        // Extraemos todos los datos, incluidos los nuevos campos
        const { name, category, price, cost, stock, minStock, description, imageUrl, isPublic, tenantId } = req.body;
        
        // Validación de seguridad (el middleware debe haber puesto el tenantId)
        if (!tenantId) return res.status(401).json({ message: 'No autorizado (Falta TenantID)' });

        // Buscar si ya existe el producto EN ESTA TIENDA específica
        let product = await Product.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') }, 
            tenantId 
        });

        if (product) {
            // 🔄 ACTUALIZAR EXISTENTE
            product.stock += Number(stock) || 0;
            product.price = price;
            
            // Actualizar campos opcionales si vienen
            if (cost !== undefined) product.cost = cost;
            if (description !== undefined) product.description = description;
            if (imageUrl !== undefined) product.imageUrl = imageUrl;
            if (isPublic !== undefined) product.isPublic = isPublic;
            
            await product.save();
            return res.json(product);
        }

        // ✨ CREAR NUEVO
        const newProduct = new Product({
            name,
            category: category || 'General',
            description: description || '',
            imageUrl: imageUrl || '',
            isPublic: isPublic || false, // Por defecto oculto
            price,
            cost: cost || 0,
            stock: Number(stock) || 0,
            minStock: minStock || 5,
            tenantId // Se guarda con el ID de TU tienda
        });

        await newProduct.save();
        res.status(201).json(newProduct);

    } catch (error: any) {
        console.error("Error guardando producto:", error);
        res.status(500).json({ message: 'Error al guardar producto', error: error.message });
    }
};

// 4. ELIMINAR PRODUCTO
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId;
        
        // Solo borramos si coincide el ID y el TenantID (Seguridad)
        const deleted = await Product.findOneAndDelete({ _id: req.params.id, tenantId });
        
        if (!deleted) {
            return res.status(404).json({ message: 'Producto no encontrado o no tienes permiso' });
        }

        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar producto' });
    }
};