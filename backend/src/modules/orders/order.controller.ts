import { Request, Response } from 'express';
import Order from './order.model';
import Product from '../products/product.model';
import Sale from '../sales/sale.model';

// Intentamos importar estos módulos opcionales. Si fallan, no rompemos el servidor.
// Asegúrate de que las rutas sean correctas según tu estructura de carpetas.
import Client from '../clients/client.model'; 
import Printer from '../printers/printer.model';
import { sendAdminNotification } from '../notifications/whatsapp.service';

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
            notes, items, dueDate, files 
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
        const newOrder = new Order({
            clientName, 
            origin: origin || "Local", 
            paymentMethod: paymentMethod || "Efectivo",
            deposit: Number(deposit) || 0, 
            notes, 
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
        const { status, printTimeMinutes, printerId } = req.body;
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

                    const currentOrder = await Order.findById(req.params.id);
                    if (currentOrder && !currentOrder.adminNotified) {
                        const itemNames = currentOrder.items.map(i => i.productName).join(', ');
                        const msg = `✅ *IMPRESIÓN FINALIZADA*\n👤 ${currentOrder.clientName}\n📦 ${itemNames}\n🚀 Máquina liberada.`;
                        if(typeof sendAdminNotification === 'function') await sendAdminNotification(msg);
                        updateData.adminNotified = true;
                    }
                }
            }
        } catch (printerError) {
            console.error("Printer/Notification Warning:", printerError);
        }
        
        const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
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

export const fixOrdersData = async (req: Request, res: Response) => {
    try {
        await Order.collection.updateMany({}, { $rename: { "customerName": "clientName" } });
        res.json({ message: "✅ ¡Base de datos reparada!" });
    } catch (error) {
        res.status(500).json({ message: "Error reparando datos" });
    }
};