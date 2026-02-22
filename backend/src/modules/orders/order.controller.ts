import { Request, Response } from 'express';
import Order from './order.model';
import Product from '../products/product.model';
import Sale from '../sales/sale.model';

// Intentamos importar estos módulos opcionales. Si fallan, no rompemos el servidor.
// Asegúrate de que las rutas sean correctas según tu estructura de carpetas.
import Client from '../clients/client.model'; 
import Printer from '../printers/printer.model';
import Settings from '../settings/settings.model';
import { sendAdminNotification, sendCustomerNotification } from '../notifications/whatsapp.service';

const buildTrackingCode = () => {
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    const stamp = Date.now().toString(36).slice(-4).toUpperCase();
    return `PH-${stamp}${random}`;
};

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
// 1. OBTENER PEDIDOS
// ==========================================
export const getOrders = async (req: Request, res: Response) => {
    try {
        const tenantId = (req as any).user?.tenantId;
        const orders = await Order.find({ tenantId }).sort({ createdAt: -1 });
        res.json(orders);
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
        const tenantId = (req as any).user?.tenantId;
        
        // 1. Desestructurar datos (INCLUIDO dueDate)
        const { 
            clientName, origin, paymentMethod, deposit, 
            notes, items, dueDate, files, customerContact 
        } = req.body;

        console.log("Recibiendo pedido:", { clientName, dueDate, itemsLength: items?.length });

        // 2. Calcular Totales y Costos
        let calculatedTotal = 0;
        let calculatedCost = 0;

        const enrichedItems = await Promise.all(items.map(async (item: any) => {
            let productCost = 0;
            if (item.productId && !item.isCustom) {
                try {
                    const product = await Product.findOne({ _id: item.productId, tenantId });
                    if (product) productCost = product.cost ?? 0;
                } catch (err) { console.error("Error buscando producto:", err); }
            }
            
            const subtotal = Number(item.price) * Number(item.quantity);
            const subcost = productCost * Number(item.quantity);
            
            calculatedTotal += subtotal;
            calculatedCost += subcost;
            
            return item;
        }));

        const profit = calculatedTotal - calculatedCost;

        // 3. Crear el Objeto Pedido
        const trackingCode = buildTrackingCode();

        const newOrder = new Order({
            clientName, 
            origin: origin || "Local", 
            paymentMethod: paymentMethod || "Efectivo",
            deposit: Number(deposit) || 0, 
            notes, 
            trackingCode,
            customerContact: customerContact || "",
            items: enrichedItems,
            total: calculatedTotal, 
            
            // 👇 AQUÍ SE GUARDA LA FECHA
            dueDate: dueDate ? new Date(dueDate) : null,
            files: files || [],
            
            // Datos internos
            profit, 
            status: 'pending', 
            tenantId
        });

        // 4. Guardar
        const savedOrder = await newOrder.save();

        // 5. Actualizar CRM (Opcional - No bloqueante)
        try {
            if(Client) {
                let client = await Client.findOne({ name: clientName, tenantId });
                if (client) {
                    client.totalSpent += calculatedTotal;
                    client.orderCount += 1;
                    client.lastOrderDate = new Date();
                    await client.save();
                } else {
                    await Client.create({
                        name: clientName, source: origin || "Local", totalSpent: calculatedTotal,
                        orderCount: 1, lastOrderDate: new Date(), tenantId
                    });
                }
            }
        } catch (crmError) {
            console.error("CRM Warning: No se pudo actualizar el cliente, pero el pedido se guardó.", crmError);
        }

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
        const tenantId = (req as any).user?.tenantId;
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
        const tenantId = (req as any).user?.tenantId;
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
            const settings = await Settings.findOne({ tenantId: order.tenantId || 'global3d_hq' });
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
    const tenantId = (req as any).user?.tenantId;
    const { id } = req.params;
    const { finalCost } = req.body;

    const order = await Order.findOne({ _id: id, tenantId });
    if (!order) return res.status(404).json({ message: "Pedido no encontrado" });
    if (order.isSaleRegistered) return res.status(400).json({ message: "Venta ya registrada" });

    let totalCost = 0;
    if (finalCost !== undefined && finalCost !== null && finalCost !== "") {
        totalCost = Number(finalCost);
    }

    const totalStats = {
        price: order.total,
        cost: totalCost,
        profit: order.total - totalCost 
    };

    const newSale = new Sale({
      productName: `Pedido: ${order.clientName}`,
      productId: order._id,
      quantity: 1, 
      price: totalStats.price,
      cost: totalStats.cost,
      profit: totalStats.profit,
      category: "Servicio", 
      tenantId,
      createdAt: new Date()
    });

    await newSale.save();

    order.status = 'delivered';
    order.isSaleRegistered = true;
    await order.save();

    return res.json({ message: "Venta registrada con costos reales", sale: newSale, order });

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
        const tenantId = (req as any).user?.tenantId;
        const { id } = req.params;

        const order = await Order.findOne({ _id: id, tenantId });
        if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

        if (!order.customerContact) {
            return res.status(400).json({ message: 'Este pedido no tiene contacto del cliente' });
        }

        const settings = await Settings.findOne({ tenantId: tenantId || 'global3d_hq' });
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
        const tenantId = (req as any).user?.tenantId;
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
        const tenantId = (req as any).user?.tenantId;
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
        const tenantId = (req as any).user?.tenantId;
        await Order.collection.updateMany({ tenantId }, { $rename: { "customerName": "clientName" } });
        res.json({ message: "✅ ¡Base de datos reparada!" });
    } catch (error) {
        res.status(500).json({ message: "Error reparando datos" });
    }
};
