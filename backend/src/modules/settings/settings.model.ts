import mongoose, { Schema, Document } from 'mongoose';
import { appConfig } from '../../config';

const CategorySchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    subCategories: [{
        id: String,
        name: String,
        products: [{
            id: String,
            name: String,
            description: String,
            price: Number,
            imageUrl: String,
            imageHover: String,
            videoUrl: String,
            effects: String,
            animations: String,
            stock: { type: Number, default: -1 },
            enabled: { type: Boolean, default: true }
        }]
    }]
}, { _id: false });

export interface ISettings extends Document {
    businessName: string;
    adminPhone: string;
    currencySymbol: string;
    welcomeMessage: string;
    filamentCostAverage: number;
    monthlyGoal: number;
    trackingBaseUrl: string;
    customerMessageTemplates: {
        pending: string;
        in_progress: string;
        completed: string;
        delivered: string;
        cancelled: string;
        resendTracking: string;
    };
    rastreoSection: {
        enabled: boolean;
        title: string;
        subtitle: string;
        badge: string;
        categories: Array<{ id: string; name: string; icon: string; imageUrl: string; description: string }>;
        customVideos: Array<{ code: string; videoUrl: string; title: string; description: string }>;
    };
    productosSection: {
        enabled: boolean;
        title: string;
        subtitle: string;
        badge: string;
        heroImage: string;
        categories: Array<{ id: string; name: string; icon: string; imageUrl: string; description: string; subCategories: Array<{ id: string; name: string; products: Array<{ id: string; name: string; description: string; price: number; imageUrl: string; imageHover: string; videoUrl: string; effects: string; animations: string; stock: number; enabled: boolean }> }> }>;
        allProductsSearch: { enabled: boolean; placeholder: string };
    };
    impresorasSection: {
        enabled: boolean;
        title: string;
        subtitle: string;
        badge: string;
        heroImage: string;
        animation: { enabled: boolean; title: string; subtitle: string; badge: string; price: string; accentColor: string; framesDir: string; totalFrames: number };
        categories: Array<{ id: string; name: string; icon: string; imageUrl: string; description: string; subCategories: Array<{ id: string; name: string; products: Array<{ id: string; name: string; description: string; price: number; imageUrl: string; imageHover: string; videoUrl: string; effects: string; animations: string; stock: number; enabled: boolean }> }> }>;
    };
    filamentosSection: {
        enabled: boolean;
        title: string;
        subtitle: string;
        badge: string;
        heroImage: string;
        categories: Array<{ id: string; name: string; icon: string; imageUrl: string; description: string; subCategories: Array<{ id: string; name: string; products: Array<{ id: string; name: string; description: string; price: number; imageUrl: string; imageHover: string; videoUrl: string; effects: string; animations: string; stock: number; enabled: boolean }> }> }>;
    };
    contactInfo: {
        whatsapp: string;
        whatsappDisplay: string;
        instagram: string;
        instagramUrl: string;
        location: string;
        email: string;
        contactoTitle: string;
        contactoSubtitle: string;
        contactoBadge: string;
    };
    homepageSections: {
        heroTitle: string;
        heroSubtitle: string;
        heroDescription: string;
        heroBadge: string;
        heroStats: { reviews: string; reviewsCount: string; orders: string; delivery: string };
        heroFeatures: string[];
        productStar: { enabled: boolean; title: string; subtitle: string; badge: string; price: string; originalPrice: string; teams: string[] };
        copaAnimation: { enabled: boolean; title: string; subtitle: string; badge: string; price: string; accentColor: string; framesDir: string; totalFrames: number };
        impresoraAnimation: { enabled: boolean; title: string; subtitle: string; badge: string; price: string; accentColor: string; framesDir: string; totalFrames: number };
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
    trackingBaseUrl: { type: String, default: appConfig.trackingBaseUrl },
    customerMessageTemplates: {
        pending: { type: String, default: defaultTemplates.pending },
        in_progress: { type: String, default: defaultTemplates.in_progress },
        completed: { type: String, default: defaultTemplates.completed },
        delivered: { type: String, default: defaultTemplates.delivered },
        cancelled: { type: String, default: defaultTemplates.cancelled },
        resendTracking: { type: String, default: defaultTemplates.resendTracking },
    },
    rastreoSection: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Rastreá tu Pedido' },
        subtitle: { type: String, default: 'Ingresá tu código y seguí tu pedido en tiempo real' },
        badge: { type: String, default: 'RASTREO' },
        categories: [{
            id: { type: String, required: true },
            name: { type: String, required: true },
            icon: { type: String, default: '' },
            imageUrl: { type: String, default: '' },
            description: { type: String, default: '' }
        }],
        customVideos: [{
            code: { type: String, default: '' },
            videoUrl: { type: String, default: '' },
            title: { type: String, default: '' },
            description: { type: String, default: '' }
        }],
    },
    productosSection: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Productos Personalizados' },
        subtitle: { type: String, default: 'Vasos, llaveros, trofeos y más - Personalizados a tu gusto' },
        badge: { type: String, default: 'PRODUCTOS' },
        heroImage: { type: String, default: '' },
        categories: [{
            id: { type: String, required: true },
            name: { type: String, required: true },
            icon: { type: String, default: '' },
            imageUrl: { type: String, default: '' },
            description: { type: String, default: '' },
            subCategories: [{
                id: { type: String, default: '' },
                name: { type: String, default: '' },
                products: [{
                    id: { type: String, default: '' },
                    name: { type: String, default: '' },
                    description: { type: String, default: '' },
                    price: { type: Number, default: 0 },
                    imageUrl: { type: String, default: '' },
                    videoUrl: { type: String, default: '' },
                    effects: { type: String, default: '' },
                    animations: { type: String, default: '' },
                    enabled: { type: Boolean, default: true }
                }]
            }]
        }],
        allProductsSearch: {
            enabled: { type: Boolean, default: true },
            placeholder: { type: String, default: 'Buscar productos...' }
        },
    },
    impresorasSection: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Impresoras 3D' },
        subtitle: { type: String, default: 'Bambu Lab y más - Precisión y velocidad' },
        // badge y heroImage faltaban: se editaban en /admin/home pero se perdían al guardar.
        badge: { type: String, default: 'IMPRESORAS' },
        heroImage: { type: String, default: '' },
        animation: {
            enabled: { type: Boolean, default: true },
            title: { type: String, default: 'Impresora 3D Bambu Lab X1C' },
            subtitle: { type: String, default: 'La nueva generación de precisión y velocidad' },
            badge: { type: String, default: '' },
            price: { type: String, default: '$469.000' },
            accentColor: { type: String, default: '#3b82f6' },
            framesDir: { type: String, default: '/frames-mp/' },
            totalFrames: { type: Number, default: 192 },
        },
        categories: [{
            id: { type: String, required: true },
            name: { type: String, required: true },
            icon: { type: String, default: '' },
            imageUrl: { type: String, default: '' },
            description: { type: String, default: '' },
            subCategories: [{
                id: { type: String, default: '' },
                name: { type: String, default: '' },
                products: [{
                    id: { type: String, default: '' },
                    name: { type: String, default: '' },
                    description: { type: String, default: '' },
                    price: { type: Number, default: 0 },
                    imageUrl: { type: String, default: '' },
                    videoUrl: { type: String, default: '' },
                    effects: { type: String, default: '' },
                    animations: { type: String, default: '' },
                    enabled: { type: Boolean, default: true }
                }]
            }]
        }],
    },
    filamentosSection: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Filamentos y Materiales' },
        subtitle: { type: String, default: 'PLA, PETG, ABS y más - Todos los colores' },
        // badge y heroImage faltaban: se editaban en /admin/home pero se perdían al guardar.
        badge: { type: String, default: 'FILAMENTOS' },
        heroImage: { type: String, default: '' },
        categories: [{
            id: { type: String, required: true },
            name: { type: String, required: true },
            icon: { type: String, default: '' },
            imageUrl: { type: String, default: '' },
            description: { type: String, default: '' },
            subCategories: [{
                id: { type: String, default: '' },
                name: { type: String, default: '' },
                products: [{
                    id: { type: String, default: '' },
                    name: { type: String, default: '' },
                    description: { type: String, default: '' },
                    price: { type: Number, default: 0 },
                    imageUrl: { type: String, default: '' },
                    videoUrl: { type: String, default: '' },
                    effects: { type: String, default: '' },
                    animations: { type: String, default: '' },
                    enabled: { type: Boolean, default: true }
                }]
            }]
        }],
    },
    contactInfo: {
        whatsapp: { type: String, default: '' },
        whatsappDisplay: { type: String, default: '' },
        instagram: { type: String, default: '' },
        instagramUrl: { type: String, default: '' },
        facebook: { type: String, default: '' },
        facebookUrl: { type: String, default: '' },
        location: { type: String, default: 'Corrientes, Argentina' },
        email: { type: String, default: '' },
        contactoTitle: { type: String, default: 'Contactanos' },
        contactoSubtitle: { type: String, default: 'Estamos para ayudarte' },
        contactoBadge: { type: String, default: 'CONTACTO' },
    },
    homepageSections: {
        heroTitle: { type: String, default: 'Global 3D' },
        heroSubtitle: { type: String, default: 'Impresión 3D en Corrientes' },
        heroDescription: { type: String, default: '' },
        heroBadge: { type: String, default: '' },
        heroStats: {
            reviews: { type: String, default: '' },
            reviewsCount: { type: String, default: '' },
            orders: { type: String, default: '' },
            delivery: { type: String, default: '' },
        },
        heroFeatures: [{ type: String, default: [] }],
        productStar: {
            enabled: { type: Boolean, default: false },
            title: { type: String, default: '' },
            subtitle: { type: String, default: '' },
            badge: { type: String, default: '' },
            price: { type: String, default: '' },
            originalPrice: { type: String, default: '' },
            teams: [{ type: String, default: [] }],
        },
        copaAnimation: {
            enabled: { type: Boolean, default: true },
            title: { type: String, default: '' },
            subtitle: { type: String, default: '' },
            badge: { type: String, default: '' },
            price: { type: String, default: '' },
            accentColor: { type: String, default: '#ffd21f' },
            framesDir: { type: String, default: '/frames-copakling/' },
            totalFrames: { type: Number, default: 73 },
        },
        // Faltaba en el schema: lo que se editaba en /admin/home > "Impresora
        // Animation" se descartaba silenciosamente al guardar.
        impresoraAnimation: {
            enabled: { type: Boolean, default: true },
            title: { type: String, default: '' },
            subtitle: { type: String, default: '' },
            badge: { type: String, default: '' },
            price: { type: String, default: '' },
            accentColor: { type: String, default: '#ffd21f' },
            framesDir: { type: String, default: '/frames-mp/' },
            totalFrames: { type: Number, default: 192 },
        },
    },
    tenantId: { type: String, default: appConfig.defaultTenantId }
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
