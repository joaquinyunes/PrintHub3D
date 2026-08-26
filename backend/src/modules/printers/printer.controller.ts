import { Request, Response } from 'express';
import Printer from './printer.model';
import { appConfig } from '../../config';
import { getLiveStatus } from './live.adapter';
import { reqParam } from '../../utils/reqParam';

// Obtener todas las impresoras
export const getPrinters = async (req: Request, res: Response) => {
    try {
        const tenantId =
            (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
        const printers = await Printer.find({ tenantId });
        res.json(printers);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo impresoras' });
    }
};

// Crear impresora
export const createPrinter = async (req: Request, res: Response) => {
    try {
        const tenantId =
            (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
        const { name, model, printerModel, integration } = req.body;
        const newPrinter = new Printer({
            name,
            printerModel: printerModel || model || 'Generica',
            integration: integration || undefined,
            tenantId,
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
        const tenantId =
            (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
        await Printer.findOneAndDelete({ _id: req.params.id, tenantId });
        res.json({ message: 'Impresora eliminada' });
    } catch (error) {
        res.status(500).json({ message: 'Error eliminando impresora' });
    }
};

// Actualizar estado de la impresora
export const updatePrinterStatus = async (req: Request, res: Response) => {
    try {
        const tenantId =
            (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
        const { id } = req.params;
        const { status } = req.body;

        const updatedPrinter = await Printer.findOneAndUpdate(
            { _id: id, tenantId },
            { status },
            { new: true } // Esto hace que te devuelva el documento ya actualizado
        );

        if (!updatedPrinter) {
            return res.status(404).json({ message: 'Impresora no encontrada' });
        }

        res.json(updatedPrinter);
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando el estado de la impresora' });
    }
};

// Configurar la integración de estado en vivo
export const updatePrinterIntegration = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
        const { type, url, apiKey, name, printerModel } = req.body;
        const update: any = {};
        if (typeof name === 'string') update.name = name;
        if (typeof printerModel === 'string') update.printerModel = printerModel;
        if (type !== undefined) update.integration = { type: type || 'none', url: url || '', apiKey: apiKey || '' };

        const printer = await Printer.findOneAndUpdate(
            { _id: reqParam(req, 'id'), tenantId },
            update,
            { new: true },
        );
        if (!printer) return res.status(404).json({ message: 'Impresora no encontrada' });
        res.json(printer);
    } catch (error) {
        res.status(500).json({ message: 'Error configurando la impresora' });
    }
};

// Estado en vivo (poll a OctoPrint / Moonraker / Bambu)
export const getPrinterLive = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
        const printer: any = await Printer.findOne({ _id: reqParam(req, 'id'), tenantId });
        if (!printer) return res.status(404).json({ message: 'Impresora no encontrada' });
        const live = await getLiveStatus(printer.integration);
        res.json(live);
    } catch (error) {
        res.status(500).json({ message: 'Error consultando estado en vivo' });
    }
};