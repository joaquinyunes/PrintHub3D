"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit, CheckCircle2, X, Loader2, Package } from "lucide-react";
import { apiUrl } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  tenantId: string;
}

interface Category {
  name: string;
  products: { name: string; price: number }[];
}

export default function CatalogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [session, setSession] = useState<any>(null);
  
  // Categorías y productos
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      setSession(user);
      if (user.user.role !== 'admin') {
        router.push('/');
        return;
      }
      loadProducts(user.token);
    } else {
      router.push('/admin/login');
    }
  }, [router]);

  const loadProducts = async (token: string) => {
    try {
      const res = await fetch(apiUrl('/api/products?tenantId=global3d_hq'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      // Agrupar por categoría
      const grouped: Record<string, Category> = {};
      data.forEach((p: any) => {
        const cat = p.category || 'General';
        if (!grouped[cat]) grouped[cat] = { name: cat, products: [] };
        grouped[cat].products.push({ name: p.name, price: p.price });
      });
      
      setCategories(Object.values(grouped));
      setProducts(data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      // Crear categoría vacía
      const cat = newCatName.trim();
      setCategories([...categories, { name: cat, products: [] }]);
      setNewCatName("");
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const addProductToCategory = async (catName: string, productName: string, price: number) => {
    if (!productName.trim() || !price) return;
    setSaving(true);
    try {
      // Crear producto en la base de datos
      await fetch(apiUrl('/api/products'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`
        },
        body: JSON.stringify({
          name: productName,
          price: Number(price),
          category: catName,
          stock: 0,
          cost: 0
        })
      });
      
      // Recargar
      loadProducts(session!.token);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await fetch(apiUrl(`/api/products/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.token}` }
      });
      loadProducts(session!.token);
    } catch(e) { console.error(e); }
  };

  const updateProduct = async (id: string, name: string, price: number) => {
    try {
      await fetch(apiUrl(`/api/products/${id}`), {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`
        },
        body: JSON.stringify({ name, price })
      });
      loadProducts(session!.token);
    } catch(e) { console.error(e); }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">Catálogo de Precios</h1>
          <p className="text-gray-500 mt-2">Crea categorías y productos para seleccionar rápidamente al hacer pedidos.</p>
        </div>

        {/* AGREGAR CATEGORÍA */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Nueva Categoría</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="Ej: Vasos, Llaveros, Figuras..."
              className="flex-1 bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-white outline-none focus:border-blue-500"
            />
            <button
              onClick={addCategory}
              disabled={saving || !newCatName.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-gray-500 text-white px-6 py-3 rounded-lg font-bold uppercase tracking-wider flex items-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4"/>}
              Agregar
            </button>
          </div>
        </div>

        {/* CATEGORÍAS Y PRODUCTOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map(cat => (
            <div key={cat.name} className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-black uppercase mb-4 text-blue-400">{cat.name}</h3>
              
              {/* Lista de productos */}
              <div className="space-y-2 mb-4">
                {cat.products.map((prod, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-black/30 p-3 rounded-lg">
                    <div>
                      <span className="font-medium">{prod.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-400 font-bold">${prod.price}</span>
                    </div>
                  </div>
                ))}
                {cat.products.length === 0 && (
                  <p className="text-gray-500 text-sm">Sin productos</p>
                )}
              </div>

              {/* AGREGAR PRODUCTO A ESTA CATEGORÍA */}
              <AddProductForm 
                onSubmit={(name, price) => addProductToCategory(cat.name, name, price)}
                saving={saving}
              />
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Package size={48} className="mx-auto mb-4 opacity-50"/>
            <p>No hay categorías. Creá una arriba!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AddProductForm({ onSubmit, saving }: { onSubmit: (name: string, price: number) => void; saving: boolean }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name, Number(price));
    setName("");
    setPrice("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nombre del producto"
        className="flex-1 bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-blue-500"
      />
      <input
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
        placeholder="Precio"
        className="w-24 bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-blue-500"
      />
      <button
        type="submit"
        disabled={saving || !name.trim() || !price}
        className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-800 disabled:text-gray-500 text-white px-4 py-2 rounded-lg font-bold text-sm"
      >
        <Plus className="h-4 w-4"/>
      </button>
    </form>
  );
}