import axios from 'axios';
import { EventEmitter } from 'events';
import Chat from '../chat/chat.model';
import Settings from '../settings/settings.model';
import { appConfig } from '../../config';

export const whatsappEvents = new EventEmitter();

let isReady = false;
let currentQr = '';

console.warn('⚠️ WhatsApp deshabilitado (Chrome no instalado)');

export const getWhatsAppStatus = () => ({
    isReady,
    hasQr: !!currentQr,
    qr: currentQr
});

export const sendWhatsAppMessage = async (_to: string, _message: string) => {
    throw new Error("WhatsApp no disponible - Chrome no instalado");
};

export const initializeWhatsApp = async () => {
    throw new Error("WhatsApp no disponible - Chrome no instalado");
};

export const disconnectWhatsApp = async () => {
    console.log("WhatsApp desconectado");
    isReady = false;
};

export const sendWhatsAppAlert = async (message: string) => {
    console.log("Alerta WhatsApp:", message);
};