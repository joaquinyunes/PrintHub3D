"use client";

import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Globe, EyeOff, Image as ImageIcon, Loader2, Package } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  isPublic: boolean;
  imageUrl?: string;
  description?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    price: '',
    stock: '',
    description: '',
    imageUrl: '',
    isPublic: false
  });

  // Helper para obtener el token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 👈 Aquí va la llave
    };
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/products', {
        headers: getAuthHeaders() // Enviamos credenciales
      });
      if (res.ok) {
        setProducts(await res.json());
      } else if (res.status === 401) {
        alert("Sesión expirada");
        window.location.href = '/admin/login';
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = async () => {
    if (!formData.name || !formData.price) return alert("Faltan datos obligatorios");
    setLoading(true);
    
    try {
        const res = await fetch('http://localhost:5000/api/products', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            setIsModalOpen(false);
            setFormData({ name: '', category: 'General', price: '', stock: '', description: '', imageUrl: '', isPublic: false });
            fetchProducts();
        } else {
            alert("Error al guardar producto");
        }
    } catch (error) {
        alert("Error de conexión");
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("¿Borrar producto?")) return;
    
    await fetch(`http://localhost:5000/api/products/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-md sticky top-0 z-10">
        <div>
            <h1 className="text-2xl font-bold text-white">Inventario</h1>
            <p className="text-gray-400 text-xs">Gestiona lo que vendes en tu tienda.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary text-black px-4 py-2 rounded-lg font-bold hover:bg-white transition flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" /> Nuevo Producto
        </button>
      </div>

      {/* GRID DE PRODUCTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p) => (
            <div key={p._id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group hover:border-primary/50 transition duration-300">
                
                {/* Imagen */}
                <div className="h-40 bg-black/50 relative overflow-hidden">
                    {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600"><ImageIcon className="h-8 w-8 opacity-50"/></div>
                    )}
                    
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 backdrop-blur-md ${p.isPublic ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-500/20 border-red-500 text-red-400'}`}>
                        {p.isPublic ? <Globe className="h-3 w-3"/> : <EyeOff className="h-3 w-3"/>}
                        {p.isPublic ? 'PÚBLICO' : 'OCULTO'}
                    </div>
                </div>

                {/* Info */}
                <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-white truncate pr-2">{p.name}</h3>
                        <span className="font-mono text-primary font-bold">${p.price}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{p.category} • Stock: {p.stock}</p>
                    
                    <div className="flex justify-end pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleDelete(p._id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition" title="Eliminar">
                            <Trash2 className="h-4 w-4"/>
                         </button>
                    </div>
                </div>
            </div>
        ))}
        
        {products.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 border-2 border-dashed border-white/10 rounded-xl">
                <Package size={40} className="mb-2 opacity-50" />
                <p>No tienes productos aún.</p>
            </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-xl w-full max-w-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Nuevo Producto</h2>
            
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400">Nombre</label>
                        <input className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white focus:border-primary outline-none"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Categoría</label>
                        <input className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white focus:border-primary outline-none"
                            value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-gray-400">Precio ($)</label>
                        <input type="number" className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white focus:border-primary outline-none"
                            value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Stock Inicial</label>
                        <input type="number" className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white focus:border-primary outline-none"
                            value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                    </div>
                </div>

                <div className="border-t border-white/10 pt-4 mt-2">
                    <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><Globe className="h-4 w-4"/> Configuración de Tienda</h3>
                    
                    <div className="flex items-center gap-3 mb-4 bg-white/5 p-3 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10 transition"
                         onClick={() => setFormData({...formData, isPublic: !formData.isPublic})}>
                        <div className={`w-10 h-5 rounded-full flex items-center p-1 transition-colors ${formData.isPublic ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full transform transition-transform ${formData.isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-xs text-gray-300">{formData.isPublic ? 'Visible en Tienda Pública' : 'Oculto (Solo Interno)'}</span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400">URL de Imagen</label>
                            <input className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white focus:border-primary outline-none"
                                placeholder="https://..."
                                value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                        </div>

                        <div>
                            <label className="text-xs text-gray-400">Descripción</label>
                            <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white focus:border-primary outline-none resize-none"
                                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded text-sm text-gray-400 hover:text-white">Cancelar</button>
                    <button onClick={handleSave} disabled={loading} className="bg-primary text-black px-6 py-2 rounded font-bold text-sm hover:bg-white transition flex items-center gap-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin"/>} Guardar
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}