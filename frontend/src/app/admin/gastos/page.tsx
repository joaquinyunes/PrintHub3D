"use client";

import { useState, useEffect } from "react";
import { DollarSign, Plus, X, CheckCircle } from "lucide-react";
import { getGastos, addGasto, Gasto } from "@/lib/dataService";

export default function AdminGastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ concepto: "", monto: 0, categoria: "Global 3D", mes: "2026-07" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    setGastos(getGastos());
  }, []);

  const categorias = ["Global 3D", "Casa y Valentino", "Personales"];

  const totalMes = gastos.reduce((s, g) => s + g.monto, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addGasto({ ...form, monto: form.monto });
    setGastos(getGastos());
    setForm({ concepto: "", monto: 0, categoria: "Global 3D", mes: "2026-07" });
    setShowForm(false);
    setToast("Gasto agregado");
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="p-4 md:p-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-medium">
          <CheckCircle className="inline w-4 h-4 mr-1" /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tone-red/10 rounded-xl">
            <DollarSign className="w-6 h-6 text-tone-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Gastos</h1>
            <p className="text-xs text-gray-600">${totalMes.toLocaleString()} este mes</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cerrar" : "Nuevo Gasto"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-tone-dark/60 border border-white/5 rounded-xl p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Concepto</label>
              <input required value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Categoría</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm [&>option]:bg-tone-darker focus:outline-none focus:border-tone-red/40">
                {categorias.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Monto ($)</label>
              <input type="number" min={0} required value={form.monto} onChange={(e) => setForm({ ...form, monto: parseFloat(e.target.value) || 0 })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
            Agregar Gasto
          </button>
        </form>
      )}

      {/* by category */}
      {categorias.map((cat) => {
        const items = gastos.filter((g) => g.categoria === cat);
        if (items.length === 0) return null;
        const subtotal = items.reduce((s, g) => s + g.monto, 0);
        return (
          <div key={cat} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">{cat}</h3>
              <span className="text-sm font-bold text-tone-red">${subtotal.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              {items.map((g, i) => (
                <div key={i} className="bg-tone-dark/60 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between hover:border-tone-red/20 transition">
                  <span className="text-white text-sm">{g.concepto}</span>
                  <span className="text-white font-bold">${g.monto.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
