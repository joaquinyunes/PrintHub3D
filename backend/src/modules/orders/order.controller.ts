import { Request, Response } from 'express';
import Order from './order.model';
import Product from '../products/product.model';
import Client from '../clients/client.model';
import Printer from '../printers/printer.model'; // 👈 IMPORTANTE
import { sendAdminNotification } from '../notifications/whatsapp.service';

// OBTENER PEDIDOS
export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find({ tenantId: 'global3d_hq' }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener pedidos' });
    }
};

// CREAR PEDIDO (CON FINANZAS)
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { customerName, source, items, notes, createdAt, dueDate } = req.body;
        const tenantId = 'global3d_hq';

        let calculatedTotal = 0;
        let calculatedCost = 0;

        const enrichedItems = await Promise.all(items.map(async (item: any) => {
            let productCost = 0;
            if (item.productId) {
                const product = await Product.findById(item.productId);
                if (product) productCost = product.cost;
            } 
            calculatedTotal += (item.price * item.quantity);
            calculatedCost += (productCost * item.quantity);
            return item;
        }));

        const profit = calculatedTotal - calculatedCost;

        const newOrder = new Order({
            customerName,
            source,
            items: enrichedItems,
            totalAmount: calculatedTotal,
            totalCost: calculatedCost,
            profit: profit,
            notes,
            status: 'pendiente',
            tenantId,
            dueDate: dueDate || null,
            createdAt: createdAt ? new Date(createdAt) : new Date()
        });

        await newOrder.save();

        let client = await Client.findOne({ name: customerName, tenantId });
        if (client) {
            client.totalSpent += calculatedTotal;
            client.orderCount += 1;
            client.lastOrderDate = new Date();
            await client.save();
        } else {
            await Client.create({
                name: customerName,
                source,
                totalSpent: calculatedTotal,
                orderCount: 1,
                lastOrderDate: new Date(),
                tenantId
            });
        }

        res.status(201).json(newOrder);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el pedido' });
    }
};

// --- GESTIÓN DE ESTADO Y MAQUINAS ---
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { status, printTimeMinutes, printerId } = req.body;
        const updateData: any = { status };

        // 1. INICIAR IMPRESIÓN -> OCUPAR MÁQUINA
        if (status === 'imprimiendo') {
            if (!printerId) return res.status(400).json({ message: 'Falta seleccionar impresora' });
            
            updateData.startedAt = new Date();
            if (printTimeMinutes) updateData.printTimeMinutes = printTimeMinutes;

            // Poner la impresora en modo "printing"
            await Printer.findByIdAndUpdate(printerId, {
                status: 'printing',
                currentOrderId: req.params.id
            });
        }
        
        // 2. TERMINAR IMPRESIÓN -> LIBERAR MÁQUINA
        if (status === 'terminado') {
            updateData.finishedAt = new Date();
            
            // Buscar la orden para saber datos y notificar
            const currentOrder = await Order.findById(req.params.id);
            
            // Liberar impresora que tenía esta orden
            await Printer.updateMany({ currentOrderId: req.params.id }, {
                status: 'idle',
                $unset: { currentOrderId: "" }
            });

            // Notificar WhatsApp
            if (currentOrder && !currentOrder.adminNotified) {
                const itemNames = currentOrder.items.map(i => i.productName).join(', ');
                const msg = `✅ *IMPRESIÓN FINALIZADA*\n👤 ${currentOrder.customerName}\n📦 ${itemNames}\n🚀 Máquina liberada y lista.`;
                await sendAdminNotification(msg);
                updateData.adminNotified = true;
            }
        }

        const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(order);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error actualizando estado' });
    }
};

export const approveOrder = async (req: Request, res: Response) => {};