"use client";

// ─── Types ───
export interface Parte {
  id: number;
  nombre: string;
}

export interface ProductoCatalogo {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  partes: Parte[];
}

export interface PedidoItem {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precio: number;
}

export interface Pedido {
  id: number;
  cliente: string;
  telefono: string;
  descripcion: string;
  fechaEntrega: string;
  total: number;
  senia: number;
  saldo: number;
  canal: string;
  estado: string;
  items?: PedidoItem[];
  createdAt: string;
}

export interface Venta {
  id: number;
  fecha: string;
  producto: string;
  cantidad: number;
  cliente: string;
  formaPago: string;
  total: number;
  observaciones: string;
  pedidoId?: number;
  createdAt: string;
}

export interface Filamento {
  id: number;
  marca: string;
  tipo: string;
  color: string;
  stock: number;
  precio: number;
}

export interface Impresora {
  id: number;
  nombre: string;
  modelo: string;
  tipo: string;
  mejorPara: string;
  notas: string;
  activa: boolean;
}

export interface Gasto {
  id: number;
  categoria: string;
  concepto: string;
  monto: number;
  mes: string;
}

// ─── Storage helpers ───
const KEYS = {
  pedidos: "ph_pedidos",
  ventas: "ph_ventas",
  filamentos: "ph_filamentos",
  gastos: "ph_gastos",
  productos: "ph_productos",
  impresoras: "ph_impresoras",
} as const;

function get<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, data: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Next ID helper ───
function nextId(items: { id: number }[]): number {
  return items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}

// ─── Bulk import ───
export function importPedidos(items: Omit<Pedido, "id" | "createdAt">[]) {
  const existing = get<Pedido>(KEYS.pedidos, []);
  const now = new Date().toISOString().slice(0, 10);
  const newItems = items.map((p, i) => ({ ...p, id: nextId(existing) + i, createdAt: now } as Pedido));
  set(KEYS.pedidos, [...existing, ...newItems]);
}

export function importVentas(items: Omit<Venta, "id" | "createdAt">[]) {
  const existing = get<Venta>(KEYS.ventas, []);
  const now = new Date().toISOString().slice(0, 10);
  const newItems = items.map((v, i) => ({ ...v, id: nextId(existing) + i, createdAt: now } as Venta));
  set(KEYS.ventas, [...existing, ...newItems]);
}

export function importFilamentos(items: Omit<Filamento, "id">[]) {
  const existing = get<Filamento>(KEYS.filamentos, []);
  const maxId = existing.length > 0 ? Math.max(...existing.map((f) => f.id)) : 0;
  const newItems = items.map((f, i) => ({ ...f, id: maxId + i + 1 } as Filamento));
  set(KEYS.filamentos, [...existing, ...newItems]);
}

export function importGastos(items: Omit<Gasto, "id">[]) {
  const existing = get<Gasto>(KEYS.gastos, []);
  const maxId = existing.length > 0 ? Math.max(...existing.map((g) => g.id)) : 0;
  const newItems = items.map((g, i) => ({ ...g, id: maxId + i + 1 } as Gasto));
  set(KEYS.gastos, [...existing, ...newItems]);
}

// ─── Public API ───
export function getPedidos(): Pedido[] {
  return get<Pedido>(KEYS.pedidos, []);
}

export function savePedido(p: Pedido) {
  const items = getPedidos();
  const idx = items.findIndex((i) => i.id === p.id);
  if (idx >= 0) items[idx] = p;
  else items.push(p);
  set(KEYS.pedidos, items);
}

export function updatePedidoStatus(id: number, estado: string): Pedido | null {
  const items = getPedidos();
  const p = items.find((i) => i.id === id);
  if (!p) return null;
  p.estado = estado;
  set(KEYS.pedidos, items);

  if (estado === "Entregado") {
    addVentaFromPedido(p);
  }
  return p;
}

function addVentaFromPedido(pedido: Pedido) {
  const ventas = getVentas();
  const prodNames = (pedido.items || []).map((i) => i.productoNombre).join(", ");
  ventas.push({
    id: nextId(ventas),
    fecha: new Date().toISOString().slice(0, 10),
    producto: prodNames || "Pedido #" + pedido.id,
    cantidad: 1,
    cliente: pedido.cliente,
    formaPago: "Efectivo",
    total: pedido.total,
    observaciones: `Auto-generado del pedido #${pedido.id}`,
    pedidoId: pedido.id,
    createdAt: new Date().toISOString().slice(0, 10),
  });
  set(KEYS.ventas, ventas);
}

export function getVentas(): Venta[] {
  return get<Venta>(KEYS.ventas, []);
}

export function addVenta(v: Omit<Venta, "id" | "createdAt">) {
  const items = getVentas();
  items.push({ ...v, id: nextId(items), createdAt: new Date().toISOString().slice(0, 10) });
  set(KEYS.ventas, items);
}

export function getFilamentos(): Filamento[] {
  return get<Filamento>(KEYS.filamentos, []);
}

export function getGastos(): Gasto[] {
  return get<Gasto>(KEYS.gastos, []);
}

export function addGasto(g: Omit<Gasto, "id">) {
  const items = getGastos();
  items.push({ ...g, id: nextId(items) });
  set(KEYS.gastos, items);
}

// ─── ProductoCatalogo CRUD ───
export function getProductos(): ProductoCatalogo[] {
  return get<ProductoCatalogo>(KEYS.productos, []);
}

export function saveProducto(p: ProductoCatalogo) {
  const items = getProductos();
  const idx = items.findIndex((i) => i.id === p.id);
  if (idx >= 0) items[idx] = p;
  else items.push(p);
  set(KEYS.productos, items);
}

export function deleteProducto(id: number) {
  set(KEYS.productos, getProductos().filter((p) => p.id !== id));
}

export function getNextProductoId(): number {
  return nextId(getProductos());
}

// ─── Impresora CRUD ───
export function getImpresoras(): Impresora[] {
  return get<Impresora>(KEYS.impresoras, []);
}

export function saveImpresora(p: Impresora) {
  const items = getImpresoras();
  const idx = items.findIndex((i) => i.id === p.id);
  if (idx >= 0) items[idx] = p;
  else items.push(p);
  set(KEYS.impresoras, items);
}

export function deleteImpresora(id: number) {
  set(KEYS.impresoras, getImpresoras().filter((p) => p.id !== id));
}

export function getNextImpresoraId(): number {
  return nextId(getImpresoras());
}

export function importImpresoras(items: Omit<Impresora, "id">[]) {
  const existing = getImpresoras();
  let next = nextId(existing);
  const newItems: Impresora[] = items.map((item) => ({ id: next++, ...item }));
  set(KEYS.impresoras, [...existing, ...newItems]);
}

// ─── Production helpers ───
export function getProductionQueue() {
  const pedidos = getPedidos().filter((p) => !["Entregado", "Cancelado"].includes(p.estado));
  const queue: { pedidoId: number; cliente: string; producto: string; parte: string; cantidad: number; estado: string }[] = [];

  for (const pedido of pedidos) {
    const items = pedido.items || [];
    if (items.length === 0) {
      // Legacy pedido without items — skip or add placeholder
      queue.push({
        pedidoId: pedido.id,
        cliente: pedido.cliente,
        producto: "Pedido #" + pedido.id,
        parte: "Completo",
        cantidad: 1,
        estado: pedido.estado,
      });
    }
    for (const item of items) {
      const producto = getProductos().find((p) => p.id === item.productoId);
      if (producto && producto.partes.length > 0) {
        for (const parte of producto.partes) {
          queue.push({
            pedidoId: pedido.id,
            cliente: pedido.cliente,
            producto: producto.nombre,
            parte: parte.nombre,
            cantidad: item.cantidad,
            estado: pedido.estado,
          });
        }
      } else {
        queue.push({
          pedidoId: pedido.id,
          cliente: pedido.cliente,
          producto: item.productoNombre,
          parte: "Completo",
          cantidad: item.cantidad,
          estado: pedido.estado,
        });
      }
    }
  }

  return queue;
}

export function getKPIs() {
  const pedidos = getPedidos();
  const ventas = getVentas();
  const filamentos = getFilamentos();
  const gastos = getGastos();
  const productos = getProductos();
  const impresoras = getImpresoras();
  const queue = getProductionQueue();

  return {
    pedidosTotal: pedidos.length,
    pedidosEntregados: pedidos.filter((p) => p.estado === "Entregado").length,
    pedidosPendientes: pedidos.filter((p) => ["Pendiente", "Imprimiendo", "Post-procesado", "Listo"].includes(p.estado)).length,
    ventasTotal: ventas.length,
    ventasMonto: ventas.reduce((s, v) => s + v.total, 0),
    gastosMonto: gastos.reduce((s, g) => s + g.monto, 0),
    filamentosStock: filamentos.reduce((s, f) => s + f.stock, 0),
    productosTotal: productos.length,
    impresorasTotal: impresoras.length,
    impresorasActivas: impresoras.filter((i) => i.activa).length,
    productionItems: queue.length,
  };
}

export function getNextPedidoId(): number {
  return nextId(getPedidos());
}

export function clearAllData() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
