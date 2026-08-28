import Product from '../src/modules/products/product.model';
import Sale from '../src/modules/sales/sale.model';
import Order from '../src/modules/orders/order.model';
import { OrderService } from '../src/modules/orders/order.service';

const TENANT = 'test_hq';

const makeProduct = (over: Partial<Record<string, unknown>> = {}) =>
  Product.create({
    name: 'Vaso River',
    category: 'Vasos',
    price: 3500,
    cost: 900,
    stock: 10,
    tenantId: TENANT,
    ...over,
  });

describe('Flujo pedido → venta', () => {
  it('crear un pedido descuenta el stock del producto', async () => {
    const p: any = await makeProduct({ stock: 10 });

    await OrderService.createOrder({
      tenantId: TENANT,
      clientName: 'Joaco',
      items: [{ productId: String(p._id), productName: p.name, quantity: 3, price: p.price }],
    });

    const fresh = await Product.findById(p._id);
    expect((fresh as any).stock).toBe(7);
  });

  it('rechaza el pedido si no hay stock suficiente', async () => {
    const p: any = await makeProduct({ stock: 2 });

    await expect(
      OrderService.createOrder({
        tenantId: TENANT,
        clientName: 'Joaco',
        items: [{ productId: String(p._id), productName: p.name, quantity: 5, price: p.price }],
      }),
    ).rejects.toThrow(/Stock insuficiente/);

    const fresh = await Product.findById(p._id);
    expect((fresh as any).stock).toBe(2); // no se tocó
  });

  it('registerOrderSale crea una venta ligada al pedido y lo marca', async () => {
    const p: any = await makeProduct({ stock: 10, cost: 1000 });
    const order: any = await OrderService.createOrder({
      tenantId: TENANT,
      clientName: 'Cliente',
      items: [{ productId: String(p._id), productName: p.name, quantity: 2, price: 5000 }],
    });

    const { sale } = await OrderService.registerOrderSale({
      tenantId: TENANT,
      orderId: String(order._id),
      finalCost: 2000,
    });

    expect(String((sale as any).orderId)).toBe(String(order._id));
    expect((sale as any).price).toBe(10000); // total del pedido (2 x 5000)
    expect((sale as any).profit).toBe(8000); // 10000 - 2000

    const updated = await Order.findById(order._id);
    expect((updated as any).isSaleRegistered).toBe(true);

    // No hay doble conteo: 1 venta, y el pedido queda excluido de los reportes
    const sales = await Sale.find({ tenantId: TENANT });
    expect(sales).toHaveLength(1);
  });

  it('no permite registrar la venta dos veces', async () => {
    const p: any = await makeProduct();
    const order: any = await OrderService.createOrder({
      tenantId: TENANT,
      clientName: 'Cliente',
      items: [{ productId: String(p._id), productName: p.name, quantity: 1, price: 3500 }],
    });

    await OrderService.registerOrderSale({ tenantId: TENANT, orderId: String(order._id) });
    await expect(
      OrderService.registerOrderSale({ tenantId: TENANT, orderId: String(order._id) }),
    ).rejects.toThrow(/ya registrada/i);
  });
});
