import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import axios from 'axios';
import { EventEmitter } from 'events';
import Chat from '../chat/chat.model';
import Settings from '../settings/settings.model';
import { appConfig } from '../../config';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] }
});

export const whatsappEvents = new EventEmitter();

let isReady = false;
let currentQr = '';

// 1. QR
client.on('qr', (qr) => {
    console.log('📱 ESCANEA EL QR DE WHATSAPP');
    currentQr = qr;
    qrcode.generate(qr, { small: true });
    whatsappEvents.emit('qr', qr);
});

// 2. CONEXIÓN LISTA
client.on('ready', () => {
    console.log('✅ WhatsApp Conectado y Sincronizando al Hub...');
    isReady = true;
    currentQr = '';
    whatsappEvents.emit('ready');
});

// 3. DESCONEXIÓN
client.on('disconnected', () => {
    console.log('❌ WhatsApp desconectado');
    isReady = false;
    whatsappEvents.emit('disconnected');
});

// 3. ESCUCHAR Y GUARDAR MENSAJES (CEREBRO PRINCIPAL)
client.on('message_create', async (msg) => {
    try {
        const contact = await msg.getContact();
        const senderNumber = contact.number; 
        const myNumber = client.info.wid.user;
        const isMe = msg.fromMe;

        // A. GUARDAR EN EL SOCIAL HUB
        await Chat.create({
            from: isMe ? myNumber : senderNumber,
            to: isMe ? senderNumber : myNumber,
            body: msg.body,
            platform: 'whatsapp',
            senderName: contact.pushname || contact.name || "Cliente WhatsApp",
            timestamp: new Date(),
            isMine: isMe,
            tenantId: appConfig.defaultTenantId
        });

        // B. DETECTOR DE PEDIDOS (Bot)
        if (!isMe) {
            const triggerWords = /PEDIDO NUEVO|NUEVA VENTA|VENDO|CARGAR PEDIDO/i;
            if (triggerWords.test(msg.body)) {
                console.log("🤖 BOT: Analizando posible venta...");
                const lines = msg.body.split('\n');
                const data: any = {};

                lines.forEach(line => {
                    const clienteMatch = line.match(/(?:Cliente|Nombre|Soy|Para)\s*[:.-]?\s*(.+)/i);
                    if (clienteMatch) data.customerName = clienteMatch[1].trim();

                    const itemMatch = line.match(/(?:Item|Producto|Modelo|Pieza|Vendo)\s*[:.-]?\s*(.+)/i);
                    if (itemMatch) data.productName = itemMatch[1].trim();

                    const precioMatch = line.match(/(?:Precio|Valor|Sale|\$)\s*[:.-]?\s*(\d+)/i);
                    if (precioMatch) data.price = Number(precioMatch[1]);
                    
                    const fechaMatch = line.match(/(?:Fecha|Para el|Entrega)\s*[:.-]?\s*(.+)/i);
                    if (fechaMatch) data.dueDate = fechaMatch[1].trim();
                });

                if (data.customerName && data.productName && data.price) {
                    const baseUrl = appConfig.whatsapp.orderApiBaseUrl;
                    if (!baseUrl) {
                        console.warn('ORDER_API_BASE_URL no configurado, se omite creación automática de pedidos desde WhatsApp');
                        return;
                    }

                    await axios.post(`${baseUrl}/orders`, {
                        customerName: data.customerName,
                        source: 'whatsapp',
                        items: [{ productName: data.productName, quantity: 1, price: data.price }],
                        dueDate: data.dueDate,
                        notes: "Generado por Bot Flexible 🤖"
                    });
                    await msg.react('✅');
                }
            }
        }

    } catch (error) {
        console.error("Error guardando mensaje de WhatsApp:", error);
    }
});

client.initialize();

// --- FUNCIONES EXPORTADAS ---

// 1. Para chatear desde el Social Hub
export const sendWhatsAppMessage = async (to: string, message: string) => {
    if (!isReady) throw new Error("WhatsApp no conectado");
    const chatId = to.includes('@') ? to : `${to}@c.us`;
    await client.sendMessage(chatId, message);
    return true;
};

// 2. ALERTA DINÁMICA (Lee el número de la Base de Datos)
export const sendAdminNotification = async (message: string) => {
    if (!isReady) {
        console.warn("⚠️ WhatsApp no está listo para enviar alerta.");
        return false;
    }
    try {
        // A. BUSCAR EL NÚMERO EN LA BASE DE DATOS
        const settings = await Settings.findOne({ tenantId: appConfig.defaultTenantId });
        
        if (!settings || !settings.adminPhone) {
            console.error("❌ ERROR: No hay número de Admin configurado en Ajustes.");
            return false;
        }

        // B. FORMATEAR NÚMERO
        let targetNumber = settings.adminPhone.trim();
        if (!targetNumber.includes('@c.us')) {
            targetNumber = `${targetNumber}@c.us`;
        }

        // C. ENVIAR
        await client.sendMessage(targetNumber, message);
        console.log(`✅ Alerta enviada al Admin: ${targetNumber}`);
        return true;

    } catch (error) {
        console.error("Error enviando alerta admin:", error);
        return false;
    }
};

// 3. NOTIFICACIÓN AL CLIENTE
export const sendCustomerNotification = async (phone: string, message: string) => {
    if (!isReady) {
        console.warn("⚠️ WhatsApp no está listo para enviar al cliente.");
        return false;
    }

    try {
        const normalized = phone.replace(/[^\d]/g, '');
        if (!normalized) return false;

        const target = normalized.includes('@c.us') ? normalized : `${normalized}@c.us`;
        await client.sendMessage(target, message);
        return true;
    } catch (error) {
        console.error('Error enviando notificación al cliente:', error);
        return false;
    }
};

// 4. OBTENER ESTADO DE CONEXIÓN
export const getWhatsAppStatus = () => {
    return {
        isReady,
        hasQr: !!currentQr
    };
};

// 5. RECONECTAR (Logout y Reiniciar)
export const reconnectWhatsApp = async () => {
    try {
        await client.destroy();
        isReady = false;
        currentQr = '';
        client.initialize();
        return true;
    } catch (error) {
        console.error('Error al reconectar WhatsApp:', error);
        return false;
    }
};
