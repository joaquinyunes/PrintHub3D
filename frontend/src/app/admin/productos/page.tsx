"use client";

import { useState, useEffect } from "react";
import { Package, Plus, X, Save, Trash2, Edit3 } from "lucide-react";
import { getProductos, saveProducto, deleteProducto, getNextProductoId, ProductoCatalogo, Parte } from "@/lib/dataService";

export default function AdminProductos() {
  const [productos, setProductos] = useState<ProductoCatalogo[]>([]);
  const [editing, setEditing] = useState<ProductoCatalogo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setProductos(getProductos());
  }, []);

  const [form, setForm] = useState<{ nombre: string; descripcion: string; precio: number; partes: { nombre: string }[] }>({
    nombre: "", descripcion: "", precio: 0, partes: [],
  });

  const openNew = () => {
    setForm({ nombre: "", descripcion: "", precio: 0, partes: [] });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: ProductoCatalogo) => {
    setForm({ nombre: p.nombre, descripcion: p.descripcion, precio: p.precio, partes: p.partes.map((pt) => ({ nombre: pt.nombre })) });
    setEditing(p);
    setShowForm(true);
  };

  const addParte = () => {
    setForm({ ...form, partes: [...form.partes, { nombre: "" }] });
  };

  const removeParte = (i: number) => {
    setForm({ ...form, partes: form.partes.filter((_, idx) => idx !== i) });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;
    const partes: Parte[] = form.partes
      .filter((p) => p.nombre.trim())
      .map((p, i) => ({ id: i + 1, nombre: p.nombre.trim() }));

    if (editing) {
      saveProducto({ ...editing, nombre: form.nombre, descripcion: form.descripcion, precio: form.precio, partes });
    } else {
      saveProducto({ id: getNextProductoId(), nombre: form.nombre, descripcion: form.descripcion, precio: form.precio, partes });
    }
    setProductos(getProductos());
    setShowForm(false);
    setToast(editing ? "Producto actualizado" : "Producto creado");
    setTimeout(() => setToast(""), 3000);
  };

  const handleDelete = (id: number) => {
    if (!confirm("¿Eliminar producto?")) return;
    deleteProducto(id);
    setProductos(getProductos());
    setToast("Producto eliminado");
    setTimeout(() => setToast(""), 3000);
  };

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
          <div>
            <h1 className="text-2xl font-black text-white">Productos</h1>
            <p className="text-xs text-gray-600">{productos.length} productos en catálogo</p>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-tone-dark/60 border border-white/5 rounded-xl p-6 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600 font-semibold block mb-1">Nombre del producto</label>
              <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Precio ($)</label>
              <input type="number" min={0} value={form.precio} onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })}
                className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-semibold block mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-tone-red/40 resize-none" rows={2} />
          </div>

          {/* Parts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-600 font-semibold">Partes / Componentes</label>
              <button type="button" onClick={addParte} className="text-xs text-tone-red hover:text-tone-red/80 font-semibold">+ Agregar parte</button>
            </div>
            <div className="space-y-2">
              {form.partes.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={p.nombre} onChange={(e) => {
                    const partes = [...form.partes];
                    partes[i].nombre = e.target.value;
                    setForm({ ...form, partes });
                  }} placeholder="Ej: Cuerpo, Tapa, Base..."
                    className="flex-1 bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-tone-red/40" />
                  <button type="button" onClick={() => removeParte(i)} className="p-2 text-gray-500 hover:text-tone-red transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {form.partes.length === 0 && (
                <p className="text-xs text-gray-600">Sin partes definidas. Se agregará como producto completo.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
              <Save className="w-4 h-4" /> {editing ? "Actualizar" : "Guardar Producto"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm font-bold rounded-xl transition">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {productos.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600">No hay productos en el catálogo</p>
            <button onClick={openNew} className="mt-4 px-6 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
              Crear primer producto
            </button>
          </div>
        )}
        {productos.map((p) => (
          <div key={p.id} className="bg-tone-dark/60 border border-white/5 rounded-xl p-4 md:p-5 hover:border-tone-red/20 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-600 font-mono">#{p.id}</span>
                  <span className="text-white font-bold">{p.nombre}</span>
                </div>
                {p.descripcion && <p className="text-sm text-gray-400 truncate">{p.descripcion}</p>}
                {p.partes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.partes.map((pt) => (
                      <span key={pt.id} className="px-2 py-0.5 bg-tone-amber/10 border border-tone-amber/20 text-tone-amber text-xs rounded-full">
                        {pt.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-white font-black">${p.precio.toLocaleString()}</span>
                <button onClick={() => openEdit(p)} className="p-2 text-gray-500 hover:text-tone-amber transition">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-500 hover:text-tone-red transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
