"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Printer as PrinterIcon, Play, Plus, Trash2, Zap, 
  CheckCircle2, Package, Clock, Truck, AlertTriangle, Calendar,
  FileText, Timer, Activity, Flame
} from "lucide-react";
import { apiUrl } from "@/lib/api";

// --- COMPONENTE: CRONÓMETRO INTERNO ---
function CountdownTimer({ start, minutes }: { start: string, minutes: number }) {
    const [timeLeft, setTimeLeft] = useState("...");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const startTime = new Date(start).getTime();
            const durationMs = minutes * 60 * 1000;
            const targetTime = startTime + durationMs;
            const now = new Date().getTime();
            const diff = targetTime - now;

            const elapsed = now - startTime;
            const percent = Math.min((elapsed / durationMs) * 100, 100);
            setProgress(percent);

            if (diff <= 0) {
                setTimeLeft("FINALIZADO");
            } else {
                const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [start, minutes]);

    return (
        <div className="w-full mt-4 bg-black/40 p-3 rounded-xl border border-white/5 relative overflow-hidden">
            <div className="flex justify-between items-center text-[10px] font-bold mb-2 uppercase tracking-widest text-cyan-400/80">
                <span className="flex items-center gap-1.5"><Timer size={12}/> Tiempo Restante</span>
                <span className="font-mono text-white/90">{timeLeft}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-cyan-500/60 transition-all duration-1000 ease-linear" 
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

// --- INTERFACES ---
interface Order {
  _id: string;
  clientName: string;
  items: any[];
  status: string;
  printTimeMinutes?: number;
  startedAt?: string;
  dueDate?: string;
  files?: { name: string; url: string }[];
  deposit?: number;
  createdAt?: string;
}

interface Printer { _id: string; name: string; model: string; status: 'idle' | 'printing' | 'maintenance'; }

const sortForProduction = (list: Order[]) => {
  return [...list].sort((a, b) => {
    const aDeposit = Number(a.deposit || 0);
    const bDeposit = Number(b.deposit || 0);
    const aHasDeposit = aDeposit > 0;
    const bHasDeposit = bDeposit > 0;

    if (aHasDeposit !== bHasDeposit) {
      return aHasDeposit ? -1 : 1;
    }

    const aDate = a.dueDate
      ? new Date(a.dueDate).getTime()
      : a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;
    const bDate = b.dueDate
      ? new Date(b.dueDate).getTime()
      : b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

    return aDate - bDate;
  });
};

export default function ProductionPage() {
  const router = useRouter();
  const [session, setSession] = useState<{token: string} | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [newPrinterName, setNewPrinterName] = useState("");
  const [startConfig, setStartConfig] = useState({ printerId: "", minutes: "60" });

  const fetchData = async (token: string) => {
    try {
      const [resOrders, resPrinters] = await Promise.all([
        fetch(apiUrl('/api/orders'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/printers'), { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resOrders.ok) {
          const data = await resOrders.json();
          const ordersData = Array.isArray(data)
            ? data
            : Array.isArray((data as any)?.items)
              ? (data as any).items
              : [];
          setOrders(ordersData);
      }
      if (resPrinters.ok) setPrinters(await resPrinters.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/admin/login"); return; }
    const currentSession = JSON.parse(stored);
    setSession(currentSession);
    fetchData(currentSession.token);
    const interval = setInterval(() => fetchData(currentSession.token), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const openStartModal = (orderId: string) => {
    setSelectedOrder(orderId);
    setStartConfig({ printerId: "", minutes: "60" });
    setIsStartModalOpen(true);
  };

  const confirmStart = async () => {
    if (!selectedOrder || !startConfig.printerId) return alert("Selecciona una impresora");
    try {
        await fetch(apiUrl(`/api/orders/${selectedOrder}/status`), {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token}` },
            body: JSON.stringify({ 
                status: 'in_progress', 
                printTimeMinutes: Number(startConfig.minutes), 
                printerId: startConfig.printerId 
            })
        });
        setIsStartModalOpen(false);
        if (session) fetchData(session.token);
    } catch (error) { console.error(error); }
  };

  const moveOrder = async (orderId: string, nextStatus: string) => {
    if (nextStatus === 'completed' && !confirm("¿Marcar terminado?")) return;
    try {
        await fetch(apiUrl(`/api/orders/${orderId}/status`), {
            method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token}` },
            body: JSON.stringify({ status: nextStatus })
        });
        if (session) fetchData(session.token);
    } catch (error) { console.error(error); }
  };

  const addPrinter = async () => {
    if (!newPrinterName) return;
    try {
        await fetch(apiUrl('/api/printers'), {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.token}` },
            body: JSON.stringify({ name: newPrinterName, model: 'Genérica' })
        });
        setNewPrinterName(""); setIsPrinterModalOpen(false);
        if (session) fetchData(session.token);
    } catch (error) { console.error(error); }
  };

  const deletePrinter = async (id: string) => {
    if(!confirm("¿Borrar?")) return;
    try {
        await fetch(apiUrl(`/api/printers/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${session?.token}` }});
        if (session) fetchData(session.token);
    } catch (error) { console.error(error); }
  };

  const pending = sortForProduction(
    orders.filter(o => ['pending', 'pendiente'].includes(o.status))
  );
  const printing = sortForProduction(
    orders.filter(o => ['in_progress', 'imprimiendo'].includes(o.status))
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
      
      {/* 🟢 SIDEBAR: IMPRESORAS */}
      <div className="w-80 bg-[#0a0a0a] border-r border-white/5 flex flex-col z-20 shadow-2xl">
         <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <div>
                <h3 className="font-black text-white text-lg tracking-tight uppercase">Impresoras</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Estado de impresoras</p>
            </div>
            <button onClick={() => setIsPrinterModalOpen(true)} className="bg-white/5 p-2.5 rounded-xl hover:bg-white/10 text-white transition-all border border-white/10 active:scale-95"><Plus className="h-4 w-4"/></button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {printers.map(p => {
                const isBusy = p.status === 'printing';
                return (
                    <div key={p._id} className={`p-5 rounded-2xl border transition-all duration-300 ${isBusy ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-[#0f0f0f] border-white/5 hover:border-white/10'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <span className={`font-bold text-base ${isBusy ? 'text-cyan-200/80' : 'text-gray-300'}`}>{p.name}</span>
                                <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">{p.model}</p>
                            </div>
                            <div className={`w-2.5 h-2.5 rounded-full ${isBusy ? 'bg-cyan-500 animate-pulse shadow-[0_0_8px_#22d3ee]' : 'bg-emerald-500/40'}`}></div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${isBusy ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {isBusy ? 'OCUPADA' : 'LIBRE'}
                            </span>
                            {p.status === 'idle' && (
                                <button onClick={() => deletePrinter(p._id)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                            )}
                        </div>
                    </div>
                )
            })}
         </div>
      </div>

      {/* 🟡 ZONA CENTRAL */}
      <div className="flex-1 overflow-x-auto p-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0f172a] via-[#050505] to-[#050505]">
         
         <div className="mb-10">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-white tracking-tighter mb-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                PRODUCCIÓN
            </h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] pl-1">Control de Impresiones</p>
         </div>

         <div className="grid grid-cols-2 gap-10 h-[calc(100vh-180px)] min-w-[800px]">
            <KanbanColumn title="En Cola de Impresión" count={pending.length} color="text-orange-400 border-orange-500/10 bg-orange-500/5">
                {pending.map(o => (
                    <ProductionCard key={o._id} order={o} 
                        action={() => openStartModal(o._id)} label="INICIAR TRABAJO" 
                        btnStyle="bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/5" icon={<Play size={12} fill="black"/>} />
                ))}
            </KanbanColumn>

            <KanbanColumn title="En proceso de impresion" count={printing.length} color="text-cyan-400 border-cyan-500/10 bg-cyan-500/5">
                {printing.map(o => (
                    <ProductionCard key={o._id} order={o} isActive 
                        action={() => moveOrder(o._id, 'completed')} label="FINALIZAR" 
                        btnStyle="bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20" icon={<CheckCircle2 size={14}/>} />
                ))}
            </KanbanColumn>
         </div>
      </div>

      {/* --- MODALES --- */}
      {isPrinterModalOpen && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 w-96 shadow-2xl">
                <h3 className="font-black mb-6 text-white text-xl tracking-tight uppercase">Nueva Máquina</h3>
                <input autoFocus placeholder="Nombre" className="w-full bg-black border border-white/10 rounded-2xl p-4 mb-6 text-sm text-white outline-none focus:border-cyan-500 transition-all font-bold" 
                    value={newPrinterName} onChange={e => setNewPrinterName(e.target.value)} />
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsPrinterModalOpen(false)} className="text-[10px] font-black px-5 py-3 text-gray-500 hover:text-white uppercase tracking-widest">Cancelar</button>
                    <button onClick={addPrinter} className="bg-white text-black text-[10px] font-black px-8 py-3 rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest">Guardar</button>
                </div>
            </div>
         </div>
      )}

      {isStartModalOpen && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 w-[450px] shadow-2xl">
                <h3 className="font-black mb-6 text-white text-xl flex items-center gap-3 tracking-tight uppercase"><Activity className="text-cyan-500"/> Iniciar</h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-2 uppercase font-black tracking-widest">Asignar Terminal</label>
                        <select className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-cyan-500 appearance-none cursor-pointer font-bold"
                            value={startConfig.printerId} onChange={e => setStartConfig({...startConfig, printerId: e.target.value})}>
                            <option value="">-- Seleccionar --</option>
                            {printers.filter(p => p.status === 'idle').map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-2 uppercase font-black tracking-widest">Minutos Estimados</label>
                        <input type="number" className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500 font-mono text-lg"
                            value={startConfig.minutes} onChange={e => setStartConfig({...startConfig, minutes: e.target.value})} />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-10">
                    <button onClick={() => setIsStartModalOpen(false)} className="text-[10px] font-black px-5 py-3 text-gray-500 hover:text-white uppercase tracking-widest">Abortar</button>
                    <button onClick={confirmStart} className="bg-cyan-600 text-white text-[10px] font-black px-10 py-3 rounded-xl hover:bg-cyan-500 shadow-lg shadow-cyan-900/20 uppercase tracking-widest transition-all">Comenzar</button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
}

// --- SUBCOMPONENTES ---
function KanbanColumn({ title, count, children, color }: any) {
    return (
        <div className={`flex flex-col h-full overflow-hidden backdrop-blur-md rounded-[32px] border border-white/5 shadow-2xl ${color.split(' ')[2]}`}>
            <div className={`p-8 border-b border-white/5 flex justify-between items-center`}>
                <h3 className={`font-black text-xs tracking-[0.2em] uppercase ${color.split(' ')[0]}`}>{title}</h3>
                <span className="text-[10px] font-black px-3 py-1 bg-white/5 text-white/80 rounded-lg border border-white/10">{count}</span>
            </div>
            <div className="space-y-6 overflow-y-auto flex-1 custom-scrollbar p-6">
                {children}
                {count === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-700 opacity-20">
                        <Package size={32}/>
                        <span className="text-[10px] font-bold uppercase tracking-widest mt-2 text-center">Sin trabajos en este sector</span>
                    </div>
                )}
            </div>
        </div>
    )
}

function ProductionCard({ order, action, label, btnStyle, icon, isActive }: any) {
    const now = new Date();
    const dueDate = order.dueDate ? new Date(order.dueDate) : null;
    const isOverdue = dueDate && dueDate < now;
    const isToday = dueDate && dueDate.toDateString() === now.toDateString();
    
    let dateBadge = null;
    if (dueDate) {
        if (isOverdue) dateBadge = <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={10}/> Vencido</span>;
        else if (isToday) dateBadge = <span className="text-[9px] bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1"><Flame size={10}/> Hoy</span>;
        else dateBadge = <span className="text-[9px] bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded font-black uppercase tracking-wider flex items-center gap-1"><Calendar size={10}/> {dueDate.toLocaleDateString().slice(0,5)}</span>;
    }

    return (
        <div className={`relative p-6 rounded-[24px] transition-all duration-500 group border
            ${isActive 
                ? 'bg-[#111] border-cyan-500/30 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]' 
                : 'bg-[#0f0f0f] border-white/5 hover:border-white/10 hover:bg-[#121212] shadow-xl'}
        `}>
            {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-px bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]"/>}
            
            <div className="flex justify-between items-start mb-4">
                <div>
                    {dateBadge}
                    <h4 className="font-black text-white text-base mt-3 line-clamp-1 tracking-tight">{order.clientName}</h4>
                    <p className="text-[10px] text-gray-600 font-mono mt-0.5 uppercase tracking-tighter">REF: #{order._id.slice(-6)}</p>
                </div>
                {order.files && order.files.length > 0 && (
                    <a href={order.files[0].url} target="_blank" className="bg-white/5 p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                        <FileText size={16}/>
                    </a>
                )}
            </div>

            <div className="space-y-1.5 mb-6 bg-black/40 p-4 rounded-2xl border border-white/5">
                {order.items.slice(0, 3).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium truncate max-w-[200px]">{item.productName}</span>
                        <span className="font-black text-white/80 bg-white/5 px-2 py-0.5 rounded-md">x{item.quantity}</span>
                    </div>
                ))}
            </div>

            {isActive && order.startedAt && order.printTimeMinutes && (
                <div className="mb-6">
                    <CountdownTimer start={order.startedAt} minutes={order.printTimeMinutes} />
                </div>
            )}

            <button onClick={action} className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase transition-all active:scale-95 ${btnStyle}`}>
                {icon} {label}
            </button>
        </div>
    )
}