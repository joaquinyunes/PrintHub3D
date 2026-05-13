import { Request, Response } from 'express';
import { OrderRepository } from '../../repositories/order.repository';
import { ProductRepository } from '../../repositories/product.repository';
import Sale from '../sales/sale.model';
import { sendAdminNotification, sendCustomerNotification } from '../notifications/notification.service';
import { OrderService } from './order.service';
import { appConfig } from '../../config';
import Settings from '../settings/settings.model';
import { findCustomVideoUrl } from '../../utils/customCodeVideoMatch';

const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();

const statusSteps = ['pending', 'in_progress', 'completed', 'delivered'];

const statusCopy: Record<string, string> = {
    pending: 'Pendiente de producción',
    in_progress: 'En producción',
    completed: 'Listo para retiro/entrega',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
};

const fillTemplate = (template: string, vars: Record<string, string>) => {
    let output = template;
    Object.entries(vars).forEach(([key, value]) => {
        output = output.split(`{${key}}`).join(value);
    });
    return output;
};

const buildTrackingUrl = (baseUrl: string, trackingCode: string) => {
    const cleaned = (baseUrl || 'http://localhost:3000/track').replace(/\/$/, '');
    return `${cleaned}?code=${trackingCode}`;
};

// ==========================================
// 1. OBTENER PEDIDOS (PAGINADO + FILTROS)
// ==========================================
export const getOrders = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const {
            page = '1',
            pageSize = '50',
            sort = '-createdAt',
            status,
            from,
            to,
        } = req.query as Record<string, string | undefined>;

        const result = await orderRepository.findWithPaginationByTenant(tenantId, {
            page: parseInt(page || '1', 10),
            pageSize: parseInt(pageSize || '50', 10),
            sort,
            status,
            from,
            to
        });

        res.json({
            items: result.items,
            total: result.total,
            page: parseInt(page || '1', 10),
            pageSize: parseInt(pageSize || '50', 10),
        });
    } catch (error) {
        console.error("Error getOrders:", error);
        res.status(500).json({ message: 'Error al obtener pedidos' });
    }
};

// ==========================================
// 2. CREAR PEDIDO (CON FECHA)
// ==========================================
export const createOrder = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        if (!tenantId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const { 
            clientName, origin, paymentMethod, deposit, 
            notes, items, dueDate, files, customerContact 
        } = req.body;

        console.log("Recibiendo pedido:", { clientName, dueDate, itemsLength: items?.length });

        const savedOrder = await OrderService.createOrder({
            tenantId,
            clientName,
            origin,
            paymentMethod,
            deposit,
            notes,
            items,
            dueDate,
            files,
            customerContact,
        });

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("CRITICAL ERROR createOrder:", error);
        res.status(500).json({ message: 'Error interno al crear el pedido. Revisa la consola del servidor.' });
    }
};

// ==========================================
// 2B. CREAR PEDIDO PÚBLICO (Desde storefront)
// ==========================================
export const createPublicOrder = async (req: Request, res: Response) => {
    try {
        const defaultTenantId = 'global3d_hq';
        
        const { 
            clientName, 
            customerContact,
            items, 
            notes 
        } = req.body;

        if (!clientName || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Datos inválidos' });
        }

        // Calculate total
        let total = 0;
        items.forEach((i: any) => {
            total += Number(i.price || 0) * Number(i.quantity || 1);
        });

        const savedOrder = await OrderService.createOrder({
            tenantId: defaultTenantId,
            clientName,
            origin: 'Web',
            paymentMethod: 'WhatsApp',
            deposit: 0,
            notes: notes || '',
            items,
            dueDate: null,
            files: [],
            customerContact: customerContact || '',
        });

        // Return order with WhatsApp link
        const order = savedOrder as any;
        const phone = '5493794000000';
        const waText = encodeURIComponent(`Hola! Acabo de hacer un pedido desde la web.\n\nCódigo: ${order.trackingCode}\nTotal: $${total}\n\nProductos:\n${items.map((i: any) => `- ${i.productName} x${i.quantity}`).join('\n')}`);
        
        res.status(201).json({
            ...order,
            whatsappUrl: `https://wa.me/${phone}?text=${waText}`,
            total
        });
    } catch (error) {
        console.error("CRITICAL ERROR createPublicOrder:", error);
        res.status(500).json({ message: 'Error al crear pedido' });
    }
};

// ==========================================
// 3. EDITAR PEDIDO
// ==========================================
export const updateOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const { items } = req.body;
        
        let updateData = { ...req.body };

        // Recalcular total si cambian los items
        if (items && Array.isArray(items)) {
            let newTotal = 0;
            items.forEach((i: any) => newTotal += Number(i.price || 0) * Number(i.quantity || 0));
            updateData.total = newTotal;
        }

        const updatedOrder = await orderRepository.update(id, updateData as any, tenantId);

        if (!updatedOrder) return res.status(404).json({ message: "Pedido no encontrado" });
        res.json(updatedOrder);
    } catch (error) {
        console.error("Error updateOrder:", error);
        res.status(500).json({ message: "Error al editar pedido" });
    }
};

// ==========================================
// 4. CAMBIAR ESTADO
// ==========================================
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const { status, printTimeMinutes, printerId } = req.body;
        if (!status || !Object.keys(statusCopy).includes(String(status))) {
            return res.status(400).json({ message: 'Estado inválido' });
        }

        const existingOrder = await orderRepository.findById(req.params.id, tenantId);
        if (!existingOrder) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const updateData: any = { status };

        try {
            const Printer = require('../printers/printer.model').default;
            if (Printer) {
                if (status === 'in_progress' && printerId) {
                    updateData.startedAt = new Date();
                    if (printTimeMinutes) updateData.printTimeMinutes = printTimeMinutes;
                    await Printer.findByIdAndUpdate(printerId, { status: 'printing', currentOrderId: req.params.id });
                }

                if ((status === 'completed' || status === 'terminado')) {
                    updateData.finishedAt = new Date();
                    await Printer.updateMany({ currentOrderId: req.params.id }, { status: 'idle', $unset: { currentOrderId: "" } });

                    const currentOrder = await orderRepository.findById(req.params.id, tenantId);
                    if (currentOrder && !(currentOrder as any).adminNotified) {
                        const itemNames = (currentOrder as any).items.map((i: any) => i.productName).join(', ');
                        const msg = `✅ *IMPRESIÓN FINALIZADA*\n👤 ${currentOrder.clientName}\n📦 ${itemNames}\n🚀 Máquina liberada.`;
                        if(typeof sendAdminNotification === 'function') await sendAdminNotification(msg);
                        updateData.adminNotified = true;
                    }
                }
            }
        } catch (printerError) {
            console.error("Printer/Notification Warning:", printerError);
        }

        const order = await orderRepository.update(req.params.id, updateData, tenantId);

        if (order?.customerContact && typeof sendCustomerNotification === 'function') {
            const Settings = require('../settings/settings.model').default;
            const settings = await Settings.findOne({ tenantId: order.tenantId || appConfig.defaultTenantId });
            const statusText = statusCopy[status] || status;
            const trackingCode = (order as any).trackingCode || 'sin código';
            const trackingUrl = buildTrackingUrl(settings?.trackingBaseUrl || 'http://localhost:3000/track', trackingCode);
            const templateKey = (status in statusCopy ? status : 'pending') as 'pending' | 'in_progress' | 'completed' | 'delivered' | 'cancelled';
            const template = settings?.customerMessageTemplates?.[templateKey]
                || 'Hola {clientName} 👋 Tu pedido {trackingCode} cambió a {status}. Sigue tu pedido en {trackingUrl}';

            const message = fillTemplate(template, {
                clientName: order.clientName,
                trackingCode,
                status: statusText,
                trackingUrl,
                businessName: settings?.businessName || 'Global 3D',
            });

            await sendCustomerNotification((order as any).customerContact, message);
        }

        res.json(order);
    } catch (error) {
        console.error("Error updateOrderStatus:", error);
        res.status(500).json({ message: 'Error actualizando estado' });
    }
};

// ==========================================
// 5. MARCAR ÍTEM COMO IMPRESO (PARCIAL)
// ==========================================
export const markOrderItemPrinted = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const { id } = req.params;
        const { itemIndex } = req.body as { itemIndex: number };

        if (!tenantId) {
            return res.status(401).json({ message: 'No autorizado' });
        }
        if (itemIndex === undefined || itemIndex === null || Number.isNaN(Number(itemIndex))) {
            return res.status(400).json({ message: 'itemIndex requerido' });
        }

        const order = await orderRepository.findById(id, tenantId);
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const index = Number(itemIndex);
        if (!(order as any).items[index]) {
            return res.status(400).json({ message: 'Ítem inválido' });
        }

        const item: any = (order as any).items[index];
        const qty = Number(item.quantity || 0);
        const alreadyPrinted = Number(item.printedQuantity || 0);

        if (qty <= 0) {
            return res.status(400).json({ message: 'Cantidad inválida en el ítem' });
        }

        // 1️⃣ Marcamos este ítem como completamente impreso
        item.printedQuantity = Math.max(alreadyPrinted, qty);

        // 2️⃣ ¡CLAVE! Liberamos la impresora SIEMPRE que se termina una pieza
        try {
            const Printer = require('../printers/printer.model').default;
            if (Printer) {
                await Printer.updateMany(
                    { currentOrderId: id }, 
                    { status: 'idle', $unset: { currentOrderId: 1 } }
                );
            }
        } catch (printerError) {
            console.error("Printer Warning:", printerError);
        }

        // 3️⃣ Recalcular estado global del pedido según items impresos
        const totalItems = (order as any).items.length;
        let printedItems = 0;

        (order as any).items.forEach((it: any) => {
            const q = Number(it.quantity || 0);
            const printed = Number(it.printedQuantity || 0);
            if (q > 0 && printed >= q) printedItems += 1;
        });

        if (printedItems === totalItems && totalItems > 0) {
            // Si ya no falta nada, el pedido se completa
            (order as any).status = 'completed';
            (order as any).finishedAt = new Date();
        } else {
            // Si faltan piezas, VUELVE A LA COLA y reseteamos el tiempo
            (order as any).status = 'pending';
            (order as any).startedAt = undefined;
            (order as any).printTimeMinutes = undefined;
        }

        await (order as any).save();

        return res.json(order);
    } catch (error) {
        console.error('Error markOrderItemPrinted:', error);
        return res.status(500).json({ message: 'Error marcando ítem impreso' });
    }
};

// ==========================================
// 6. REGISTRAR VENTA (ENTREGAR)
// ==========================================
export const registerOrderSale = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const { id } = req.params;
        const { finalCost } = req.body;

        if (!tenantId) {
            return res.status(401).json({ message: "No autorizado" });
        }

        try {
            const { sale, order } = await OrderService.registerOrderSale({
                tenantId,
                orderId: id,
                finalCost,
            });

            return res.json({ message: "Venta registrada con costos reales", sale, order });
        } catch (serviceError: any) {
            if (serviceError.message === 'Pedido no encontrado') {
                return res.status(404).json({ message: serviceError.message });
            }
            if (serviceError.message === 'Venta ya registrada') {
                return res.status(400).json({ message: serviceError.message });
            }
            throw serviceError;
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al registrar venta del pedido" });
    }
};

// ==========================================
// 7. TRACKING PÚBLICO POR CÓDIGO
// ==========================================
export const getOrderByTrackingCode = async (req: Request, res: Response) => {
    try {
        const { trackingCode } = req.params;
        const order = await orderRepository.findByTrackingCode(String(trackingCode));

        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const currentStep = Math.max(statusSteps.indexOf((order as any).status), 0);
        const progress = Math.round((currentStep / (statusSteps.length - 1)) * 100);

        const statusLabel = statusCopy[(order as any).status] || (order as any).status;
        const steps = statusSteps.map((s, i) => ({
            key: s,
            label: statusCopy[s] || s,
            isComplete: i < currentStep,
            isCurrent: i === currentStep,
            media: null
        }));

        let customVideoUrl: string | null = null;
        try {
            const tenantId = (order as any).tenantId || appConfig.defaultTenantId;
            const settings = await Settings.findOne({ tenantId }).lean();
            const raw = (settings as any)?.homepageSections?.customCodes;
            const customCodes = Array.isArray(raw) ? raw : [];
            customVideoUrl = findCustomVideoUrl(String(trackingCode), customCodes);
        } catch (lookupErr) {
            console.error('getOrderByTrackingCode customVideo lookup:', lookupErr);
        }

        return res.json({
            trackingCode: (order as any).trackingCode,
            clientName: order.clientName,
            status: (order as any).status,
            statusLabel,
            progress,
            dueDate: (order as any).dueDate,
            createdAt: order.createdAt,
            notes: (order as any).notes,
            items: (order as any).items,
            total: (order as any).total,
            paymentMethod: (order as any).paymentMethod,
            deposit: (order as any).deposit,
            customerSatisfaction: (order as any).customerSatisfaction,
            customerFeedback: (order as any).customerFeedback,
            media: { message: 'Tu pedido está en producción' },
            statusSteps: steps,
            customVideoUrl,
        });
    } catch (error) {
        console.error('Error getOrderByTrackingCode:', error);
        return res.status(500).json({ message: 'Error consultando tracking' });
    }
};

// ==========================================
// 8. FEEDBACK DEL CLIENTE
// ==========================================
export const submitOrderFeedback = async (req: Request, res: Response) => {
    try {
        const { trackingCode } = req.params;
        const { rating, feedback } = req.body;

        const parsedRating = Number(rating);
        if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ message: 'La calificación debe estar entre 1 y 5' });
        }

        const order = await orderRepository.findByTrackingCode(String(trackingCode));
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        if ((order as any).status !== 'delivered') {
            return res.status(400).json({ message: 'Solo puedes valorar pedidos entregados' });
        }

        (order as any).customerSatisfaction = parsedRating;
        (order as any).customerFeedback = String(feedback || '').trim();
        await (order as any).save();

        return res.json({ message: 'Gracias por tu opinión', order });
    } catch (error) {
        console.error('Error submitOrderFeedback:', error);
        return res.status(500).json({ message: 'Error guardando feedback' });
    }
};

// ==========================================
// 9. REENVIAR TRACKING AL CLIENTE
// ==========================================
export const resendTrackingToCustomer = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const { id } = req.params;

        const order = await orderRepository.findById(id, tenantId);
        if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

        if (!(order as any).customerContact) {
            return res.status(400).json({ message: 'Este pedido no tiene contacto del cliente' });
        }

        const Settings = require('../settings/settings.model').default;
        const settings = await Settings.findOne({ tenantId: tenantId || appConfig.defaultTenantId });
        const trackingUrl = buildTrackingUrl(settings?.trackingBaseUrl || 'http://localhost:3000/track', (order as any).trackingCode);
        const template = settings?.customerMessageTemplates?.resendTracking
            || 'Hola {clientName} 👋 Aquí tienes nuevamente tu código de seguimiento: {trackingCode}. Consulta tu pedido en {trackingUrl}';

        const msg = fillTemplate(template, {
            clientName: order.clientName,
            trackingCode: (order as any).trackingCode,
            status: statusCopy[(order as any).status] || (order as any).status,
            trackingUrl,
            businessName: settings?.businessName || 'Global 3D',
        });
        const sent = await sendCustomerNotification((order as any).customerContact, msg);

        if (!sent) {
            return res.status(500).json({ message: 'No se pudo enviar el mensaje de seguimiento' });
        }

        return res.json({ message: 'Tracking reenviado al cliente' });
    } catch (error) {
        console.error('Error resendTrackingToCustomer:', error);
        return res.status(500).json({ message: 'Error reenviando tracking' });
    }
};

// ==========================================
// 10. RESUMEN DE PEDIDOS
// ==========================================
export const getOrdersSummary = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const summary = await orderRepository.getOrdersSummary(tenantId);
        return res.json(summary);
    } catch (error) {
        console.error('Error getOrdersSummary:', error);
        return res.status(500).json({ message: 'Error obteniendo resumen de pedidos' });
    }
};

// ==========================================
// 11. TIMELINE DE PEDIDOS
// ==========================================
export const getOrderTimeline = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const { id } = req.params;

        const order = await orderRepository.findById(id, tenantId);
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const timeline = [
            { key: 'created', label: 'Pedido creado', date: order.createdAt },
            { key: 'started', label: 'Producción iniciada', date: (order as any).startedAt || null },
            { key: 'finished', label: 'Producción finalizada', date: (order as any).finishedAt || null },
            { key: 'delivered', label: 'Pedido entregado', date: (order as any).status === 'delivered' ? (order as any).updatedAt : null },
        ];

        return res.json({
            orderId: (order as any)._id,
            trackingCode: (order as any).trackingCode,
            status: (order as any).status,
            dueDate: (order as any).dueDate || null,
            timeline,
        });
    } catch (error) {
        console.error('Error getOrderTimeline:', error);
        return res.status(500).json({ message: 'Error obteniendo timeline del pedido' });
    }
};

// ==========================================
// 12. UTILIDAD: FIX DATA
// ==========================================
export const fixOrdersData = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const Order = require('./order.model').default;
        await Order.collection.updateMany({ tenantId }, { $rename: { "customerName": "clientName" } });
        res.json({ message: "✅ ¡Base de datos reparada!" });
    } catch (error) {
        res.status(500).json({ message: "Error reparando datos" });
    }
};
