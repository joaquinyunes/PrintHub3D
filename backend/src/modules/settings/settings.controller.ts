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
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

export const uploadHomeImage = [
    upload.single('image'),
    async (req: Request, res: Response) => {
        try {
            const file = (req as any).file;
            if (!file) {
                res.status(400).json({ message: 'No se recibió imagen' });
                return;
            }
            res.json({ imageUrl: `/uploads/${file.filename}` });
        } catch (error) {
            res.status(500).json({ message: 'Error al subir imagen' });
        }
    }
];

const DEFAULT_HOMEPAGE_SECTIONS = {
    heroTitle: 'Global 3D',
    heroSubtitle: 'Transformamos tus ideas en objetos reales.',
    heroDescription: 'Impresión 3D de alta calidad en Corrientes',
    heroBadge: 'Envíos gratis en pedidos mayores a $50.000',
    heroStats: { reviews: '4.9', reviewsCount: '200+ reseñas', orders: '500+', delivery: '24-72h' },
    heroFeatures: ['Impresión rápida', 'Calidad premium', 'Envío rápido', 'Soporte 24/7'],
    productStar: {
        enabled: true,
        title: 'Vaso Personalizado River Plate',
        subtitle: 'Impresión 3D de alta calidad con el escudo de tu equipo favorito.',
        badge: '🔥 #1 MÁS VENDIDO',
        price: '$3.500',
        originalPrice: '$4.500',
        teams: ['Boca', 'Racing', 'Independiente', 'Huracán']
    },
    copaAnimation: {
        enabled: true,
        title: 'Copa de la Liga',
        subtitle: 'Diseño 3D de alta calidad con detalles premium',
        badge: '🏆 TROFEO PREMIUM',
        price: '$12.500',
        accentColor: '#f59e0b',
        framesDir: '/frames-copakling/',
        totalFrames: 73
    },
};

function mergeSettings(settings: any) {
    return {
        rastreoSection: {
            enabled: true,
            title: 'Rastreá tu Pedido',
            subtitle: 'Ingresá tu código y seguí tu pedido en tiempo real',
            badge: '📦 RASTREO',
            categories: [],
            customVideos: [],
            ...(settings?.rastreoSection || {})
        },
        productosSection: {
            enabled: true,
            title: 'Productos Personalizados',
            subtitle: 'Vasos, llaveros, trofeos y más - Personalizados a tu gusto',
            categories: [],
            allProductsSearch: { enabled: true, placeholder: 'Buscar productos...' },
            ...(settings?.productosSection || {})
        },
        impresorasSection: {
            enabled: true,
            title: 'Impresoras 3D',
            subtitle: 'Bambu Lab y más - Precisión y velocidad',
            animation: {
                enabled: true,
                title: 'Impresora 3D Bambu Lab X1C',
                subtitle: 'La nueva generación de precisión y velocidad',
                badge: '🖨️ PROFESIONAL',
                price: '$469.000',
                accentColor: '#3b82f6',
                framesDir: '/frames-mp/',
                totalFrames: 192,
                ...(settings?.impresorasSection?.animation || {})
            },
            categories: [],
            ...(settings?.impresorasSection || {})
        },
        filamentosSection: {
            enabled: true,
            title: 'Filamentos y Materiales',
            subtitle: 'PLA, PETG, ABS y más - Todos los colores',
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
            (req as any).tenantId || (req as any).user?.tenantId || appConfig.defaultTenantId;
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
        const tenantId = (req as any).tenantId || appConfig.defaultTenantId;
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