import mongoose, { Schema, Document } from 'mongoose';
import { appConfig } from '../../config';

export interface ISettings extends Document {
    businessName: string;
    adminPhone: string;
    currencySymbol: string;
    welcomeMessage: string;
    filamentCostAverage: number;
    trackingBaseUrl: string;
    customerMessageTemplates: {
        pending: string;
        in_progress: string;
        completed: string;
        delivered: string;
        cancelled: string;
        resendTracking: string;
    };
    homepageSections: {
        monthlyGoal: number;
        heroTitle: string;
        heroSubtitle: string;
        heroDescription: string;
        heroBadge: string;
        heroStats: { reviews: string; reviewsCount: string; orders: string; delivery: string };
        heroFeatures: string[];
        ideas: any[];
        productStar: { enabled: boolean; title: string; subtitle: string; badge: string; price: string; originalPrice: string; teams: string[] };
        copaAnimation: { enabled: boolean; title: string; subtitle: string; badge: string; price: string; accentColor: string; framesDir: string; totalFrames: number };
        impresoraAnimation: { enabled: boolean; title: string; subtitle: string; badge: string; price: string; accentColor: string; framesDir: string; totalFrames: number };
        printers: any[];
        printersTitle: string;
        printersSubtitle: string;
        scrollVideo?: { videoSrc: string; title: string; price: string };
        productCategories: any[];
        customCodes: any[];
        contactInfo: {
            whatsapp: string;
            whatsappDisplay: string;
            instagram: string;
            instagramUrl: string;
            location: string;
            email: string;
        };
    };
    tenantId: string;
}

const defaultTemplates = {
    pending: 'Hola {clientName} 👋 Tu pedido {trackingCode} está pendiente de producción. Sigue tu pedido en {trackingUrl}',
    in_progress: 'Hola {clientName} 👋 Tu pedido {trackingCode} ya está en producción. Sigue el avance en {trackingUrl}',
    completed: '¡Buenas noticias {clientName}! Tu pedido {trackingCode} está listo para retiro/entrega. Más detalles en {trackingUrl}',
    delivered: 'Gracias por tu compra {clientName} 🙌 Tu pedido {trackingCode} figura como entregado. Puedes valorar tu experiencia en {trackingUrl}',
    cancelled: 'Hola {clientName}, tu pedido {trackingCode} fue cancelado. Si quieres retomarlo escríbenos por WhatsApp.',
    resendTracking: 'Hola {clientName} 👋 Aquí tienes nuevamente tu código de seguimiento: {trackingCode}. Consulta tu pedido en {trackingUrl}',
};

const SettingsSchema: Schema = new Schema({
    businessName: { type: String, default: 'Global 3D' },
    adminPhone: { type: String, default: '' },
    currencySymbol: { type: String, default: '$' },
    welcomeMessage: { type: String, default: 'Hola, bienvenido a Global 3D.' },
    filamentCostAverage: { type: Number, default: 15000 },
    monthlyGoal: { type: Number, default: 2000000 },
    trackingBaseUrl: { type: String, default: 'http://localhost:3000/track' },
    customerMessageTemplates: {
        pending: { type: String, default: defaultTemplates.pending },
        in_progress: { type: String, default: defaultTemplates.in_progress },
        completed: { type: String, default: defaultTemplates.completed },
        delivered: { type: String, default: defaultTemplates.delivered },
        cancelled: { type: String, default: defaultTemplates.cancelled },
        resendTracking: { type: String, default: defaultTemplates.resendTracking },
    },
    homepageSections: {
        heroTitle: { type: String, default: 'Global 3D' },
        heroSubtitle: { type: String, default: 'Transformamos tus ideas en objetos reales.' },
        heroDescription: { type: String, default: 'Impresión 3D de alta calidad en Corrientes' },
        heroBadge: { type: String, default: 'Envíos gratis en pedidos mayores a $50.000' },
        monthlyGoal: { type: Number, default: 2000000 },
        heroStats: {
            reviews: { type: String, default: '4.9' },
            reviewsCount: { type: String, default: '200+ reseñas' },
            orders: { type: String, default: '500+' },
            delivery: { type: String, default: '24-72h' },
        },
        heroFeatures: [{ type: String, default: [] }],
        ideas: [{ type: Schema.Types.Mixed, default: [] }],
        printers: [{ type: Schema.Types.Mixed, default: [] }],
        printersTitle: { type: String, default: 'Impresoras 3D' },
        printersSubtitle: { type: String, default: 'Vendemos impresoras Bambu Lab y accesorios' },
        scrollVideo: { type: Schema.Types.Mixed, default: { videoSrc: '/copakling-optimized.mp4', title: 'Impresora 3D Bambu Lab', price: '469000' } },
        productStar: {
            enabled: { type: Boolean, default: true },
            title: { type: String, default: 'Vaso Personalizado River Plate' },
            subtitle: { type: String, default: 'Impresión 3D de alta calidad con el escudo de tu equipo favorito.' },
            badge: { type: String, default: '🔥 #1 MÁS VENDIDO' },
            price: { type: String, default: '$3.500' },
            originalPrice: { type: String, default: '$4.500' },
            teams: [{ type: String, default: [] }],
        },
        copaAnimation: {
            enabled: { type: Boolean, default: true },
            title: { type: String, default: 'Copa de la Liga' },
            subtitle: { type: String, default: 'Diseño 3D de alta calidad con detalles premium' },
            badge: { type: String, default: '🏆 TROFEO PREMIUM' },
            price: { type: String, default: '$12.500' },
            accentColor: { type: String, default: '#f59e0b' },
            framesDir: { type: String, default: '/frames-copakling/' },
            totalFrames: { type: Number, default: 73 },
        },
        impresoraAnimation: {
            enabled: { type: Boolean, default: true },
            title: { type: String, default: 'Impresora 3D Bambu Lab X1C' },
            subtitle: { type: String, default: 'La nueva generación de precisión y velocidad' },
            badge: { type: String, default: '🖨️ PROFESIONAL' },
            price: { type: String, default: '$469.000' },
            accentColor: { type: String, default: '#3b82f6' },
            framesDir: { type: String, default: '/frames-mp/' },
            totalFrames: { type: Number, default: 192 },
        },
        productCategories: [{ type: Schema.Types.Mixed, default: [] }],
        customCodes: [{ type: Schema.Types.Mixed, default: [] }],
        contactInfo: {
            whatsapp: { type: String, default: '' },
            whatsappDisplay: { type: String, default: '' },
            instagram: { type: String, default: '' },
            instagramUrl: { type: String, default: '' },
            location: { type: String, default: 'Corrientes, Argentina' },
            email: { type: String, default: '' },
        },
    },
    tenantId: { type: String, default: appConfig.defaultTenantId }
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
