"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package, Plus, Search, Minus, Trash2, Loader2,
  X, AlertTriangle, Barcode, TrendingUp, CheckCircle2,
  Wallet, Zap, History, ChevronRight, Calendar, Boxes, Bot
} from "lucide-react";
import { apiUrl } from "@/lib/api";

// --- INTERFACES ---
interface Product {
  _id: string; name: string; price: number; cost: number;
  stock: number; category: string; sku?: string; minStock?: number;
}

interface Sale {
    _id: string; productName: string; quantity: number;
    price: number; profit: number; createdAt: string;
}

interface Toast { id: number; message: string; type: 'success' | 'error'; }

// --- COMPONENTE: TARJETA KPI (ESTILO DASHBOARD) ---
function StatCard({ title, value, icon: Icon, color, sub }: any) {
    return (
        <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all shadow-lg min-w-[200px] flex-1">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 ${color.text}`}>
                <Icon size={40} />
            </div>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.bg}`}/>
            <div className="relative z-10">
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-2 ${color.text}`}>
                    <Icon size={12}/> {title}
                </p>
                <div className="text-2xl font-black text-white tracking-tighter">{value}</div>
                {sub && <p className="text-[9px] text-gray-500 font-bold uppercase mt-1 tracking-widest">{sub}</p>}
            </div>
        </div>
    )
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [session, setSession] = useState<any>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // MODALES
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'day'|'week'|'month'|'year'>('month');

  const [newSectionName, setNewSectionName] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "", price: "", cost: "", stock: "", category: "", sku: "", minStock: "5"
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/admin/login"); return; }
    const currentSession = JSON.parse(stored);
    setSession(currentSession);

    const storedSections = localStorage.getItem("customSections");
    if (storedSections) setCustomSections(JSON.parse(storedSections));

    loadData(currentSession.token);
  }, [router]);

  const loadData = async (token: string) => {
      try {
        const [resP, resS] = await Promise.all([
            fetch(apiUrl("/api/products"), { headers: { Authorization: `Bearer ${token}` } }),
            fetch(apiUrl("/api/sales"), { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (resP.ok) setProducts(await resP.json());
        if (resS.ok) setAllSales(await resS.json());
      } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // --- CÁLCULOS DEL MES ---
  const now = new Date();
  const salesThisMonth = allSales.filter(s => {
      const d = new Date(s.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const sessionSalesTotal = salesThisMonth.reduce((acc, s) => acc + s.price, 0);
  const sessionProfitTotal = salesThisMonth.reduce((acc, s) => acc + (s.profit || 0), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  // --- HISTORIAL FILTRADO ---
  const getFilteredHistory = () => {
    const today = new Date();
    return allSales.filter(sale => {
        const date = new Date(sale.createdAt);
        if (historyFilter === 'day') return date.toLocaleDateString() === today.toLocaleDateString();
        if (historyFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 7);
            return date >= weekAgo;
        }
        if (historyFilter === 'month') return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        if (historyFilter === 'year') return date.getFullYear() === today.getFullYear();
        return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // --- ACCIONES ---
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    try {
      const res = await fetch(apiUrl("/api/products"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ 
            ...newProduct, 
            price: Number(newProduct.price), 
            cost: Number(newProduct.cost), 
            stock: Number(newProduct.stock) 
        }),
      });
      if (res.ok) {
        showToast("📦 Producto guardado");
        setIsProductModalOpen(false);
        setNewProduct({ name: "", price: "", cost: "", stock: "", category: "", sku: "", minStock: "5" });
        await loadData(session.token); // RECARGA PARA GUARDADO INMEDIATO
      }
    } catch { showToast("Error", "error"); }
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    const updated = [...customSections, newSectionName.trim()];
    setCustomSections(updated);
    localStorage.setItem("customSections", JSON.stringify(updated));
    setNewSectionName(""); setIsSectionModalOpen(false);
    showToast("Sección creada");
  };

  const handleQuickStock = async (id: string, amount: number) => {
    const product = products.find(p => p._id === id);
    if (!product) return;
    const newStock = Math.max(0, product.stock + amount);
    setProducts(prev => prev.map(p => p._id === id ? { ...p, stock: newStock } : p));
    try { 
        await fetch(apiUrl(`/api/products/${id}`), { 
            method: "PUT", 
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.token}` }, 
            body: JSON.stringify({ stock: newStock }) 
        }); 
    } catch {}
  };

  const handleSellOne = async (product: Product) => {
    if (product.stock < 1) { showToast("Sin stock", "error"); return; }
    try {
      const res = await fetch(apiUrl(`/api/products/${product._id}/sell`), {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.token}` }
      });
      if (res.ok) { showToast(`Vendido: ${product.name}`); loadData(session.token); }
    } catch { showToast("Error", "error"); }
  };

  const filteredProducts = products.filter(p => {
      const matchesSearch = (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (p.sku || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
  });

  const categories = ["Todos", ...Array.from(new Set([...products.map(p => p.category), ...customSections])).filter(Boolean).sort()];

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#050505]"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* TOASTS */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right border ${t.type==='success'?'bg-emerald-500/10 border-emerald-500/20 text-emerald-400':'bg-red-500/10 border-red-500/20 text-red-400'} backdrop-blur-xl`}>
            {t.type==='success'?<CheckCircle2 size={18}/>:<AlertTriangle size={18}/>}
            <span className="font-black text-xs uppercase tracking-widest">{t.message}</span>
          </div>
        ))}
      </div>

      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col z-20 shadow-2xl">
          <div className="p-8 border-b border-white/5">
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white tracking-tighter">STOCK</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1 pl-1">Inventario Real</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
              <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 px-2">Categorías</p>
              {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex justify-between items-center ${selectedCategory === cat ? 'bg-white text-black shadow-xl shadow-white/5 scale-[1.02]' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>
                    {cat}
                    {selectedCategory === cat && <ChevronRight size={14}/>}
                  </button>
              ))}
              <button onClick={() => setIsSectionModalOpen(true)} className="w-full text-left px-4 py-3 mt-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 border border-dashed border-blue-500/20 hover:bg-blue-500/5 flex items-center gap-2">
                  <Plus size={14}/> Nueva Sección
              </button>
          </div>

          <div className="p-6 border-t border-white/5 bg-white/[0.02]">
              <button onClick={() => setIsProductModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
                  <Plus size={16}/> Nuevo Producto
              </button>
          </div>
      </aside>

      {/* --- CONTENIDO --- */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0f172a] via-[#050505] to-[#050505]">
          
          <div className="p-8 flex flex-col gap-8">
              <div className="flex flex-wrap gap-4">
                  <StatCard title="Valor Stock" value={`$${totalInventoryValue.toLocaleString()}`} icon={Boxes} color={{bg:'bg-blue-500', text:'text-blue-400'}} sub="Total en estantería" />
                  <StatCard title="Caja Mes" value={`$${sessionSalesTotal.toLocaleString()}`} icon={Wallet} color={{bg:'bg-emerald-500', text:'text-emerald-400'}} sub="Ingreso Bruto" />
                  <StatCard title="Ganancia" value={`+$${sessionProfitTotal.toLocaleString()}`} icon={TrendingUp} color={{bg:'bg-cyan-500', text:'text-cyan-400'}} sub="Neto mensual" />
                  
                  <button onClick={() => setIsHistoryModalOpen(true)} className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-5 hover:bg-[#141414] transition-all flex flex-col items-center justify-center gap-2 group">
                      <History size={24} className="text-gray-500 group-hover:text-white transition-all"/>
                      <span className="text-[9px] font-black text-gray-500 group-hover:text-white uppercase tracking-widest">Historial</span>
                  </button>
              </div>

              <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 group-focus-within:text-blue-500 transition-colors"/>
                  <input className="w-full bg-[#0a0a0a] border border-white/5 rounded-[24px] py-5 pl-16 pr-8 text-sm text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700 shadow-2xl"
                    placeholder="Buscar por nombre o SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-10 custom-scrollbar">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-md">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="bg-white/[0.03] text-[10px] uppercase text-gray-500 font-black tracking-[0.2em] border-b border-white/5">
                              <th className="px-8 py-6">Producto</th>
                              <th className="px-8 py-6 text-center">Finanzas</th>
                              <th className="px-8 py-6 text-center">Stock</th>
                              <th className="px-8 py-6 text-right">Gestión</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                          {filteredProducts.map(p => {
                              const margin = p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
                              return (
                                  <tr key={p._id} className="group hover:bg-white/[0.01] transition-colors">
                                      <td className="px-8 py-6">
                                          <div className="font-black text-white text-base tracking-tight group-hover:text-blue-400 transition-colors">{p.name}</div>
                                          <div className="flex items-center gap-3 mt-1.5">
                                              <span className="text-[10px] text-gray-600 font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5 uppercase">SKU: {p.sku || '---'}</span>
                                              <span className="text-[10px] text-blue-500/70 font-black uppercase tracking-widest">{p.category}</span>
                                          </div>
                                      </td>
                                      <td className="px-8 py-6 text-center">
                                          <div className="text-lg font-black text-white">${p.price.toLocaleString()}</div>
                                          <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Margen: <span className="text-emerald-500">{margin}%</span></div>
                                      </td>
                                      <td className="px-8 py-6">
                                          <div className="flex items-center justify-center gap-3 bg-black/40 w-fit mx-auto rounded-xl p-2 border border-white/5">
                                              <button onClick={() => handleQuickStock(p._id, -1)} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-red-400"><Minus size={14}/></button>
                                              <span className="w-8 text-center font-mono font-bold text-sm">{p.stock}</span>
                                              <button onClick={() => handleQuickStock(p._id, 1)} className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-emerald-400"><Plus size={14}/></button>
                                          </div>
                                      </td>
                                      <td className="px-8 py-6 text-right">
                                          <div className="flex justify-end items-center gap-3">
                                              <button onClick={() => handleSellOne(p)} className="p-3 rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all active:scale-90 border border-blue-500/20 shadow-lg"><Zap size={18} fill="currentColor"/></button>
                                              <button onClick={async () => { if(confirm('¿Eliminar?')) { await fetch(apiUrl(`/api/products/${p._id}`), { method:'DELETE', headers:{Authorization:`Bearer ${session.token}`}}); loadData(session.token); }}} className="p-3 rounded-xl bg-white/5 text-gray-600 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                                          </div>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      </main>

      {/* --- MODAL HISTORIAL --- */}
      {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in">
              <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                      <div>
                          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3"><History className="text-blue-500"/> Ventas</h2>
                          <div className="flex gap-2 mt-4 bg-black p-1 rounded-xl">
                              {['day', 'week', 'month', 'year'].map(f => (
                                  <button key={f} onClick={() => setHistoryFilter(f as any)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${historyFilter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{f}</button>
                              ))}
                          </div>
                      </div>
                      <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X/></button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
                      {getFilteredHistory().map(sale => (
                          <div key={sale._id} className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                              <div>
                                  <p className="font-black text-white text-sm uppercase tracking-tight">{sale.productName}</p>
                                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">{new Date(sale.createdAt).toLocaleDateString()} <span className="mx-1 text-gray-700">|</span> {sale.quantity} unidad</p>
                              </div>
                              <div className="text-right">
                                  <p className="font-mono font-black text-white text-sm">+${sale.price.toLocaleString()}</p>
                                  <p className="text-[10px] text-emerald-500 font-black uppercase mt-1">Profit: +${sale.profit.toLocaleString()}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- MODAL SECCION --- */}
      {isSectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in">
              <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 shadow-2xl">
                  <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Nueva Sección</h2>
                  <form onSubmit={handleCreateSection}>
                      <input autoFocus className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white mb-6 outline-none focus:border-blue-500 font-bold uppercase text-xs" placeholder="Ej: Herramientas" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} />
                      <div className="flex gap-3">
                          <button type="button" onClick={() => setIsSectionModalOpen(false)} className="flex-1 py-4 text-[11px] font-black text-gray-500 uppercase tracking-widest">Cerrar</button>
                          <button type="submit" className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 shadow-xl transition-all">Crear</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* --- MODAL PRODUCTO --- */}
      {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in">
              <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3"><Package className="text-blue-500"/> Registrar Producto</h2>
                      <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X/></button>
                  </div>
                  <form onSubmit={handleCreateProduct} className="p-10 grid grid-cols-2 gap-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                      <div className="col-span-2">
                          <label className="text-[10px] text-gray-500 font-black uppercase mb-2 block tracking-widest">Nombre del Producto</label>
                          <input required className="w-full bg-[#050505] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-blue-500 transition-all font-bold" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} placeholder="Ej: Filamento PLA Rojo"/>
                      </div>
                      <div className="col-span-1">
                          <label className="text-[10px] text-emerald-500 font-black uppercase mb-2 block tracking-widest">Precio Venta ($)</label>
                          <input required type="number" className="w-full bg-[#050505] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-emerald-500 font-mono text-xl font-black" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price:e.target.value})}/>
                      </div>
                      <div className="col-span-1">
                          <label className="text-[10px] text-blue-500 font-black uppercase mb-2 block tracking-widest">Costo Compra ($)</label>
                          <input required type="number" className="w-full bg-[#050505] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-blue-500 font-mono text-xl font-black" value={newProduct.cost} onChange={e=>setNewProduct({...newProduct, cost:e.target.value})}/>
                      </div>
                      <div className="col-span-1">
                          <label className="text-[10px] text-gray-500 font-black uppercase mb-2 block tracking-widest">Stock Inicial</label>
                          <input required type="number" className="w-full bg-[#050505] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-white font-mono" value={newProduct.stock} onChange={e=>setNewProduct({...newProduct, stock:e.target.value})}/>
                      </div>
                      <div className="col-span-1">
                          <label className="text-[10px] text-gray-500 font-black uppercase mb-2 block tracking-widest">SKU / Código</label>
                          <input className="w-full bg-[#050505] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-white font-mono" value={newProduct.sku} onChange={e=>setNewProduct({...newProduct, sku:e.target.value})} placeholder="Opcional"/>
                      </div>
                      <div className="col-span-2">
                          <label className="text-[10px] text-gray-500 font-black uppercase mb-2 block tracking-widest">Categoría</label>
                          <select required className="w-full bg-[#050505] border border-white/10 rounded-2xl p-5 text-white outline-none focus:border-white font-black uppercase text-xs appearance-none" value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category:e.target.value})}>
                              <option value="" disabled>Seleccionar Grupo</option>
                              {categories.filter(c => c !== "Todos").map(c => <option key={c} value={c}>{c}</option>)}
                              <option value="General">General</option>
                          </select>
                      </div>
                      <div className="col-span-2 pt-6 flex gap-4">
                          <button type="button" onClick={()=>setIsProductModalOpen(false)} className="flex-1 py-5 text-[11px] font-black text-gray-500 uppercase tracking-widest transition-all">Cancelar</button>
                          <button type="submit" className="flex-[2] bg-white text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-gray-200 transition-all active:scale-95">Guardar en Base de Datos</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}