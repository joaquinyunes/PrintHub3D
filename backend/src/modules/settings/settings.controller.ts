import { Request, Response } from 'express';
import Settings from './settings.model';

export const getSettings = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId || 'global3d_hq';
        let settings = await Settings.findOne({ tenantId });

        if (!settings) {
            settings = await Settings.create({ tenantId });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo configuración' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId || 'global3d_hq';
        const {
            businessName,
            adminPhone,
            currencySymbol,
            welcomeMessage,
            filamentCostAverage,
            trackingBaseUrl,
            customerMessageTemplates,
        } = req.body;

        const settings = await Settings.findOneAndUpdate(
            { tenantId },
            {
                businessName,
                adminPhone,
                currencySymbol,
                welcomeMessage,
                filamentCostAverage,
                trackingBaseUrl,
                customerMessageTemplates,
            },
            { new: true, upsert: true }
        );

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando configuración' });
    }
};
