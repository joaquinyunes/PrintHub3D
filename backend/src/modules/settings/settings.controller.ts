import { Request, Response } from 'express';
import Settings from './settings.model';
import { MB, singleUpload } from '../../middleware/upload.middleware';
import { appConfig } from '../../config';

export const uploadHomeImage = [
    // Imágenes o videos para la home. El tipo se verifica por contenido, no por el MIME del cliente.
    singleUpload({ field: 'image', allowedKinds: ['image', 'video'], maxBytes: 50 * MB }),
    async (req: Request, res: Response) => {
        const file = req.file;
        if (!file) {
            res.status(400).json({ message: 'No se recibió imagen' });
            return;
        }
        res.json({ imageUrl: `/uploads/${file.filename}` });
    }
];

const DEFAULT_HOMEPAGE_SECTIONS = {
    heroTitle: 'Global 3D',
    heroSubtitle: 'Impresión 3D en Corrientes',
    heroDescription: '',
    heroBadge: '',
    heroStats: { reviews: '', reviewsCount: '', orders: '', delivery: '' },
    heroFeatures: [] as string[],
    productStar: {
        enabled: false,
        title: '',
        subtitle: '',
        badge: '',
        price: '',
        originalPrice: '',
        teams: [] as string[]
    },
    // La tienda ya no usa frames: los pasillos 3D se dibujan en vivo.
    copaAnimation: {
        enabled: true,
        title: '',
        subtitle: '',
        badge: '',
        price: '',
        accentColor: '#ffd21f'
    },
    impresoraAnimation: {
        enabled: true,
        title: '',
        subtitle: '',
        badge: '',
        price: '',
        accentColor: '#ffd21f'
    },
};

function mergeSettings(settings: any) {
    return {
        rastreoSection: {
            enabled: true,
            title: 'Rastreá tu Pedido',
            subtitle: 'Ingresá tu código y seguí tu pedido en tiempo real',
            badge: 'RASTREO',
            categories: [],
            customVideos: [],
            ...(settings?.rastreoSection || {})
        },
        productosSection: {
            enabled: true,
            title: 'Productos Personalizados',
            subtitle: 'Vasos, llaveros, trofeos y más, personalizados a tu gusto',
            categories: [],
            allProductsSearch: { enabled: true, placeholder: 'Buscar productos...' },
            ...(settings?.productosSection || {})
        },
        impresorasSection: {
            enabled: true,
            title: 'Impresoras 3D',
            subtitle: 'Equipos Bambu Lab, repuestos y accesorios',
            animation: {
                enabled: true,
                title: '',
                subtitle: '',
                badge: '',
                price: '',
                accentColor: '#ffd21f',
                ...(settings?.impresorasSection?.animation || {})
            },
            categories: [],
            ...(settings?.impresorasSection || {})
        },
        filamentosSection: {
            enabled: true,
            title: 'Filamentos y Materiales',
            subtitle: 'PLA, PETG, ABS y TPU en bobinas listas para imprimir',
            categories: [],
            ...(settings?.filamentosSection || {})
        },
        contactInfo: {
            whatsapp: '',
            whatsappDisplay: '',
            instagram: '',
            instagramUrl: '',
            facebook: '',
            facebookUrl: '',
            location: 'Corrientes, Argentina',
            email: '',
            ...(settings?.contactInfo || {})
        },
        homepageSections: {
            ...DEFAULT_HOMEPAGE_SECTIONS,
            ...(settings?.homepageSections || {}),
        }
    };
}

export const getSettings = async (req: Request, res: Response) => {
    try {
        const tenantId =
            req.tenantId || req.user?.tenantId || appConfig.defaultTenantId;
        let settings = await Settings.findOne({ tenantId }).lean();

        if (!settings) {
            const newSettings = await Settings.create({ tenantId });
            settings = newSettings.toObject();
        }

        res.setHeader('Cache-Control', 'no-store');
        res.json({ ...settings, ...mergeSettings(settings) });
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo configuración' });
    }
};

export const getPublicSettings = async (req: Request, res: Response) => {
    try {
        const tenantId = req.tenantId || appConfig.defaultTenantId;
        let settings = await Settings.findOne({ tenantId }).lean();

        if (!settings) {
            const newSettings = await Settings.create({ tenantId });
            settings = newSettings.toObject();
        }

        res.setHeader('Cache-Control', 'no-store');
        res.json({ ...settings, ...mergeSettings(settings) });
    } catch (error) {
        res.status(500).json({ message: 'Error obteniendo configuración' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const tenantId =
            req.tenantId || req.user?.tenantId || appConfig.defaultTenantId;
        const {
            businessName,
            adminPhone,
            currencySymbol,
            welcomeMessage,
            filamentCostAverage,
            trackingBaseUrl,
            customerMessageTemplates,
            homepageSections,
            monthlyGoal,
            rastreoSection,
            productosSection,
            impresorasSection,
            filamentosSection,
            contactInfo,
        } = req.body;

        const updateData: any = {
            businessName,
            adminPhone,
            currencySymbol,
            welcomeMessage,
            filamentCostAverage,
            trackingBaseUrl,
            customerMessageTemplates,
            monthlyGoal,
            rastreoSection,
            productosSection,
            impresorasSection,
            filamentosSection,
            contactInfo,
        };

        if (homepageSections) {
            const current = await Settings.findOne({ tenantId }).lean();
            const currentHome = current?.homepageSections || {};
            updateData.homepageSections = {
                ...DEFAULT_HOMEPAGE_SECTIONS,
                ...currentHome,
                ...homepageSections,
            };
        }

        const settings = await Settings.findOneAndUpdate(
            { tenantId },
            { $set: updateData },
            { returnDocument: 'after', upsert: true }
        );

        res.setHeader('Cache-Control', 'no-store');
        res.json({ ...settings.toObject(), ...mergeSettings(settings.toObject()) });
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando configuración' });
    }
};