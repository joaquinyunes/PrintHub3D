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

const DEFAULT_COPA_ANIMATION = {
  enabled: true,
  title: 'Copa de la Liga',
  subtitle: 'Diseño 3D de alta calidad con detalles premium',
  badge: '🏆 TROFEO PREMIUM',
  price: '$12.500',
  accentColor: '#f59e0b',
  framesDir: '/frames-copakling/',
  totalFrames: 73
};

const DEFAULT_PRINTER_ANIMATION = {
  enabled: true,
  title: 'Impresora 3D Bambu Lab X1C',
  subtitle: 'La nueva generación de precisión y velocidad',
  badge: '🖨️ PROFESIONAL',
  price: '$469.000',
  accentColor: '#3b82f6',
  framesDir: '/frames-mp/',
  totalFrames: 192
};

const DEFAULT_HOMEPAGE_SECTIONS = {
  heroTitle: 'Global 3D',
  heroSubtitle: 'Transformamos tus ideas en objetos reales.',
  heroDescription: 'Impresión 3D de alta calidad en Corrientes',
  heroBadge: 'Envíos gratis en pedidos mayores a $50.000',
  heroStats: { reviews: 4.9, reviewsCount: '200+ reseñas', orders: '500+', delivery: '24-72h' },
  heroFeatures: ['Impresión rápida', 'Calidad premium', 'Envío rápido', 'Soporte 24/7'],
  printersTitle: 'Impresoras 3D',
  printersSubtitle: 'Vendemos impresoras Bambu Lab y accesorios',
  printers: [],
  scrollVideo: { videoSrc: '/copakling-optimized.mp4', title: 'Impresora 3D Bambu Lab', price: '469000' },
  customCodes: [],
  productCategories: [],
  contactInfo: {
    whatsapp: '',
    whatsappDisplay: '',
    instagram: '',
    instagramUrl: '',
    location: 'Corrientes, Argentina',
    email: '',
  },
};

function mergeWithDefaults(settings: any) {
  if (!settings) return { ...DEFAULT_HOMEPAGE_SECTIONS };
  return {
    ...DEFAULT_HOMEPAGE_SECTIONS,
    ...settings,
    copaAnimation: { ...DEFAULT_COPA_ANIMATION, ...(settings.copaAnimation || {}) },
    impresoraAnimation: { ...DEFAULT_PRINTER_ANIMATION, ...(settings.impresoraAnimation || {}) },
    contactInfo: { ...DEFAULT_HOMEPAGE_SECTIONS.contactInfo, ...(settings.contactInfo || {}) },
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
        res.json({ ...settings, homepageSections: mergeWithDefaults(settings.homepageSections) });
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
        res.json({ ...settings, homepageSections: mergeWithDefaults(settings.homepageSections) });
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
        } = req.body;

        const current = await Settings.findOne({ tenantId }).lean();
        const currentSections = current?.homepageSections || {};
        const mergedSections = mergeWithDefaults({
          ...currentSections,
          ...(homepageSections || {})
        });

        const settings = await Settings.findOneAndUpdate(
            { tenantId },
            {
                $set: {
                    businessName,
                    adminPhone,
                    currencySymbol,
                    welcomeMessage,
                    filamentCostAverage,
                    trackingBaseUrl,
                    customerMessageTemplates,
                    homepageSections: mergedSections,
                    monthlyGoal,
                }
            },
            { returnDocument: 'after', upsert: true }
        );

        res.setHeader('Cache-Control', 'no-store');
        res.json({ ...settings.toObject(), homepageSections: mergedSections });
    } catch (error) {
        res.status(500).json({ message: 'Error actualizando configuración' });
    }
};
