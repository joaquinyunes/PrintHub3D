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
        ideas: { name: string; icon: string; category: string; downloads: string; link: string }[];
        printers: { name: string; description: string; imageUrl: string; price: number; link: string }[];
        printersTitle: string;
        printersSubtitle: string;
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
        ideas: { type: Schema.Types.Mixed, default: [
            { name: 'iPhone Stand', icon: '📱', category: 'Organizers', downloads: '15k+', link: '' },
            { name: 'Under Desk Drawer', icon: '🗄️', category: 'Storage', downloads: '12k+', link: '' },
            { name: 'OTF Fidget', icon: '🎯', category: 'Toys', downloads: '10k+', link: '' },
            { name: 'Cable Wrapper', icon: '🔌', category: 'Organizers', downloads: '8k+', link: '' },
            { name: 'Filament Clip', icon: '🎞️', category: 'Accessories', downloads: '7k+', link: '' },
            { name: 'Capybara', icon: '🦫', category: 'Toys', downloads: '5k+', link: '' },
        ]},
        printers: { type: Schema.Types.Mixed, default: [] },
        printersTitle: { type: String, default: 'Impresoras 3D' },
        printersSubtitle: { type: String, default: 'Vendemos impresoras Bambu Lab y accesorios' },
    },
    tenantId: { type: String, default: appConfig.defaultTenantId }
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
