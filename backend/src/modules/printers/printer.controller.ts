import { Request, Response } from 'express';
import Printer from './printer.model';

// Obtener todas las impresoras
export const getPrinters = async (req: Request, res: Response) => {
    try {
        const printers = await Printer.find({ tenantId: 'global3d_hq' });
        res.json(printers);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo impresoras' });
    }
};

// Crear impresora
export const createPrinter = async (req: Request, res: Response) => {
    try {
        const { name, model } = req.body;
        const newPrinter = new Printer({ 
            name, 
            model, 
            tenantId: 'global3d_hq' 
        });
        await newPrinter.save();
        res.status(201).json(newPrinter);
    } catch (error) {
        res.status(500).json({ message: 'Error creando impresora' });
    }
};

// Borrar impresora
export const deletePrinter = async (req: Request, res: Response) => {
    try {
        await Printer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Impresora eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error eliminando impresora' });
    }
};