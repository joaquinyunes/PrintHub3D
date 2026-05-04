import { Router, Request, Response } from 'express';
import { protect, adminOnly } from '../auth/auth.middleware';
import {
    getWhatsAppStatus,
    reconnectWhatsApp,
    whatsappEvents
} from './whatsapp.service';

const router = Router();

// GET /api/whatsapp/status - Obtener estado de conexión
router.get('/status', protect, adminOnly, async (req: Request, res: Response) => {
    try {
        const status = getWhatsAppStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estado' });
    }
});

// GET /api/whatsapp/qr - Stream de QR con SSE
router.get('/qr', protect, adminOnly, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const status = getWhatsAppStatus();
    if (status.isReady) {
        sendEvent('connected', { message: 'Ya conectado' });
    } else if (status.hasQr) {
        sendEvent('qr', { message: 'Escanea el QR' });
    } else {
        sendEvent('waiting', { message: 'Esperando QR...' });
    }

    const onQr = (qr: string) => {
        sendEvent('qr', { qr });
    };

    const onReady = () => {
        sendEvent('connected', { message: 'Conectado exitosamente' });
        res.end();
    };

    const onDisconnected = () => {
        sendEvent('disconnected', { message: 'Desconectado' });
    };

    whatsappEvents.on('qr', onQr);
    whatsappEvents.on('ready', onReady);
    whatsappEvents.on('disconnected', onDisconnected);

    req.on('close', () => {
        whatsappEvents.off('qr', onQr);
        whatsappEvents.off('ready', onReady);
        whatsappEvents.off('disconnected', onDisconnected);
    });
});

// POST /api/whatsapp/reconnect - Reconectar
router.post('/reconnect', protect, adminOnly, async (req: Request, res: Response) => {
    try {
        await reconnectWhatsApp();
        res.json({ success: true, message: 'Reconectando...' });
    } catch (error) {
        res.status(500).json({ error: 'Error al reconectar' });
    }
});

export default router;