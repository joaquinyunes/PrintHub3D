import { Request, Response } from 'express';
import Order from './order.model';
import Product from '../products/product.model';
import Sale from '../sales/sale.model';

// Intentamos importar estos módulos opcionales. Si fallan, no rompemos el servidor.
// Asegúrate de que las rutas sean correctas según tu estructura de carpetas.
import Client from '../clients/client.model'; 
import Printer from '../printers/printer.model';
import Settings from '../settings/settings.model';
import { sendAdminNotification, sendCustomerNotification } from '../notifications/notification.service';
import { OrderService } from './order.service';
import { appConfig } from '../../config';

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

        const pageNumber = Math.max(parseInt(page || '1', 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(pageSize || '50', 10) || 50, 1), 200);
        const skip = (pageNumber - 1) * limit;

        const query: any = { tenantId };

        if (status) {
            query.status = status;
        }

        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
        const sortDir = sort.startsWith('-') ? -1 : 1;
        const sortObj: any = { [sortField]: sortDir };

        const [items, total] = await Promise.all([
            Order.find(query).sort(sortObj).skip(skip).limit(limit),
            Order.countDocuments(query),
        ]);

        res.json({
            items,
            total,
            page: pageNumber,
            pageSize: limit,
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
            items.forEach((i: any) => newTotal += (i.price * i.quantity));
            updateData.total = newTotal;
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { _id: id, tenantId }, 
            updateData, 
            { new: true }
        );

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

        const existingOrder = await Order.findOne({ _id: req.params.id, tenantId });
        if (!existingOrder) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const updateData: any = { status };

        try {
            if (Printer) {
                if (status === 'in_progress' && printerId) {
                    updateData.startedAt = new Date();
                    if (printTimeMinutes) updateData.printTimeMinutes = printTimeMinutes;
                    await Printer.findByIdAndUpdate(printerId, { status: 'printing', currentOrderId: req.params.id });
                }

                if ((status === 'completed' || status === 'terminado')) {
                    updateData.finishedAt = new Date();
                    await Printer.updateMany({ currentOrderId: req.params.id }, { status: 'idle', $unset: { currentOrderId: "" } });

                    const currentOrder = await Order.findOne({ _id: req.params.id, tenantId });
                    if (currentOrder && !currentOrder.adminNotified) {
                        const itemNames = currentOrder.items.map(i => i.productName).join(', ');
                        const msg = `✅ *IMPRESIÓN FINALIZADA*
👤 ${currentOrder.clientName}
📦 ${itemNames}
🚀 Máquina liberada.`;
                        if(typeof sendAdminNotification === 'function') await sendAdminNotification(msg);
                        updateData.adminNotified = true;
                    }
                }
            }
        } catch (printerError) {
            console.error("Printer/Notification Warning:", printerError);
        }

        const order = await Order.findOneAndUpdate({ _id: req.params.id, tenantId }, updateData, { new: true });

        if (order?.customerContact && typeof sendCustomerNotification === 'function') {
            const settings = await Settings.findOne({ tenantId: order.tenantId || appConfig.defaultTenantId });
            const statusText = statusCopy[status] || status;
            const trackingCode = order.trackingCode || 'sin código';
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

            await sendCustomerNotification(order.customerContact, message);
        }

        res.json(order);
    } catch (error) {
        console.error("Error updateOrderStatus:", error);
        res.status(500).json({ message: 'Error actualizando estado' });
    }
};

// ==========================================
// 5. REGISTRAR VENTA (ENTREGAR - NOMBRE CORREGIDO)
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
// 6. TRACKING PÚBLICO POR CÓDIGO
// ==========================================
export const getOrderByTrackingCode = async (req: Request, res: Response) => {
    try {
        const { trackingCode } = req.params;
        const order = await Order.findOne({ trackingCode: String(trackingCode).toUpperCase() });

        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const currentStep = Math.max(statusSteps.indexOf(order.status), 0);
        const progress = Math.round((currentStep / (statusSteps.length - 1)) * 100);

        return res.json({
            trackingCode: order.trackingCode,
            clientName: order.clientName,
            status: order.status,
            progress,
            dueDate: order.dueDate,
            createdAt: order.createdAt,
            notes: order.notes,
            items: order.items,
            total: order.total,
            paymentMethod: order.paymentMethod,
            deposit: order.deposit,
            customerSatisfaction: order.customerSatisfaction,
            customerFeedback: order.customerFeedback,
        });
    } catch (error) {
        console.error('Error getOrderByTrackingCode:', error);
        return res.status(500).json({ message: 'Error consultando tracking' });
    }
};

// ==========================================
// 7. FEEDBACK DEL CLIENTE
// ==========================================
export const submitOrderFeedback = async (req: Request, res: Response) => {
    try {
        const { trackingCode } = req.params;
        const { rating, feedback } = req.body;

        const parsedRating = Number(rating);
        if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ message: 'La calificación debe estar entre 1 y 5' });
        }

        const order = await Order.findOne({ trackingCode: String(trackingCode).toUpperCase() });
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({ message: 'Solo puedes valorar pedidos entregados' });
        }

        order.customerSatisfaction = parsedRating;
        order.customerFeedback = String(feedback || '').trim();
        await order.save();

        return res.json({ message: 'Gracias por tu opinión', order });
    } catch (error) {
        console.error('Error submitOrderFeedback:', error);
        return res.status(500).json({ message: 'Error guardando feedback' });
    }
};



// ==========================================
// 8. REENVIAR TRACKING AL CLIENTE
// ==========================================
export const resendTrackingToCustomer = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const { id } = req.params;

        const order = await Order.findOne({ _id: id, tenantId });
        if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

        if (!order.customerContact) {
            return res.status(400).json({ message: 'Este pedido no tiene contacto del cliente' });
        }

        const settings = await Settings.findOne({ tenantId: tenantId || appConfig.defaultTenantId });
        const trackingUrl = buildTrackingUrl(settings?.trackingBaseUrl || 'http://localhost:3000/track', order.trackingCode);
        const template = settings?.customerMessageTemplates?.resendTracking
            || 'Hola {clientName} 👋 Aquí tienes nuevamente tu código de seguimiento: {trackingCode}. Consulta tu pedido en {trackingUrl}';

        const msg = fillTemplate(template, {
            clientName: order.clientName,
            trackingCode: order.trackingCode,
            status: statusCopy[order.status] || order.status,
            trackingUrl,
            businessName: settings?.businessName || 'Global 3D',
        });
        const sent = await sendCustomerNotification(order.customerContact, msg);

        if (!sent) {
            return res.status(500).json({ message: 'No se pudo enviar el mensaje de seguimiento' });
        }

        return res.json({ message: 'Tracking reenviado al cliente' });
    } catch (error) {
        console.error('Error resendTrackingToCustomer:', error);
        return res.status(500).json({ message: 'Error reenviando tracking' });
    }
};

export const getOrdersSummary = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const orders = await Order.find({ tenantId }).select('status total createdAt customerSatisfaction dueDate finishedAt');

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const summary = {
            totalOrders: orders.length,
            pending: 0,
            inProgress: 0,
            completed: 0,
            delivered: 0,
            cancelled: 0,
            monthlyRevenue: 0,
            averageSatisfaction: 0,
        };

        let ratingsCount = 0;
        let ratingsTotal = 0;

        orders.forEach((order: any) => {
            if (order.status === 'pending') summary.pending += 1;
            if (order.status === 'in_progress') summary.inProgress += 1;
            if (order.status === 'completed') summary.completed += 1;
            if (order.status === 'delivered') summary.delivered += 1;
            if (order.status === 'cancelled') summary.cancelled += 1;

            if (order.createdAt >= monthStart && order.status !== 'cancelled') {
                summary.monthlyRevenue += Number(order.total || 0);
            }

            if (Number.isFinite(Number(order.customerSatisfaction))) {
                ratingsCount += 1;
                ratingsTotal += Number(order.customerSatisfaction);
            }
        });

        summary.averageSatisfaction = ratingsCount ? Number((ratingsTotal / ratingsCount).toFixed(2)) : 0;

        return res.json(summary);
    } catch (error) {
        console.error('Error getOrdersSummary:', error);
        return res.status(500).json({ message: 'Error obteniendo resumen de pedidos' });
    }
};

export const getOrderTimeline = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        const { id } = req.params;

        const order = await Order.findOne({ _id: id, tenantId });
        if (!order) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const timeline = [
            { key: 'created', label: 'Pedido creado', date: order.createdAt },
            { key: 'started', label: 'Producción iniciada', date: order.startedAt || null },
            { key: 'finished', label: 'Producción finalizada', date: order.finishedAt || null },
            { key: 'delivered', label: 'Pedido entregado', date: order.status === 'delivered' ? order.updatedAt : null },
        ];

        return res.json({
            orderId: order._id,
            trackingCode: order.trackingCode,
            status: order.status,
            dueDate: order.dueDate || null,
            timeline,
        });
    } catch (error) {
        console.error('Error getOrderTimeline:', error);
        return res.status(500).json({ message: 'Error obteniendo timeline del pedido' });
    }
};

export const fixOrdersData = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
        await Order.collection.updateMany({ tenantId }, { $rename: { "customerName": "clientName" } });
        res.json({ message: "✅ ¡Base de datos reparada!" });
    } catch (error) {
        res.status(500).json({ message: "Error reparando datos" });
    }
};
