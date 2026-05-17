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
    rastreoSection: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Rastreá tu Pedido' },
        subtitle: { type: String, default: 'Ingresá tu código y seguí tu pedido en tiempo real' },
        badge: { type: String, default: '📦 RASTREO' },
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
        badge: { type: String, default: '🏆 PRODUCTOS' },
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
        animation: {
            enabled: { type: Boolean, default: true },
            title: { type: String, default: 'Impresora 3D Bambu Lab X1C' },
            subtitle: { type: String, default: 'La nueva generación de precisión y velocidad' },
            badge: { type: String, default: '🖨️ PROFESIONAL' },
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
        contactoBadge: { type: String, default: '📩 CONTACTO' },
    },
    homepageSections: {
        heroTitle: { type: String, default: 'Global 3D' },
        heroSubtitle: { type: String, default: 'Transformamos tus ideas en objetos reales.' },
        heroDescription: { type: String, default: 'Impresión 3D de alta calidad en Corrientes' },
        heroBadge: { type: String, default: 'Envíos gratis en pedidos mayores a $50.000' },
        heroStats: {
            reviews: { type: String, default: '4.9' },
            reviewsCount: { type: String, default: '200+ reseñas' },
            orders: { type: String, default: '500+' },
            delivery: { type: String, default: '24-72h' },
        },
        heroFeatures: [{ type: String, default: [] }],
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
    },
    tenantId: { type: String, default: appConfig.defaultTenantId }
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
