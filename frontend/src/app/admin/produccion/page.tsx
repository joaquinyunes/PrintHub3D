"use client";

import { useState, useEffect } from "react";
import { Printer, Plus, X, Save, Trash2, Edit3, ClipboardList, Spool, Wrench } from "lucide-react";
import { getImpresoras, saveImpresora, deleteImpresora, getNextImpresoraId, getProductionQueue, getProductos, Impresora } from "@/lib/dataService";

export default function AdminProduccion() {
  const [impresoras, setImpresoras] = useState<Impresora[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Impresora | null>(null);
  const [toast, setToast] = useState("");
  const [filterEstado, setFilterEstado] = useState("Todas");

  const [form, setForm] = useState({ nombre: "", modelo: "", tipo: "FDM", mejorPara: "", notas: "", activa: true });

  useEffect(() => {
    setImpresoras(getImpresoras());
    setQueue(getProductionQueue());
  }, []);

  const refresh = () => {
    setImpresoras(getImpresoras());
    setQueue(getProductionQueue());
  };

  const openNew = () => {
    setForm({ nombre: "", modelo: "", tipo: "FDM", mejorPara: "", notas: "", activa: true });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Impresora) => {
    setForm({ nombre: p.nombre, modelo: p.modelo, tipo: p.tipo, mejorPara: p.mejorPara, notas: p.notas, activa: p.activa });
    setEditing(p);
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    if (editing) {
      saveImpresora({ ...editing, ...form });
    } else {
      saveImpresora({ id: getNextImpresoraId(), ...form });
    }
    refresh();
    setShowForm(false);
    setToast(editing ? "Impresora actualizada" : "Impresora agregada");
    setTimeout(() => setToast(""), 3000);
  };

  const handleDelete = (id: number) => {
    if (!confirm("¿Eliminar impresora?")) return;
    deleteImpresora(id);
    refresh();
    setToast("Impresora eliminada");
    setTimeout(() => setToast(""), 3000);
  };

  const filteredQueue = filterEstado === "Todas" ? queue : queue.filter((q) => q.estado === filterEstado);
  const estados = [...new Set(queue.map((q) => q.estado))];

  const productos = getProductos();

  return (
    <div className="p-4 md:p-8 space-y-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-medium">
          {toast}
        </div>
      )}

      {/* ===== IMPRESORAS ===== */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tone-red/10 rounded-xl">
              <Printer className="w-6 h-6 text-tone-red" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Producción</h1>
              <p className="text-xs text-gray-600">{impresoras.length} impresoras · {queue.length} items en cola</p>
            </div>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
            <Plus className="w-4 h-4" /> Agregar Impresora
          </button>
        </div>

        {/* Printer form */}
        {showForm && (
          <form onSubmit={handleSave} className="bg-tone-dark/60 border border-white/5 rounded-xl p-6 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 font-semibold block mb-1">Nombre</label>
                <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-semibold block mb-1">Modelo</label>
                <input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-semibold block mb-1">Tipo</label>
                <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm [&>option]:bg-tone-darker focus:outline-none focus:border-tone-red/40">
                  <option>FDM</option><option>Resina</option><option>Mixto</option>
                </select>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })}
                    className="accent-tone-red" />
                  <span className="text-sm text-white">Impresora activa</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600 font-semibold block mb-1">¿Para qué productos es mejor?</label>
                <textarea value={form.mejorPara} onChange={(e) => setForm({ ...form, mejorPara: e.target.value })}
                  placeholder="Ej: Vasos, llaveros, piezas grandes..."
                  className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40 resize-none" rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-600 font-semibold block mb-1">Notas</label>
                <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Ej: Temperatura, velocidad, calibración..."
                  className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40 resize-none" rows={2} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-6 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
                <Save className="w-4 h-4 inline mr-1" /> {editing ? "Actualizar" : "Guardar Impresora"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm font-bold rounded-xl transition">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Printer list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {impresoras.length === 0 && (
            <div className="col-span-full text-center py-8">
              <Printer className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-600">No hay impresoras registradas</p>
              <button onClick={openNew} className="mt-4 px-6 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
                Agregar primera impresora
              </button>
            </div>
          )}
          {impresoras.map((imp) => (
            <div key={imp.id} className={`bg-tone-dark/60 border ${imp.activa ? "border-white/5 hover:border-tone-red/20" : "border-gray-800 opacity-60"} rounded-xl p-4 transition`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Printer className={`w-5 h-5 ${imp.activa ? "text-tone-red" : "text-gray-600"}`} />
                  <h3 className="font-bold text-white">{imp.nombre}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(imp)} className="p-1.5 text-gray-500 hover:text-tone-amber transition">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(imp.id)} className="p-1.5 text-gray-500 hover:text-tone-red transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {imp.modelo && <p className="text-xs text-gray-500 mb-1">{imp.modelo} · {imp.tipo}</p>}
              {imp.mejorPara && (
                <div className="mb-1">
                  <span className="text-[10px] text-tone-amber font-semibold">Mejor para:</span>
                  <p className="text-xs text-gray-400">{imp.mejorPara}</p>
                </div>
              )}
              {imp.notas && <p className="text-xs text-gray-600">{imp.notas}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ===== COLA DE PRODUCCIÓN ===== */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-tone-red" /> Cola de Producción
            <span className="text-xs text-gray-600 font-normal">({queue.length} items)</span>
          </h2>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setFilterEstado("Todas")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterEstado === "Todas" ? "bg-tone-red text-white" : "bg-white/5 text-gray-400 hover:bg-tone-red/10 hover:text-tone-red"}`}>
              Todas
            </button>
            {estados.map((e) => (
              <button key={e} onClick={() => setFilterEstado(e)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterEstado === e ? "bg-tone-red text-white" : "bg-white/5 text-gray-400 hover:bg-tone-red/10 hover:text-tone-red"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Suggested printer assignment */}
        <div className="space-y-2 mb-6">
          {filteredQueue.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No hay items en producción</p>
            </div>
          ) : (
            filteredQueue.map((item, i) => {
              const suggested = impresoras.filter((imp) => imp.activa).find((imp) =>
                imp.mejorPara.toLowerCase().includes(item.producto.toLowerCase().slice(0, 4))
              );
              return (
                <div key={i} className="bg-tone-dark/60 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-tone-red/20 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 font-mono">#{item.pedidoId}</span>
                      <span className="text-white font-bold text-sm truncate">{item.producto}</span>
                    </div>
                    <p className="text-xs text-tone-red font-semibold">{item.parte} · {item.cliente}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-white font-bold">x{item.cantidad}</span>
                    <p className="text-[10px] text-gray-600">{item.estado}</p>
                  </div>
                  <div className="flex-shrink-0 w-40 text-right">
                    {suggested ? (
                      <span className="text-[10px] text-tone-amber bg-tone-amber/10 px-2 py-1 rounded-full">
                        <Printer className="w-3 h-3 inline mr-1" />{suggested.nombre}
                      </span>
                    ) : impresoras.filter((imp) => imp.activa).length > 0 ? (
                      <span className="text-[10px] text-gray-600">Sin asignar</span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Productos con sus partes */}
        <div className="bg-tone-dark/60 border border-white/5 rounded-xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Spool className="w-4 h-4 text-tone-amber" /> Productos y sus partes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {productos.length === 0 && <p className="text-gray-600 text-sm col-span-full">No hay productos en el catálogo</p>}
            {productos.map((p) => (
              <div key={p.id} className="bg-tone-darker/40 border border-white/5 rounded-xl p-4">
                <p className="text-white font-bold text-sm truncate">{p.nombre}</p>
                {p.partes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.partes.map((pt) => (
                      <span key={pt.id} className="px-2 py-0.5 bg-tone-amber/10 text-tone-amber text-[10px] rounded-full">
                        {pt.nombre}
                      </span>
                    ))}
                  </div>
                )}
                {p.partes.length === 0 && <p className="text-[10px] text-gray-600 mt-1">Sin partes definidas</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
