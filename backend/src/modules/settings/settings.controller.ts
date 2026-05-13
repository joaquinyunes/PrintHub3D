import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import Settings from './settings.model';
import { appConfig } from '../../config';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.resolve(__dirname, '../../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

export const uploadHomeImage = [
    upload.single('image'),
    async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                res.status(400).json({ message: 'No se recibió imagen' });
                return;
            }
            res.json({ imageUrl: `/uploads/${req.file.filename}` });
        } catch (error) {
            res.status(500).json({ message: 'Error al subir imagen' });
        }
    }
];

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
            homepageSections,
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
                homepageSections,
            },
            { new: true, upsert: true }
        );

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando configuración' });
    }
};
