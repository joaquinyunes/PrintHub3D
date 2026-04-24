import { Request, Response } from 'express';
import Settings from './settings.model';
import { appConfig } from '../../config';

export const getSettings = async (req: Request, res: Response) => {
    try {
        const tenantId =
            (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
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
        const tenantId =
            (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
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
