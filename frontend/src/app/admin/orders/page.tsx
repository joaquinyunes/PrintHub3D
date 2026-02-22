"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, CheckCircle2, X, Loader2, Trash2, Package, 
  FileText, Link as LinkIcon, Factory,
  PackageCheck, History, MessageCircle, Globe, Store, User,
  Search, AlertTriangle, Pencil, DollarSign, Calendar,
  MessageSquare, Flame, ShoppingCart, Calculator, Wrench, Coins
} from "lucide-react";
import { apiUrl } from "@/lib/api";

// --- 1. INTERFACES Y TIPOS ---
interface Product { _id: string; name: string; price: number; stock: number; }
interface OrderItem { productId?: string; productName: string; quantity: number; price: number; isCustom?: boolean; }
interface OrderFile { name: string; url: string; }
interface Order { 
    _id: string; clientName: string; origin?: string; paymentMethod?: string; 
    deposit?: number; notes?: string; total: number; 
    status: string; createdAt: string; items: OrderItem[]; isSaleRegistered?: boolean;
    dueDate?: string; files?: OrderFile[]; chatLink?: string;
}
interface StoredUser { token: string; }

// --- 2. CONFIGURACIÓN VISUAL ---
const ORIGIN_CONFIG: Record<string, { color: string, icon: any }> = {
    "Local": { color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Store },
    "Instagram": { color: "text-pink-400 bg-pink-500/10 border-pink-500/20", icon: Globe },
    "WhatsApp": { color: "text-green-400 bg-green-500/10 border-green-500/20", icon: MessageCircle },
    "Facebook": { color: "text-blue-500 bg-blue-600/10 border-blue-600/20", icon: Globe },
    "Web": { color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: Globe },
    "Recomendación": { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: User }
};
const ORIGINS = Object.keys(ORIGIN_CONFIG);
const PAYMENTS = ["Efectivo", "Transferencia", "Débito", "Crédito", "USDT", "MercadoPago"];

const TABS = [
    { id: 'production', label: 'EN PRODUCCIÓN', description: 'Pendientes y en proceso', icon: Factory, color: 'text-blue-400', statuses: ['pending', 'in_progress'] },
    { id: 'ready', label: 'LISTOS PARA RETIRAR', description: 'Finalizados en espera', icon: PackageCheck, color: 'text-emerald-400', statuses: ['completed'] },
    { id: 'history', label: 'HISTORIAL', description: 'Entregados y cancelados', icon: History, color: 'text-gray-400', statuses: ['delivered', 'cancelled'] },
];

const STATUSES = [
  { value: "pending", label: "PENDIENTE", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
  { value: "in_progress", label: "EN PROCESO", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  { value: "completed", label: "TERMINADO", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "delivered", label: "ENTREGADO", color: "text-gray-400 bg-gray-500/10 border-gray-500/20" },
  { value: "cancelled", label: "CANCELADO", color: "text-red-400 bg-red-500/10 border-red-500/20" },
];

export default function OrderListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<StoredUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // UI
  const [activeTab, setActiveTab] = useState<'production' | 'ready' | 'history'>('production');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [deliverOrder, setDeliverOrder] = useState<Order | null>(null);
  const [finalCost, setFinalCost] = useState("");

  // Form
  const [formData, setFormData] = useState({ clientName: "", origin: "Local", paymentMethod: "Efectivo", deposit: "", notes: "", dueDate: "", chatLink: "" });
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [tempFile, setTempFile] = useState({ name: "", url: "" });
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [itemTab, setItemTab] = useState<"product" | "custom">("product"); 
  const [itemInput, setItemInput] = useState({ id: "", qty: 1, customName: "", customPrice: "" });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/admin/login"); return; }
    const currentSession = JSON.parse(stored);
    setSession(currentSession);
    const loadData = async () => {
        try {
            const [resO, resP] = await Promise.all([
                fetch(apiUrl("/api/orders"), { headers: { Authorization: `Bearer ${currentSession.token}` } }),
                fetch(apiUrl("/api/products"), { headers: { Authorization: `Bearer ${currentSession.token}` } })
            ]);
            if(resO.ok) setOrders(await resO.json());
            if(resP.ok) setProducts(await resP.json());
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadData();
  }, [router]);

  // --- LÓGICA DE AGRUPACIÓN (MANTENIDA) ---
  const getGroupedOrders = () => {
      const currentTabInfo = TABS.find(t => t.id === activeTab);
      let filtered = orders.filter(o => {
          const matchesStatus = currentTabInfo?.statuses.includes(o.status);
          const matchesSearch = (o.clientName || "").toLowerCase().includes(searchTerm.toLowerCase());
          return matchesStatus && matchesSearch;
      });

      filtered.sort((a, b) => {
          if (activeTab === 'production') {
              if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
              if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
          }
          if (activeTab === 'history') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
          return dateA - dateB;
      });

      const groups: Record<string, Order[]> = {};
      filtered.forEach(order => {
          let key = "📂 SIN FECHA ASIGNADA";
          if (order.dueDate) {
              const dateStr = typeof order.dueDate === 'string' ? order.dueDate.split('T')[0] : '';
              if(dateStr) {
                  const [y, m, d] = dateStr.split('-').map(Number);
                  const orderDate = new Date(y, m - 1, d);
                  const today = new Date(); today.setHours(0,0,0,0);
                  const checkDate = new Date(orderDate); checkDate.setHours(0,0,0,0);
                  const diffTime = checkDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (activeTab === 'history') key = `📅 ${orderDate.toLocaleDateString('es-AR')}`;
                  else {
                      if (diffDays < 0) key = "⚠️ VENCIDOS";
                      else if (diffDays === 0) key = "🔥 PARA HOY";
                      else if (diffDays === 1) key = "🚀 PARA MAÑANA";
                      else key = `📅 ${orderDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
                  }
              }
          }
          if (!groups[key]) groups[key] = [];
          groups[key].push(order);
      });
      return groups;
  };

  const groupedOrders = getGroupedOrders();
  const sortedGroupKeys = Object.keys(groupedOrders).sort((a, b) => {
      const priority: Record<string, number> = { "⚠️": 1, "🔥": 2, "🚀": 3, "📅": 4, "📂": 5 };
      const getPrio = (k: string) => priority[k.split(' ')[0]] || 4;
      return getPrio(a) - getPrio(b);
  });

  // --- ACTIONS ---
  const handleSaveOrder = async () => {
      if(!formData.clientName || cart.length === 0) return;
      const finalDueDate = formData.dueDate ? formData.dueDate : null;
      const payload = { ...formData, dueDate: finalDueDate, deposit: Number(formData.deposit) || 0, items: cart, files, total: cart.reduce((acc, i) => acc + (i.price * i.quantity), 0) };
      const url = editingOrderId ? apiUrl(`/api/orders/${editingOrderId}`) : apiUrl("/api/orders");
      const method = editingOrderId ? "PUT" : "POST";
      try {
          const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.token}` }, body: JSON.stringify(payload) });
          if(res.ok) {
              const saved = await res.json();
              if(editingOrderId) setOrders(orders.map(o => o._id === saved._id ? saved : o));
              else setOrders([saved, ...orders]);
              setIsModalOpen(false);
          }
      } catch(e) { console.error(e); }
  };

  const confirmDelivery = async () => {
      if(!deliverOrder || !session) return;
      try {
          const res = await fetch(apiUrl(`/api/orders/${deliverOrder._id}/register-sale`), {
              method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
              body: JSON.stringify({ finalCost: Number(finalCost) || 0 })
          });
          if(res.ok) {
              const { order } = await res.json();
              setOrders(orders.map(o => o._id === order._id ? order : o));
              setIsDeliverModalOpen(false);
          }
      } catch(e) { console.error(e); }
  };

  const changeStatus = async (id: string, status: string) => {
      if(status === 'delivered') {
          const o = orders.find(x => x._id === id);
          if(o) { setDeliverOrder(o); setFinalCost(""); setIsDeliverModalOpen(true); return; }
      }
      setOrders(orders.map(o => o._id === id ? { ...o, status } : o));
      await fetch(apiUrl(`/api/orders/${id}/status`), {
          method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.token}` },
          body: JSON.stringify({ status })
      });
  };

  const markAsPaid = async (order: Order) => {
      if(!confirm("¿Saldar deuda?")) return;
      try {
          const res = await fetch(apiUrl(`/api/orders/${order._id}`), {
              method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.token}` },
              body: JSON.stringify({ deposit: order.total }) 
          });
          if(res.ok) {
              const updated = await res.json();
              setOrders(orders.map(o => o._id === updated._id ? updated : o));
          }
      } catch(e) { console.error(e); }
  };

  // --- FORM HELPERS ---
  const openNew = () => { setEditingOrderId(null); setFormData({clientName:"", origin:"Local", paymentMethod:"Efectivo", deposit:"", notes:"", dueDate:"", chatLink: ""}); setFiles([]); setCart([]); setTempFile({name:"", url:""}); setIsModalOpen(true); };
  const openEdit = (o: Order) => { setEditingOrderId(o._id); setFormData({clientName:o.clientName, origin:o.origin||"Local", paymentMethod:o.paymentMethod||"Efectivo", deposit:String(o.deposit||0), notes:o.notes||"", dueDate: o.dueDate ? o.dueDate.split('T')[0] : "", chatLink: o.chatLink || "" }); setCart(o.items); setFiles(o.files||[]); setTempFile({name:"", url:""}); setIsModalOpen(true); };
  const handleAddFile = () => { if(tempFile.name && tempFile.url) { setFiles([...files, tempFile]); setTempFile({name:"", url:""}); } };
  
  const handleAddItem = () => {
      if(itemTab === "product"){
          const p = products.find(x => x._id === itemInput.id);
          if(p && itemInput.qty > 0) { setCart([...cart, { productId: p._id, productName: p.name, price: p.price, quantity: itemInput.qty, isCustom: false }]); setItemInput({ ...itemInput, qty: 1 }); }
      } else {
          if(itemInput.customName && itemInput.customPrice) { setCart([...cart, { productName: itemInput.customName, price: Number(itemInput.customPrice), quantity: 1, isCustom: true }]); setItemInput({ ...itemInput, customName: "", customPrice: "" }); }
      }
  };
  const calculateTotal = () => cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  if(loading) return <div className="flex h-screen items-center justify-center bg-[#050505] text-white"><Loader2 className="animate-spin text-blue-500 h-10 w-10"/></div>;

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white font-sans selection:bg-blue-500/30">
      <div className="mx-auto max-w-7xl">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-6">
            <div>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-white tracking-tighter mb-2" style={{textShadow: "0px 0px 30px rgba(59,130,246,0.3)"}}>
                    PEDIDOS
                </h1>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] pl-1">Centro de Comando</p>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative group flex-1 md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 h-4 w-4 transition-colors" />
                    <input type="text" placeholder="BUSCAR..." className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-xs font-bold text-white outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all uppercase tracking-wider" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={openNew} className="bg-white text-black px-8 py-4 rounded-full font-black flex items-center gap-3 hover:bg-blue-50 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 text-xs uppercase tracking-widest whitespace-nowrap">
                    <Plus className="h-5 w-5" /> <span className="hidden md:inline">Nuevo Pedido</span>
                </button>
            </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-12 border-b border-white/10 pb-1 overflow-x-auto">
            {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const count = orders.filter(o => tab.statuses.includes(o.status)).length;
                return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative pb-4 px-6 text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-3 group min-w-fit ${isActive ? 'text-white' : 'text-gray-600 hover:text-gray-300'}`}>
                        <tab.icon className={`h-5 w-5 ${isActive ? tab.color : 'text-gray-600 group-hover:text-gray-400'}`}/>
                        <div className="flex flex-col items-start"><span>{tab.label}</span><span className="text-[9px] normal-case opacity-50 font-medium tracking-normal">{tab.description}</span></div>
                        {count > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-black' : 'bg-white/10 text-gray-500'}`}>{count}</span>}
                        {isActive && <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${tab.color.split('-')[1]}-500 to-transparent shadow-[0_-5px_10px_${tab.color.split('-')[1]}]`}/>}
                    </button>
                )
            })}
        </div>

        {/* LISTA */}
        <div className="space-y-16 pb-20">
            {Object.keys(groupedOrders).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30"><Package size={64} className="mb-4 text-gray-500"/><p className="text-gray-500 text-sm font-bold uppercase tracking-widest">No hay pedidos en esta sección</p></div>
            ) : (
                sortedGroupKeys.map((dateLabel) => (
                    <div key={dateLabel} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`h-px flex-1 ${dateLabel.includes("VENCIDOS") ? "bg-red-500/50" : "bg-white/10"}`}></div>
                            <h3 className={`text-xl font-black uppercase tracking-tight flex items-center gap-3 ${dateLabel.includes("VENCIDOS") ? "text-red-500 animate-pulse" : dateLabel.includes("HOY") ? "text-yellow-400" : "text-white"}`}>{dateLabel.includes("VENCIDOS") && <AlertTriangle className="h-6 w-6"/>}{dateLabel}</h3>
                            <div className={`h-px flex-1 ${dateLabel.includes("VENCIDOS") ? "bg-red-500/50" : "bg-white/10"}`}></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {groupedOrders[dateLabel].map(order => <OrderCard key={order._id} order={order} activeTab={activeTab} onEdit={() => openEdit(order)} onDeliver={() => { setDeliverOrder(order); setFinalCost(""); setIsDeliverModalOpen(true); }} onStatusChange={changeStatus} onPay={() => markAsPaid(order)}/>)}
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* MODAL ENTREGA */}
        {isDeliverModalOpen && deliverOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"><div className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]"><h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> Confirmar Entrega</h2><p className="text-xs text-gray-500 mb-6 leading-relaxed">El pedido se marcará como entregado y se guardará en ventas.</p><div className="bg-[#141414] p-5 rounded-xl border border-white/5 mb-6 space-y-4"><div className="flex justify-between text-sm"><span className="text-gray-400 font-medium">Total Venta</span><span className="font-bold text-white">${(deliverOrder.total??0).toLocaleString()}</span></div><div><label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-2">Costo Real (Luz + Material)</label><input autoFocus type="number" className="w-full bg-black/50 border border-white/10 rounded-lg py-3 pl-4 text-white outline-none focus:border-blue-500 transition-all font-bold" placeholder="0" value={finalCost} onChange={e => setFinalCost(e.target.value)} /></div><div className="border-t border-white/5 pt-3 flex justify-between text-sm"><span className="text-gray-400">Ganancia Neta</span><span className={`font-bold ${((deliverOrder.total??0) - Number(finalCost)) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>${((deliverOrder.total??0) - Number(finalCost)).toLocaleString()}</span></div></div><div className="flex gap-3"><button onClick={() => setIsDeliverModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">Cancelar</button><button onClick={confirmDelivery} className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-green-900/20">Confirmar</button></div></div></div>
        )}

        {/* --- MODAL NUEVO/EDITAR PEDIDO (REDISEÑADO) --- */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                <div className="w-full max-w-6xl bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#141414]">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                            {editingOrderId ? <Pencil className="text-yellow-500 h-6 w-6"/> : <Plus className="text-blue-500 h-6 w-6"/>} 
                            {editingOrderId ? "Editar Pedido" : "Nueva Orden"}
                        </h2>
                        <button onClick={()=>setIsModalOpen(false)}><X className="h-6 w-6 text-gray-500 hover:text-white transition-colors"/></button>
                    </div>
                    <div className="p-8 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* IZQUIERDA: DATOS CLIENTE */}
                        <div className="lg:col-span-5 space-y-8">
                            <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 space-y-6">
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">Cliente</label><input className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" value={formData.clientName} onChange={e=>setFormData({...formData, clientName: e.target.value})} placeholder="Nombre completo" autoFocus/></div>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-widest flex items-center gap-2"><MessageSquare size={12}/> Link del Chat</label><input className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-gray-300 outline-none focus:border-blue-500" placeholder="https://web.whatsapp.com/..." value={formData.chatLink} onChange={e=>setFormData({...formData, chatLink: e.target.value})}/></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">Origen</label><select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" value={formData.origin} onChange={e=>setFormData({...formData, origin: e.target.value})}>{ORIGINS.map(o=><option key={o} value={o} className="bg-black">{o}</option>)}</select></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">Pago</label><select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500" value={formData.paymentMethod} onChange={e=>setFormData({...formData, paymentMethod: e.target.value})}>{PAYMENTS.map(p=><option key={p} value={p} className="bg-black">{p}</option>)}</select></div>
                                </div>
                            </div>
                            
                            <div><label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 block">Fecha de Entrega</label><input type="date" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-purple-500" value={formData.dueDate} onChange={e=>setFormData({...formData, dueDate: e.target.value})} /></div>
                            
                            <div>
                                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 block">Archivos</label>
                                <div className="flex gap-2 mb-2"><input placeholder="Nombre" className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white" value={tempFile.name} onChange={e=>setTempFile({...tempFile, name: e.target.value})}/><input placeholder="Link" className="flex-1 bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white" value={tempFile.url} onChange={e=>setTempFile({...tempFile, url: e.target.value})}/><button onClick={handleAddFile} className="bg-purple-600 p-3 rounded-xl text-white"><Plus/></button></div>
                                <div className="space-y-1">{files.map((f, i) => (<div key={i} className="flex justify-between bg-white/5 p-2 rounded text-xs"><span className="text-gray-300">{f.name}</span><button onClick={()=>setFiles(files.filter((_, idx)=>idx!==i))} className="text-red-400"><X size={12}/></button></div>))}</div>
                            </div>
                            <textarea className="w-full bg-black border border-white/10 rounded-xl p-4 text-white h-24 outline-none resize-none focus:border-white/30" value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} placeholder="Notas..." />
                        </div>

                        {/* DERECHA: CARRITO VISUALMENTE MEJORADO */}
                        <div className="lg:col-span-7 flex flex-col h-full lg:pl-10 lg:border-l border-white/5">
                            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2"><ShoppingCart size={14}/> Carrito de Compra</h3>
                            
                            {/* Selector Tipo Item */}
                            <div className="flex bg-[#141414] p-1.5 rounded-2xl mb-6 border border-white/5 w-fit">
                                <button onClick={()=>setItemTab("product")} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${itemTab==="product"?"bg-blue-600 text-white shadow-lg":"text-gray-500 hover:text-white hover:bg-white/5"}`}><Package size={14}/> PRODUCTO</button>
                                <button onClick={()=>setItemTab("custom")} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${itemTab==="custom"?"bg-purple-600 text-white shadow-lg":"text-gray-500 hover:text-white hover:bg-white/5"}`}><Wrench size={14}/> SERVICIO</button>
                            </div>

                            {/* Inputs Agregar Item */}
                            <div className="flex gap-2 mb-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                                {itemTab==="product" ? (
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4"/>
                                        <select className="w-full bg-transparent border-none pl-9 py-3 text-sm text-white outline-none appearance-none" value={itemInput.id} onChange={e=>setItemInput({...itemInput, id: e.target.value})}>
                                            <option value="" className="bg-black">Seleccionar producto...</option>
                                            {products.map(p=><option key={p._id} value={p._id} className="bg-black">{p.name} (${p.price})</option>)}
                                        </select>
                                    </div>
                                ):(
                                    <input className="flex-1 bg-transparent border-none px-4 py-3 text-sm text-white outline-none" placeholder="Descripción del servicio..." value={itemInput.customName} onChange={e=>setItemInput({...itemInput, customName: e.target.value})}/>
                                )}
                                
                                {itemTab==="custom" && <div className="relative w-32 border-l border-white/10"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span><input type="number" className="w-full bg-transparent border-none pl-6 py-3 text-white outline-none" placeholder="Precio" value={itemInput.customPrice} onChange={e=>setItemInput({...itemInput, customPrice: e.target.value})}/></div>}
                                
                                <div className="w-20 border-l border-white/10"><input type="number" className="w-full bg-transparent border-none py-3 text-center text-white outline-none" value={itemInput.qty} onChange={e=>setItemInput({...itemInput, qty: Number(e.target.value)})}/></div>
                                
                                <button onClick={handleAddItem} className="bg-white text-black px-4 rounded-xl hover:bg-gray-200 transition-colors font-bold"><Plus size={18}/></button>
                            </div>

                            {/* Lista Carrito */}
                            <div className="flex-1 bg-[#141414] rounded-2xl border border-white/5 overflow-hidden flex flex-col mb-6">
                                <div className="overflow-y-auto flex-1 custom-scrollbar p-3 space-y-2">
                                    {cart.map((i,idx)=>(
                                        <div key={idx} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5 hover:border-white/20 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl ${i.isCustom?'bg-purple-500/20 text-purple-400':'bg-blue-500/20 text-blue-400'}`}>{i.isCustom?<Wrench size={16}/>:<Package size={16}/>}</div>
                                                <div><p className="font-bold text-sm text-white">{i.productName}</p><p className="text-xs text-gray-500 font-mono">{i.quantity} x ${i.price.toLocaleString()}</p></div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-mono text-white font-bold text-lg">${(i.price * i.quantity).toLocaleString()}</span>
                                                <button onClick={()=>setCart(cart.filter((_,x)=>x!==idx))} className="text-gray-600 hover:text-red-400 bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {cart.length === 0 && <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-30 gap-2"><ShoppingCart size={40}/><p className="text-xs uppercase tracking-widest">Carrito vacío</p></div>}
                                </div>
                            </div>
                            
                            {/* Panel Totales */}
                            <div className="bg-gradient-to-br from-[#1a1a1a] to-black p-6 rounded-3xl border border-white/10 space-y-4 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5"><Calculator size={100}/></div>
                                <div className="flex justify-between items-center"><span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Estimado</span><span className="text-4xl font-black text-white tracking-tighter">${calculateTotal().toLocaleString()}</span></div>
                                <div className="h-px bg-white/10 w-full"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Coins size={14}/> Seña / Anticipo</span>
                                    <div className="flex items-center gap-1 bg-yellow-500/10 px-3 rounded-lg border border-yellow-500/20"><span className="text-yellow-500 font-bold">$</span><input type="number" className="bg-transparent text-right w-24 text-lg text-yellow-500 font-bold outline-none py-2" value={formData.deposit} onChange={e=>setFormData({...formData, deposit: e.target.value})} placeholder="0"/></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-white/10 bg-[#141414] flex justify-end gap-3 rounded-b-3xl">
                        <button onClick={()=>setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors">Cancelar</button>
                        <button onClick={handleSaveOrder} className="bg-white text-black px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 flex items-center gap-2"><CheckCircle2 size={16}/> Guardar Orden</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

// --- SUBCOMPONENTE DE TARJETA ---
function OrderCard({ order, activeTab, onEdit, onDeliver, onStatusChange, onPay }: any) {
    const originConf = ORIGIN_CONFIG[order.origin || "Local"] || ORIGIN_CONFIG["Local"];
    const OriginIcon = originConf.icon;
    const balance = (order.total??0) - (order.deposit??0);
    const statusInfo = STATUSES.find(s => s.value === order.status) || STATUSES[0];
    
    // Efecto "En Proceso"
    const isPrinting = order.status === 'in_progress';
    const cardStyle = isPrinting 
        ? "bg-gradient-to-br from-orange-900/20 to-[#0f0f0f] border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)] animate-pulse-slow" 
        : "bg-[#0f0f0f] border-white/5 shadow-xl hover:border-white/20 hover:bg-[#141414]";

    return (
        <div className={`rounded-3xl p-6 relative group transition-all duration-500 border ${cardStyle}`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isPrinting ? 'bg-orange-500 shadow-[0_0_15px_#f97316]' : order.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : order.status === 'delivered' ? 'bg-gray-500' : 'bg-yellow-500'}`}/>
            
            <div className="flex justify-between items-start mb-4 pl-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1.5 rounded-lg ${originConf.color} bg-opacity-20`}>
                            <OriginIcon size={12} className="text-current"/>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{order.origin}</span>
                    </div>
                    <h4 className="font-bold text-white text-lg line-clamp-1">{order.clientName}</h4>
                    {/* FECHA */}
                    {order.dueDate && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                            <Calendar size={12} className={new Date(order.dueDate) < new Date() ? "text-red-500" : "text-gray-500"}/>
                            {new Date(order.dueDate).toLocaleDateString()}
                        </div>
                    )}
                    {/* LINK CHAT */}
                    {order.chatLink && (
                        <a href={order.chatLink} target="_blank" className="mt-2 flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider hover:underline w-fit">
                            <MessageSquare size={12}/> Ir al chat
                        </a>
                    )}
                </div>
                <div className="text-right">
                    <div className="text-xl font-black text-white">${(order.total??0).toLocaleString()}</div>
                    {balance > 0 ? (
                        <button onClick={onPay} className="text-[10px] text-red-400 font-bold uppercase bg-red-500/10 px-2 py-0.5 rounded hover:bg-red-500/20 transition-colors flex items-center gap-1 ml-auto">
                            Resta ${balance.toLocaleString()} <DollarSign size={8}/>
                        </button>
                    ) : (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 ml-auto">
                            <CheckCircle2 size={10}/> Pagado
                        </span>
                    )}
                </div>
            </div>

            {/* SI ESTÁ IMPRIMIENDO */}
            {isPrinting && (
                <div className="mb-4 pl-3 flex items-center gap-2 text-orange-500 font-black uppercase text-xs tracking-widest animate-pulse">
                    <Flame size={14}/> Imprimiendo en curso...
                </div>
            )}

            <div className="bg-black/30 rounded-xl p-3 mb-4 space-y-2 border border-white/5 pl-3 min-h-[60px]">
                {order.items.slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs text-gray-300">
                        <span className="truncate max-w-[150px]">{item.productName}</span>
                        <span className="font-bold text-white bg-white/10 px-1.5 rounded">{item.quantity}x</span>
                    </div>
                ))}
                {order.items.length > 3 && <p className="text-[10px] text-center text-gray-500 italic">+ {order.items.length - 3} más</p>}
            </div>

            {(order.notes || (order.files && order.files.length > 0)) && (
                <div className="mb-4 pl-3 flex gap-2">
                    {order.notes && <div className="bg-yellow-500/10 text-yellow-500 p-1.5 rounded-lg border border-yellow-500/20" title={order.notes}><FileText size={14}/></div>}
                    {order.files?.map((f:any, i:number) => <a key={i} href={f.url} target="_blank" className="bg-blue-500/10 text-blue-400 p-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-colors"><LinkIcon size={14}/></a>)}
                </div>
            )}

            <div className="flex gap-2 pl-3">
                <button onClick={onEdit} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition-colors border border-white/5 uppercase tracking-wider">
                    Editar
                </button>
                
                {activeTab === 'production' && (
                    <button onClick={() => onStatusChange(order._id, order.status === 'in_progress' ? 'completed' : 'in_progress')} 
                        className={`flex-[2] py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 uppercase tracking-wider
                        ${order.status === 'in_progress' 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' 
                            : 'bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border-orange-500/30'
                        }`}>
                        {order.status === 'in_progress' ? <><CheckCircle2 size={14}/> Terminar</> : <><Factory size={14}/> Imprimir</>}
                    </button>
                )}

                {activeTab === 'ready' && !order.isSaleRegistered && (
                    <button onClick={onDeliver} className="flex-[2] py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 uppercase tracking-wider">
                        <PackageCheck size={16}/> ENTREGAR
                    </button>
                )}

                {activeTab === 'history' && (
                    <span className={`flex-[2] py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-center border ${statusInfo.color} border-opacity-30`}>
                        {statusInfo.label}
                    </span>
                )}
            </div>
        </div>
    )
}