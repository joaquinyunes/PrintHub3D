import { Router } from 'express';
import Chat from './chat.model';
import { sendWhatsAppMessage } from '../notifications/whatsapp.service';

const router = Router();

// 1. OBTENER BANDEJA DE ENTRADA (Agrupada por clientes)
router.get('/', async (req, res) => {
    try {
        // Agrupación compleja de MongoDB para obtener el último mensaje de cada uno
        const chats = await Chat.aggregate([
            { $sort: { timestamp: -1 } },
            { $group: {
                _id: "$from", // Agrupar por el ID del cliente
                lastMessage: { $first: "$body" },
                senderName: { $first: "$senderName" },
                platform: { $first: "$platform" }, // Para saber si es IG, FB o WPP
                timestamp: { $first: "$timestamp" }
            }},
            { $sort: { timestamp: -1 } } // Los más nuevos arriba
        ]);
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Error cargando chats' });
    }
});

// 2. OBTENER CONVERSACIÓN COMPLETA
router.get('/:id', async (req, res) => {
    try {
        // Traer mensajes donde el usuario sea el remitente O el destinatario
        const messages = await Chat.find({ 
            $or: [{ from: req.params.id }, { to: req.params.id }]
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error cargando mensajes' });
    }
});

// 3. ENVIAR MENSAJE (TÚ respondes desde la web)
router.post('/send', async (req, res) => {
    try {
        const { to, message, platform } = req.body;

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
            tenantId: 'global3d_hq'
        });

        res.json(newMsg);

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Error enviando mensaje', error: error.message });
    }
});

export default router;