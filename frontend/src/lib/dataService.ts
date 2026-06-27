"use client";

import seed from "@/data/seed.json";

// ─── Types ───
export interface Pedido {
  id: number;
  cliente: string;
  producto: string;
  descripcion: string;
  fechaEntrega: string;
  total: number;
  senia: number;
  saldo: number;
  canal: string;
  estado: string;
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
  seeded: "ph_seeded",
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

// ─── Seed initial data ───
function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;
  set(KEYS.pedidos, seed.pedidos.map((p) => ({ ...p, createdAt: p.fechaEntrega || new Date().toISOString().slice(0, 10) })));
  set(KEYS.ventas, seed.ventas.map((v) => ({ ...v, createdAt: v.fecha || new Date().toISOString().slice(0, 10) })));
  set(KEYS.filamentos, seed.filamentos as Filamento[]);
  set(KEYS.gastos, seed.gastos.map((g) => ({ ...g, id: Date.now() + Math.random(), mes: "2026-07" })));
  localStorage.setItem(KEYS.seeded, "true");
}

// ─── Next ID helper ───
function nextId(items: { id: number }[]): number {
  return items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
}

// ─── Public API ───
export function getPedidos(): Pedido[] {
  ensureSeeded();
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
  ventas.push({
    id: nextId(ventas),
    fecha: new Date().toISOString().slice(0, 10),
    producto: pedido.producto,
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
  ensureSeeded();
  return get<Venta>(KEYS.ventas, []);
}

export function addVenta(v: Omit<Venta, "id" | "createdAt">) {
  const items = getVentas();
  items.push({ ...v, id: nextId(items), createdAt: new Date().toISOString().slice(0, 10) });
  set(KEYS.ventas, items);
}

export function getFilamentos(): Filamento[] {
  ensureSeeded();
  return get<Filamento>(KEYS.filamentos, []);
}

export function updateFilamentoStock(id: number, delta: number) {
  const items = getFilamentos();
  const f = items.find((i) => i.id === id);
  if (!f) return;
  f.stock = Math.max(0, f.stock + delta);
  set(KEYS.filamentos, items);
}

export function getGastos(): Gasto[] {
  ensureSeeded();
  return get<Gasto>(KEYS.gastos, []);
}

export function addGasto(g: Omit<Gasto, "id">) {
  const items = getGastos();
  items.push({ ...g, id: nextId(items) });
  set(KEYS.gastos, items);
}

export function getKPIs() {
  const pedidos = getPedidos();
  const ventas = getVentas();
  const filamentos = getFilamentos();
  const gastos = getGastos();

  return {
    pedidosTotal: pedidos.length,
    pedidosEntregados: pedidos.filter((p) => p.estado === "Entregado").length,
    pedidosPendientes: pedidos.filter((p) => p.estado === "Pendiente" || p.estado === "Imprimiendo" || p.estado === "Post-procesado" || p.estado === "Listo").length,
    ventasTotal: ventas.length,
    ventasMonto: ventas.reduce((s, v) => s + v.total, 0),
    gastosMonto: gastos.reduce((s, g) => s + g.monto, 0),
    filamentosStock: filamentos.reduce((s, f) => s + f.stock, 0),
  };
}
