import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import Product from './product.model';

// Configuración simple de almacenamiento local (uploads/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, '../../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const fname = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, fname);
  },
});
const upload = multer({ storage });

// Subir imagen asociada a un producto
export const uploadProductImage = [upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!productId || !file) {
      return res.status(400).json({ message: 'ProductoId e imagen son requeridos' });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    // Guarda ruta de la imagen en el producto
    (product as any).imageUrl = `/uploads/${file.filename}`;
    await product.save();
    res.json({ product: product });
  } catch (err) {
    res.status(500).json({ message: 'Error subiendo imagen' });
  }
}];
