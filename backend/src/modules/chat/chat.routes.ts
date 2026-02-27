import { Router } from 'express';
import Chat from './chat.model';
import { sendWhatsAppMessage } from '../notifications/whatsapp.service';
import { protect, adminOnly } from '../auth/auth.middleware';
import { withTenant } from '../../middleware/tenant.middleware';

const router = Router();

// 1. OBTENER BANDEJA DE ENTRADA (Agrupada por clientes) con paginación
router.get('/', protect, withTenant, adminOnly, async (req, res) => {
    try {
        const tenantId = (req as any).tenantId;
        const {
            page = '1',
            pageSize = '50',
        } = req.query as Record<string, string | undefined>;

        const pageNumber = Math.max(parseInt(page || '1', 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(pageSize || '50', 10) || 50, 1), 200);
        const skip = (pageNumber - 1) * limit;

        const basePipeline: any[] = [
            { $match: { tenantId } },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: "$from", // Agrupar por el ID del cliente
                    lastMessage: { $first: "$body" },
                    senderName: { $first: "$senderName" },
                    platform: { $first: "$platform" }, // Para saber si es IG, FB o WPP
                    timestamp: { $first: "$timestamp" }
                }
            },
            { $sort: { timestamp: -1 } } // Los más nuevos arriba
        ];

        const [items, totalAgg] = await Promise.all([
            Chat.aggregate([
                ...basePipeline,
                { $skip: skip },
                { $limit: limit },
            ]),
            Chat.aggregate([
                ...basePipeline,
                { $count: 'total' },
            ]),
        ]);

        const total = totalAgg[0]?.total || 0;

        res.json({
            items,
            total,
            page: pageNumber,
            pageSize: limit,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error cargando chats' });
    }
});

// 2. OBTENER CONVERSACIÓN COMPLETA (PAGINADA)
router.get('/:id', protect, withTenant, adminOnly, async (req, res) => {
    try {
        const {
            page = '1',
            pageSize = '100',
        } = req.query as Record<string, string | undefined>;

        const pageNumber = Math.max(parseInt(page || '1', 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(pageSize || '100', 10) || 100, 1), 500);
        const skip = (pageNumber - 1) * limit;

        // Traer mensajes donde el usuario sea el remitente O el destinatario
        const tenantId = (req as any).tenantId;

        const filter = { 
            tenantId,
            $or: [{ from: req.params.id }, { to: req.params.id }]
        };

        const [items, total] = await Promise.all([
            Chat.find(filter)
                .sort({ timestamp: 1 })
                .skip(skip)
                .limit(limit),
            Chat.countDocuments(filter),
        ]);

        res.json({
            items,
            total,
            page: pageNumber,
            pageSize: limit,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error cargando mensajes' });
    }
});

// 3. ENVIAR MENSAJE (TÚ respondes desde la web)
router.post('/send', protect, withTenant, adminOnly, async (req, res) => {
    try {
        const { to, message, platform } = req.body;
        const tenantId = (req as any).tenantId;

        // A. Enviar a la red correspondiente
        if (platform === 'whatsapp') {
            await sendWhatsAppMessage(to, message);
        } else if (platform === 'instagram') {
            // AQUÍ PONDREMOS LA LÓGICA DE INSTAGRAM LUEGO
            console.log("⚠️ Pendiente: Conectar API Instagram");
        } else if (platform === 'facebook') {
            // AQUÍ PONDREMOS LA LÓGICA DE FACEBOOK LUEGO
            console.log("⚠️ Pendiente: Conectar API Facebook");
        }

        // B. Guardar en Base de Datos (para que aparezca en tu chat)
        const newMsg = await Chat.create({
            from: 'me', // O tu número
            to: to,
            body: message,
            platform: platform,
            senderName: 'Yo',
            isMine: true,
            tenantId
        });

        res.json(newMsg);

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Error enviando mensaje', error: error.message });
    }
});

export default router;