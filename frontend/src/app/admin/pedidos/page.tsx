"use client";

import { useState, useEffect } from "react";
import { Package, Search, CheckCircle, Clock, Printer, Wrench, Truck, XCircle, Download, Plus, X, Phone } from "lucide-react";
import { getPedidos, updatePedidoStatus, savePedido, getNextPedidoId, getProductos, Pedido, PedidoItem } from "@/lib/dataService";
import { exportToExcel } from "@/lib/excelService";

const ESTADOS = ["Pendiente", "Imprimiendo", "Post-procesado", "Listo", "Entregado", "Cancelado"];

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  Pendiente: { icon: Clock, color: "text-tone-amber", bg: "bg-tone-amber/10" },
  Imprimiendo: { icon: Printer, color: "text-tone-red", bg: "bg-tone-red/10" },
  "Post-procesado": { icon: Wrench, color: "text-tone-amber", bg: "bg-tone-amber/10" },
  Listo: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  Entregado: { icon: Truck, color: "text-blue-400", bg: "bg-blue-500/10" },
  Cancelado: { icon: XCircle, color: "text-gray-500", bg: "bg-gray-800" },
};

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState(getProductos());
  const [tab, setTab] = useState("Pendiente");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState<{
    cliente: string; telefono: string; descripcion: string; fechaEntrega: string; total: number; senia: number; canal: string; items: { productoId: number; nombre: string; cantidad: number; precio: number }[];
  }>({
    cliente: "", telefono: "", descripcion: "", fechaEntrega: "", total: 0, senia: 0, canal: "WhatsApp", items: [],
  });

  useEffect(() => {
    setPedidos(getPedidos());
    setProductos(getProductos());
    setLoading(false);
  }, []);

  const filtered = pedidos
    .filter((p) => tab === "Todas" || p.estado === tab)
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.cliente.toLowerCase().includes(q) || (p.telefono || "").includes(q);
    });

  const handleStatus = (id: number, estado: string) => {
    updatePedidoStatus(id, estado);
    setPedidos(getPedidos());
  };

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { productoId: 0, nombre: "", cantidad: 1, precio: 0 }] });
  };

  const removeItem = (i: number) => {
    const items = form.items.filter((_, idx) => idx !== i);
    const total = items.reduce((s, it) => s + it.precio * it.cantidad, 0);
    setForm({ ...form, items, total });
  };

  const updateItem = (i: number, field: string, value: any) => {
    const items = [...form.items];
    (items[i] as any)[field] = value;
    if (field === "productoId" && value) {
      const prod = productos.find((p) => p.id === value);
      if (prod) {
        items[i].nombre = prod.nombre;
        items[i].precio = prod.precio;
      }
    }
    const total = items.reduce((s, it) => s + (it.precio || 0) * (it.cantidad || 1), 0);
    setForm({ ...form, items, total });
  };

  const resetForm = () => {
    setForm({ cliente: "", telefono: "", descripcion: "", fechaEntrega: "", total: 0, senia: 0, canal: "WhatsApp", items: [] });
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente.trim() || form.items.length === 0) return;
    const pedido: Pedido = {
      id: getNextPedidoId(),
      cliente: form.cliente,
      telefono: form.telefono,
      descripcion: form.descripcion,
      fechaEntrega: form.fechaEntrega,
      total: form.total,
      senia: form.senia,
      saldo: form.total - form.senia,
      canal: form.canal,
      estado: "Pendiente",
      items: form.items.map((it) => ({ productoId: it.productoId, productoNombre: it.nombre, cantidad: it.cantidad, precio: it.precio })),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    savePedido(pedido);
    setPedidos(getPedidos());
    resetForm();
    setToast("Pedido #" + pedido.id + " creado");
    setTimeout(() => setToast(""), 3000);
  };

  if (loading) return <div className="p-8 text-gray-500">Cargando pedidos...</div>;

  return (
    <div className="p-4 md:p-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tone-red/10 rounded-xl">
            <Package className="w-6 h-6 text-tone-red" />
          </div>
          <h1 className="text-2xl font-black text-white">Pedidos</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setProductos(getProductos()); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
            <Plus className="w-4 h-4" /> Nuevo Pedido
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {/* New order form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-tone-dark/60 border border-white/5 rounded-xl p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Cliente</label>
              <input required value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Teléfono</label>
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+54 9 11 ..."
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Fecha de entrega</label>
              <input type="date" value={form.fechaEntrega} onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Canal</label>
              <select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm [&>option]:bg-tone-darker focus:outline-none focus:border-tone-red/40">
                <option>WhatsApp</option><option>Instagram</option><option>Facebook</option><option>Local</option><option>Otro</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600 font-semibold block mb-1">Descripción</label>
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40 resize-none" rows={2} />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-600 font-semibold">Productos del pedido</label>
              <button type="button" onClick={addItem} className="text-xs text-tone-red hover:text-tone-red/80 font-semibold">+ Agregar producto</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-start bg-tone-darker/40 rounded-lg p-3">
                  <div className="flex-1">
                    <select value={item.productoId} onChange={(e) => updateItem(i, "productoId", parseInt(e.target.value))}
                      className="w-full bg-tone-darker border border-white/5 rounded-lg px-3 py-2 text-white text-sm [&>option]:bg-tone-darker focus:outline-none focus:border-tone-red/40">
                      <option value={0}>Seleccionar producto...</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - ${p.precio.toLocaleString()} {p.partes.length > 0 ? `(${p.partes.length} partes)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <input type="number" min={1} value={item.cantidad} onChange={(e) => updateItem(i, "cantidad", parseInt(e.target.value) || 1)}
                      className="w-full bg-tone-darker border border-white/5 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-tone-red/40" />
                  </div>
                  <div className="w-28">
                    <input type="number" min={0} value={item.precio} onChange={(e) => updateItem(i, "precio", parseFloat(e.target.value) || 0)}
                      className="w-full bg-tone-darker border border-white/5 rounded-lg px-3 py-2 text-white text-sm text-right focus:outline-none focus:border-tone-red/40" />
                  </div>
                  <button type="button" onClick={() => removeItem(i)} className="p-2 text-gray-500 hover:text-tone-red transition mt-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {form.items.length === 0 && (
                <p className="text-xs text-gray-600 py-2">Agregá al menos un producto al pedido</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div>
                <label className="text-xs text-gray-600 font-semibold block mb-1">Seña ($)</label>
                <input type="number" min={0} value={form.senia} onChange={(e) => setForm({ ...form, senia: parseFloat(e.target.value) || 0 })}
                  className="w-32 bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
              </div>
              <div className="pt-5">
                <span className="text-xs text-gray-600">Saldo: </span>
                <span className="text-white font-bold">${(form.total - form.senia).toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-600 block">Total</span>
              <span className="text-2xl font-black text-tone-amber">${form.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={form.items.length === 0} className="px-6 py-2.5 bg-tone-red hover:bg-tone-red/90 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-bold rounded-xl transition">
              Crear Pedido
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm font-bold rounded-xl transition">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
        {["Todas", ...ESTADOS].map((e) => (
          <button key={e} onClick={() => setTab(e)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${tab === e ? "bg-tone-red text-white" : "bg-white/5 text-gray-400 hover:bg-tone-red/10 hover:text-tone-red"}`}>
            {e}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente o teléfono..."
          className="w-full bg-tone-darker/80 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 transition" />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600">No hay pedidos en esta categoría</p>
          </div>
        ) : (
          filtered.map((p) => {
            const cfg = STATUS_CONFIG[p.estado] || STATUS_CONFIG.Pendiente;
            const StatusIcon = cfg.icon;
            return (
              <div key={p.id} className="bg-tone-dark/60 border border-white/5 rounded-xl p-4 md:p-5 hover:border-tone-red/20 transition">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
                  <div className={`p-2 rounded-lg ${cfg.bg} flex-shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-gray-600 font-mono">#{p.id}</span>
                      <span className={`text-xs font-bold ${cfg.color}`}>{p.estado}</span>
                    </div>
                    <h3 className="font-bold text-white">{p.cliente}</h3>
                    {p.telefono && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {p.telefono}
                      </p>
                    )}
                    {p.items && p.items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {p.items.map((it, i) => (
                          <span key={i} className="px-2 py-0.5 bg-tone-red/10 text-tone-red text-xs rounded-full">
                            {it.productoNombre} x{it.cantidad}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.descripcion && <p className="text-xs text-gray-600 mt-1 truncate">{p.descripcion}</p>}
                  </div>

                  <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-white font-black">${p.total.toLocaleString()}</p>
                      {p.senia > 0 && <p className="text-tone-amber text-xs">Seña: ${p.senia.toLocaleString()}</p>}
                      {p.saldo > 0 && <p className="text-tone-red text-xs">Saldo: ${p.saldo.toLocaleString()}</p>}
                      {p.fechaEntrega && <p className="text-xs text-gray-600">Entrega: {p.fechaEntrega}</p>}
                    </div>

                    {p.estado !== "Entregado" && p.estado !== "Cancelado" && (
                      <div className="flex gap-1.5 flex-wrap">
                        {ESTADOS.map((e) => {
                          const idxActual = ESTADOS.indexOf(p.estado);
                          const idxTarget = ESTADOS.indexOf(e);
                          if (idxTarget <= idxActual || e === "Cancelado") return null;
                          return (
                            <button key={e} onClick={() => handleStatus(p.id, e)}
                              className="px-3 py-1.5 bg-tone-red/10 text-tone-red text-xs font-semibold rounded-lg hover:bg-tone-red/20 transition">
                              {e}
                            </button>
                          );
                        })}
                        {p.estado !== "Cancelado" && (
                          <button onClick={() => handleStatus(p.id, "Cancelado")}
                            className="px-3 py-1.5 bg-gray-800 text-gray-400 text-xs font-semibold rounded-lg hover:bg-gray-700 transition">
                            Cancelar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
