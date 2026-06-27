"use client";

import { useState, useEffect } from "react";
import { DollarSign, Search, Plus, X, CheckCircle } from "lucide-react";
import { getVentas, addVenta, Venta } from "@/lib/dataService";

export default function AdminVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ producto: "", cantidad: 1, cliente: "", formaPago: "Efectivo", total: 0, observaciones: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    setVentas(getVentas());
  }, []);

  const filtered = ventas.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.cliente.toLowerCase().includes(q) || v.producto.toLowerCase().includes(q);
  });

  const totalMonto = filtered.reduce((s, v) => s + v.total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVenta({
      fecha: new Date().toISOString().slice(0, 10),
      producto: form.producto,
      cantidad: form.cantidad,
      cliente: form.cliente,
      formaPago: form.formaPago,
      total: form.total,
      observaciones: form.observaciones,
    });
    setVentas(getVentas());
    setForm({ producto: "", cantidad: 1, cliente: "", formaPago: "Efectivo", total: 0, observaciones: "" });
    setShowForm(false);
    setToast("Venta registrada");
    setTimeout(() => setToast(""), 3000);
  };

  const formasPago = ["Efectivo", "Transferencia", "Mercado Pago", "Crypto", "Otro"];

  return (
    <div className="p-4 md:p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-medium animate-in slide-in-from-top">
          <CheckCircle className="inline w-4 h-4 mr-1" /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tone-amber/10 rounded-xl">
            <DollarSign className="w-6 h-6 text-tone-amber" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Ventas</h1>
            <p className="text-xs text-gray-600">${totalMonto.toLocaleString()} total · {filtered.length} registros</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cerrar" : "Nueva Venta"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-tone-dark/60 border border-white/5 rounded-xl p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Producto</label>
              <input required value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Cliente</label>
              <input required value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Cantidad</label>
              <input type="number" min={1} value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: parseInt(e.target.value) || 1 })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Forma de pago</label>
              <select value={form.formaPago} onChange={(e) => setForm({ ...form, formaPago: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40 [&>option]:bg-tone-darker">
                {formasPago.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Total ($)</label>
              <input type="number" min={0} required value={form.total} onChange={(e) => setForm({ ...form, total: parseFloat(e.target.value) || 0 })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Observaciones</label>
              <input value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
            Registrar Venta
          </button>
        </form>
      )}

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ventas..."
          className="w-full bg-tone-darker/80 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 transition" />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600">No hay ventas registradas</p>
          </div>
        ) : (
          filtered.map((v) => (
            <div key={v.id} className="bg-tone-dark/60 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-tone-amber/20 transition">
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{v.producto}</p>
                <p className="text-sm text-gray-400">{v.cliente} · {v.cantidad} unid.</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-tone-amber font-black">${v.total.toLocaleString()}</p>
                <p className="text-xs text-gray-600">{v.formaPago} · {v.fecha}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
