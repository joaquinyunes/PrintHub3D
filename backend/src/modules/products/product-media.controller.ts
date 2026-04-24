import { Request, Response } from 'express';
import ProductMedia from './product-media.model';

export const getProductMedia = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId;
        const media = await ProductMedia.find({ tenantId });
        res.json(media);
    } catch(error) {
        res.status(500).json({ message: 'Error obtener medios' });
    }
};

export const createProductMedia = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId;
        const { productName, imageUrl, videoUrl, type } = req.body;
        
        // Verificar si ya existe para este producto
        const existing = await ProductMedia.findOne({ productName, tenantId });
        
        if (existing) {
            // Actualizar
            existing.imageUrl = imageUrl || existing.imageUrl;
            existing.videoUrl = videoUrl || existing.videoUrl;
            if (type) existing.type = type;
            await existing.save();
            return res.json(existing);
        }
        
        const media = await ProductMedia.create({
            productName,
            imageUrl,
            videoUrl,
            type: type || 'image',
            tenantId
        });
        
        res.status(201).json(media);
    } catch(error) {
        res.status(500).json({ message: 'Error crear medio' });
    }
};

export const deleteProductMedia = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId;
        const { id } = req.params;
        
        await ProductMedia.findOneAndDelete({ _id: id, tenantId });
        res.json({ message: 'Medio eliminado' });
    } catch(error) {
        res.status(500).json({ message: 'Error eliminar medio' });
    }
};

// Buscar media por nombre de producto (para tracking público)
export const getMediaByProductName = async (productName: string, tenantId: string) => {
    try {
        const allMedia = await ProductMedia.find({ tenantId });
        
        // Buscar coincidencia (parcial, case insensitive)
        const match = allMedia.find(m => 
            productName.toLowerCase().includes(m.productName.toLowerCase()) ||
            m.productName.toLowerCase().includes(productName.toLowerCase())
        );
        
        return match || null;
    } catch {
        return null;
    }
};