"use client";

import { useEffect, useState } from "react";
import { 
  Printer, Package, Zap, 
  Plus, ArrowRight, 
  DollarSign, Activity, Spool,
  X, Boxes, Bot,
  ListTodo, CheckSquare, Square, Trash2,
  Clock,
  AlertTriangle
} from "lucide-react";
import { apiUrl } from "@/lib/api";

// --- COMPONENTE: TARJETA KPI ---
function StatCard({ title, value, subtext, icon: Icon, color, trend }: any) {
    return (
        <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-white/10 transition-all shadow-lg">
            <div className={`absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform duration-500 ${color.text}`}>
                <Icon size={60} />
            </div>
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.bg}`}/>
            
            <div className="relative z-10">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2 ${color.text}`}>
                    <Icon size={12}/> {title}
                </p>
                <div className="text-3xl font-black text-white tracking-tighter mb-1">
                    {value}
                </div>
                {subtext && (
                    <p className="text-[10px] text-gray-500 font-medium font-mono uppercase tracking-wide">
                        {subtext}
                    </p>
                )}
                {trend !== undefined && (
                    <div className="mt-3 h-1 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className={`h-full ${color.bg} shadow-[0_0_10px_currentColor]`} style={{width: `${trend}%`}}/>
                    </div>
                )}
            </div>
        </div>
    )
}

// --- COMPONENTE: MÓDULO DE IMPRESORA (SUPER SIMPLIFICADO) ---
function PrinterModule({ printer }: { printer: any }) {
    const isPrinting = printer.status === 'printing' || printer.status === 'in_progress';
    
    // Lógica para detectar si ya terminó según el tiempo (opcional para el label)
    const [isTimeUp, setIsTimeUp] = useState(false);

    useEffect(() => {
        if (!isPrinting || !printer.startedAt || !printer.printTimeMinutes) return;

        const checkTime = () => {
            const end = new Date(printer.startedAt).getTime() + (printer.printTimeMinutes * 60 * 1000);
            if (new Date().getTime() >= end) setIsTimeUp(true);
        };

        checkTime();
        const interval = setInterval(checkTime, 10000);
        return () => clearInterval(interval);
    }, [printer, isPrinting]);

    // Determinar Texto y Colores
    let label = "DISPONIBLE";
    let colorClass = "text-emerald-500";
    let bgClass = "border-emerald-500/20 bg-emerald-500/5";
    let dotClass = "bg-emerald-500";

    if (isPrinting) {
        if (isTimeUp) {
            label = "IMPRESIÓN FINALIZADA";
            colorClass = "text-orange-400";
            bgClass = "border-orange-500/30 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.1)]";
            dotClass = "bg-orange-400";
        } else {
            label = "IMPRIMIENDO";
            colorClass = "text-blue-400";
            bgClass = "border-blue-500/20 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]";
            dotClass = "bg-blue-500 animate-ping";
        }
    }

    return (
        <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${bgClass}`}>
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${dotClass}`}/>
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${colorClass}`}>
                            {label}
                        </span>
                    </div>
                    <h4 className="font-bold text-white text-base">{printer.name}</h4>
                    
                    {isPrinting && printer.clientName && (
                        <div className="mt-3 flex items-center gap-2">
                             <div className="bg-white/5 px-2 py-1 rounded text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                                Cliente: <span className="text-white">{printer.clientName}</span>
                             </div>
                        </div>
                    )}
                </div>
                <Printer size={18} className={colorClass} />
            </div>

            {!isPrinting && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Zap size={12}/> Standby - Lista
                    </span>
                </div>
            )}
        </div>
    );
}

// --- COMPONENTE: BOTÓN RÁPIDO ---
function ActionTile({ icon: Icon, label, color, onClick }: any) {
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0f0f0f] border border-white/5 hover:border-white/20 transition-all group active:scale-95 shadow-lg`}>
            <div className={`p-3 rounded-xl mb-2 transition-all group-hover:scale-110 ${color.bg} ${color.text}`}>
                <Icon size={24} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
        </button>
    )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  
  const [stats, setStats] = useState({ pending: 0, printing: 0, ready: 0, revenue: 0, activePrinters: 0, totalPrinters: 0 });
  const [printers, setPrinters] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  
  const [isFilamentModalOpen, setIsFilamentModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [parsedItems, setParsedItems] = useState<{name: string, quantity: number}[]>([]);

  const monthlyGoal = 2000000; 

  const fetchData = async () => {
      try {
          const userStr = localStorage.getItem("user");
          if (!userStr) return;
          const currentSession = JSON.parse(userStr);
          setSession(currentSession);
          const token = currentSession.token;

          const [resO, resP, resT] = await Promise.all([
              fetch(apiUrl("/api/orders"), { headers: { Authorization: `Bearer ${token}` } }),
              fetch(apiUrl("/api/printers"), { headers: { Authorization: `Bearer ${token}` } }),
              fetch(apiUrl("/api/tasks"), { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ ok: false, json: async () => [] }))
          ]);

          if (resO.ok && resP.ok) {
              const orders = await resO.json();
              const printersRaw = await resP.json();
              const tasksData = resT.ok ? await resT.json() : [];

              const activeOrders = orders.filter((o:any) => o.status === 'in_progress');

              const enrichedPrinters = printersRaw.map((p: any) => {
                  const order = activeOrders.find((o:any) => {
                      const pIdInOrder = o.printerId || (o.printer ? o.printer._id : null) || o.printer;
                      return String(pIdInOrder) === String(p._id);
                  });
                  if (order) {
                      return { ...p, status: 'printing', startedAt: order.startedAt, printTimeMinutes: order.printTimeMinutes, clientName: order.clientName };
                  }
                  return p;
              });

              const now = new Date();
              const currentMonth = now.getMonth(); 
              const currentYear = now.getFullYear();

              const monthlyRevenue = orders
                .filter((o:any) => {
                    if (!o.createdAt) return false;
                    const d = new Date(o.createdAt);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.status !== 'cancelled';
                })
                .reduce((acc: number, o:any) => acc + (Number(o.total) || 0), 0);

              setStats({ 
                  pending: orders.filter((o:any) => o.status === 'pending').length, 
                  printing: activeOrders.length, 
                  ready: orders.filter((o:any) => o.status === 'completed').length, 
                  revenue: monthlyRevenue, 
                  activePrinters: activeOrders.length, 
                  totalPrinters: printersRaw.length 
              });
              setPrinters(enrichedPrinters);
              setTasks(tasksData);
          }
      } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
      fetchData();
      const interval = setInterval(fetchData, 10000); 
      return () => clearInterval(interval);
  }, []);

  const handleAddTask = async () => {
      if(!newTaskText.trim()) return;
      try {
          const res = await fetch(apiUrl("/api/tasks"), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
              body: JSON.stringify({ text: newTaskText })
          });
          if(res.ok) { setNewTaskText(""); fetchData(); }
      } catch (e) { console.error(e); }
  };

  const toggleTask = async (id: string, currentStatus: boolean) => {
      try {
          await fetch(apiUrl(`/api/tasks/${id}`), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
              body: JSON.stringify({ completed: !currentStatus })
          });
          fetchData();
      } catch (e) { console.error(e); }
  };

  const deleteTask = async (id: string) => {
      if(!confirm("¿Borrar tarea?")) return;
      try {
          await fetch(apiUrl(`/api/tasks/${id}`), {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${session.token}` }
          });
          fetchData();
      } catch (e) { console.error(e); }
  };

  const parseBulkStock = () => {
      if(!bulkText.trim()) return;
      const lines = bulkText.split('\n');
      const items: any[] = [];
      lines.forEach(line => {
          const clean = line.trim();
          if(!clean) return;
          const match = clean.match(/(\d+)$/); 
          if(match) {
              const quantity = parseInt(match[0]);
              const name = clean.substring(0, match.index).trim();
              if(name) items.push({ name, quantity });
          } else {
              items.push({ name: clean, quantity: 1 });
          }
      });
      setParsedItems(items);
      setBulkText("");
  };

  const confirmStockIngress = async () => {
      if(!session) return;
      try {
          const res = await fetch(apiUrl("/api/products/bulk-stock"), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
              body: JSON.stringify({ items: parsedItems })
          });
          if(res.ok) { alert(`✅ Stock actualizado.`); setParsedItems([]); setIsFilamentModalOpen(false); }
      } catch (error) { console.error(error); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#050505] text-white"><ArrowRight className="animate-spin text-blue-500 h-10 w-10"/></div>;

  const goalPercent = Math.min((stats.revenue / monthlyGoal) * 100, 100);

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white font-sans selection:bg-blue-500/30">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-6">
            <div>
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-white tracking-tighter mb-2">DASHBOARD</h1>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] pl-1">Centro de Comando</p>
            </div>
        </div>

        {/* 1. KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Facturado (Mes)" value={`$${stats.revenue.toLocaleString()}`} subtext={`${goalPercent.toFixed(1)}% de la Meta`} icon={DollarSign} color={{ text: 'text-emerald-400', bg: 'bg-emerald-500' }} trend={goalPercent} />
            <StatCard title="En Cola" value={stats.pending} subtext="Esperando Impresión" icon={Clock} color={{ text: 'text-orange-400', bg: 'bg-orange-500' }} />
            <StatCard title="Produciendo" value={stats.printing} subtext="En Máquinas Ahora" icon={Activity} color={{ text: 'text-blue-400', bg: 'bg-blue-500' }} />
            <StatCard title="Listos" value={stats.ready} subtext="Para Entregar" icon={Package} color={{ text: 'text-purple-400', bg: 'bg-purple-500' }} />
        </div>

        {/* 2. CENTRAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><Activity size={16} className="text-blue-500"/> Monitor de Impresión</h3>
                    <span className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1 bg-[#111] rounded border border-white/5">{printers.length} Unidades</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
                    {printers.map(p => <PrinterModule key={p._id} printer={p} />)}
                    {printers.length === 0 && <div className="col-span-2 py-10 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-600 gap-2"><AlertTriangle/> Sin impresoras conectadas</div>}
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Zap size={16} className="text-yellow-500"/> Acciones Rápidas</h3>
                <div className="grid grid-cols-2 gap-4 flex-1">
                    <ActionTile icon={Plus} label="Nuevo Pedido" color={{bg:'bg-blue-500/10', text:'text-blue-400'}} onClick={() => window.location.href='/admin/orders'} />
                    <ActionTile icon={Spool} label="Cargar Stock" color={{bg:'bg-purple-500/10', text:'text-purple-400'}} onClick={() => { setIsFilamentModalOpen(true); setParsedItems([]); setBulkText(""); }} />
                    <ActionTile icon={Boxes} label="Inventario" color={{bg:'bg-orange-500/10', text:'text-orange-400'}} onClick={() => window.location.href='/admin/products'} />
                    <ActionTile icon={Bot} label="Asistente IA" color={{bg:'bg-emerald-500/10', text:'text-emerald-400'}} onClick={() => alert("Próximamente: IA")} />
                </div>
            </div>
        </div>

        {/* 3. TAREAS PENDIENTES */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2"><ListTodo size={16} className="text-pink-500"/> Tareas del Equipo</h3>
            <div className="flex gap-2 mb-6">
                <input className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500" placeholder="Escribe una tarea para el equipo..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} />
                <button onClick={handleAddTask} className="bg-pink-600 hover:bg-pink-500 text-white px-6 rounded-xl font-bold uppercase text-xs tracking-widest">Agregar</button>
            </div>
            <div className="space-y-2">
                {tasks.length === 0 ? <p className="text-center text-gray-600 text-xs py-4 uppercase tracking-widest">No hay tareas pendientes</p> : tasks.map(task => (
                    <div key={task._id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${task.completed ? 'bg-black/20 border-white/5 opacity-50' : 'bg-[#141414] border-white/10 hover:border-pink-500/30'}`}>
                        <div className="flex items-center gap-4">
                            <button onClick={() => toggleTask(task._id, task.completed)} className={`text-gray-400 hover:text-white transition-colors`}>{task.completed ? <CheckSquare size={20} className="text-pink-500"/> : <Square size={20}/>}</button>
                            <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>{task.text}</span>
                        </div>
                        <button onClick={() => deleteTask(task._id)} className="text-gray-600 hover:text-red-500 transition-colors p-2"><Trash2 size={14}/></button>
                    </div>
                ))}
            </div>
        </div>

        {/* MODAL STOCK */}
        {isFilamentModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
                <div className="w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col max-h-[80vh]">
                    <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2"><Spool className="text-purple-500"/> Ingreso de Stock</h2><button onClick={()=>setIsFilamentModalOpen(false)}><X className="text-gray-500 hover:text-white"/></button></div>
                    {parsedItems.length === 0 ? (
                        <><textarea autoFocus className="w-full bg-black border border-white/10 rounded-xl p-5 text-sm text-white outline-none focus:border-purple-500 font-mono resize-none h-48 mb-4" placeholder={`Gorilon Rojo 3\nPLA Negro 5`} value={bulkText} onChange={e => setBulkText(e.target.value)}/><button onClick={parseBulkStock} className="w-full bg-white text-black font-black uppercase text-xs py-4 rounded-xl hover:bg-gray-200">Procesar</button></>
                    ) : (
                        <><div className="flex-1 overflow-y-auto mb-6 custom-scrollbar bg-[#111] rounded-xl border border-white/5"><table className="w-full text-left"><thead className="bg-[#1a1a1a] text-[10px] uppercase text-gray-500 font-bold"><tr><th className="px-5 py-3">Item</th><th className="px-5 py-3 text-center">Cant.</th><th className="px-5 py-3"></th></tr></thead><tbody className="divide-y divide-white/5">{parsedItems.map((item, i) => (<tr key={i}><td className="px-5 py-3 text-sm font-bold text-white">{item.name}</td><td className="px-5 py-3 text-sm text-center text-purple-400 font-mono">{item.quantity}</td><td className="px-5 py-3 text-right"><button onClick={() => setParsedItems(parsedItems.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-400"><Trash2 size={14}/></button></td></tr>))}</tbody></table></div><div className="flex gap-3"><button onClick={() => setParsedItems([])} className="px-6 py-3 rounded-xl bg-white/5 text-gray-400 text-xs font-bold uppercase hover:bg-white/10">Atrás</button><button onClick={confirmStockIngress} className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase">Confirmar</button></div></>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
