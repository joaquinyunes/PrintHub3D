import { Request, Response } from 'express';
import Settings from './settings.model';

// Obtener Configuración (Siempre devuelve algo)
export const getSettings = async (req: Request, res: Response) => {
    try {
        const tenantId = 'global3d_hq';
        let settings = await Settings.findOne({ tenantId });

        if (!settings) {
            // Si no existe, creamos la configuración por defecto
            settings = await Settings.create({ tenantId });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo configuración' });
    }
};

// Guardar cambios
export const updateSettings = async (req: Request, res: Response) => {
    try {
        const tenantId = 'global3d_hq';
        const { businessName, adminPhone, currencySymbol, welcomeMessage, filamentCostAverage } = req.body;

        const settings = await Settings.findOneAndUpdate(
            { tenantId },
            { businessName, adminPhone, currencySymbol, welcomeMessage, filamentCostAverage },
            { new: true, upsert: true } // Upsert: Si no existe, lo crea
        );

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando configuración' });
    }
};