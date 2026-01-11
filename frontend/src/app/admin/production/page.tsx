"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle, Package, Truck, Printer as PrinterIcon, Play, Plus, Trash2, Zap } from 'lucide-react';

interface Order {
  _id: string;
  customerName: string;
  items: any[];
  status: string;
  totalAmount: number;
  printTimeMinutes?: number;
  dueDate?: string;
}

interface Printer {
  _id: string;
  name: string;
  model: string;
  status: 'idle' | 'printing' | 'maintenance';
}

export default function ProductionPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [printers, setPrinters] = useState<Printer[]>([]);
  
  // Modales
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  
  // States temporales
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [newPrinterName, setNewPrinterName] = useState("");
  const [startConfig, setStartConfig] = useState({ printerId: "", minutes: "60" });

  const fetchData = async () => {
    try {
      const [resOrders, resPrinters] = await Promise.all([
        fetch('http://localhost:5000/api/orders'),
        fetch('http://localhost:5000/api/printers')
      ]);
      setOrders(await resOrders.json());
      setPrinters(await resPrinters.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- ACCIONES ---

  // 1. Abrir modal para iniciar impresión
  const openStartModal = (orderId: string) => {
    setSelectedOrder(orderId);
    setStartConfig({ printerId: "", minutes: "60" }); // Reset
    setIsStartModalOpen(true);
  };

  // 2. Confirmar inicio (Asignar máquina)
  const confirmStart = async () => {
    if (!selectedOrder || !startConfig.printerId) return alert("Selecciona una impresora");
    
    await fetch(`http://localhost:5000/api/orders/${selectedOrder}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            status: 'imprimiendo', 
            printTimeMinutes: Number(startConfig.minutes),
            printerId: startConfig.printerId 
        })
    });
    setIsStartModalOpen(false);
    fetchData();
  };

  // 3. Mover estado (Terminar / Entregar)
  const moveOrder = async (orderId: string, nextStatus: string) => {
    if (nextStatus === 'terminado' && !confirm("¿Finalizar impresión y liberar máquina?")) return;
    
    await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
    });
    fetchData();
  };

  // 4. Gestión Impresoras
  const addPrinter = async () => {
    if (!newPrinterName) return;
    await fetch('http://localhost:5000/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPrinterName, model: 'Generica' })
    });
    setNewPrinterName("");
    setIsPrinterModalOpen(false);
    fetchData();
  };

  const deletePrinter = async (id: string) => {
    if(!confirm("¿Borrar impresora?")) return;
    await fetch(`http://localhost:5000/api/printers/${id}`, { method: 'DELETE' });
    fetchData();
  };

  // Filtros
  const pending = orders.filter(o => o.status === 'pendiente');
  const printing = orders.filter(o => o.status === 'imprimiendo');
  const finished = orders.filter(o => o.status === 'terminado');

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden">
      
      {/* 🟢 ZONA DE MÁQUINAS (SIDEBAR) */}
      <div className="w-64 bg-black/20 border border-white/10 rounded-xl p-4 flex flex-col">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500"/> Flota</h3>
            <button onClick={() => setIsPrinterModalOpen(true)} className="bg-white/10 p-1.5 rounded hover:bg-white/20"><Plus className="h-4 w-4"/></button>
         </div>
         
         <div className="flex-1 overflow-y-auto space-y-3">
            {printers.map(p => (
                <div key={p._id} className={`p-3 rounded-lg border text-sm relative group ${p.status === 'printing' ? 'bg-blue-900/20 border-blue-500/50' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex justify-between">
                        <span className="font-bold text-white">{p.name}</span>
                        <span className={`w-2 h-2 rounded-full ${p.status === 'printing' ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 uppercase">{p.status === 'idle' ? 'Libre' : 'Ocupada'}</p>
                    {p.status === 'idle' && (
                        <button onClick={() => deletePrinter(p._id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300">
                            <Trash2 className="h-3 w-3" />
                        </button>
                    )}
                </div>
            ))}
            {printers.length === 0 && <p className="text-xs text-center opacity-50">Agrega tu primera impresora +</p>}
         </div>
      </div>

      {/* 🟡 ZONA DE TABLERO (KANBAN) */}
      <div className="flex-1 overflow-x-auto">
         <div className="grid grid-cols-3 gap-4 h-full min-w-[800px]">
            
            {/* 1. PENDIENTES */}
            <div className="bg-black/20 border border-white/5 rounded-xl flex flex-col">
                <div className="p-3 border-b border-white/5 bg-yellow-500/10 text-yellow-500 font-bold text-sm flex justify-between">
                    <span>Pendientes ({pending.length})</span>
                    <Package className="h-4 w-4"/>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                    {pending.map(o => (
                        <div key={o._id} className="bg-card border border-white/10 p-3 rounded shadow-md relative group">
                             <h4 className="font-bold text-sm text-white">{o.customerName}</h4>
                             <p className="text-xs text-gray-400">{o.items.length} items • ${o.totalAmount}</p>
                             <div className="mt-2 flex justify-end">
                                <button onClick={() => openStartModal(o._id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-blue-500 transition">
                                    <Play className="h-3 w-3"/> Imprimir
                                </button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. EN IMPRESIÓN */}
            <div className="bg-black/20 border border-white/5 rounded-xl flex flex-col">
                <div className="p-3 border-b border-white/5 bg-blue-500/10 text-blue-400 font-bold text-sm flex justify-between">
                    <span>Imprimiendo ({printing.length})</span>
                    <PrinterIcon className="h-4 w-4"/>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                    {printing.map(o => (
                        <div key={o._id} className="bg-card border border-blue-500/30 p-3 rounded shadow-md relative">
                             <div className="absolute top-2 right-2 text-blue-400 animate-pulse"><Zap className="h-3 w-3"/></div>
                             <h4 className="font-bold text-sm text-white">{o.customerName}</h4>
                             <p className="text-xs text-blue-200 mt-1">Tiempo: {o.printTimeMinutes} min</p>
                             <div className="mt-2 flex justify-end">
                                <button onClick={() => moveOrder(o._id, 'terminado')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-green-500 transition">
                                    <CheckCircle className="h-3 w-3"/> Terminar
                                </button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. TERMINADOS / ENTREGAR */}
            <div className="bg-black/20 border border-white/5 rounded-xl flex flex-col">
                <div className="p-3 border-b border-white/5 bg-green-500/10 text-green-400 font-bold text-sm flex justify-between">
                    <span>Listos para Entrega ({finished.length})</span>
                    <CheckCircle className="h-4 w-4"/>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                    {finished.map(o => (
                        <div key={o._id} className="bg-card border border-green-500/30 p-3 rounded shadow-md opacity-80 hover:opacity-100 transition">
                             <h4 className="font-bold text-sm text-white">{o.customerName}</h4>
                             <p className="text-xs text-green-200">Esperando retiro</p>
                             <div className="mt-2 flex justify-end">
                                <button onClick={() => moveOrder(o._id, 'entregado')} className="bg-white/10 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1 hover:bg-white/20 transition">
                                    <Truck className="h-3 w-3"/> Entregar
                                </button>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

         </div>
      </div>

      {/* MODALES */}
      {isPrinterModalOpen && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-xl border border-white/10 w-80 shadow-2xl">
                <h3 className="font-bold mb-4 text-white">Nueva Impresora</h3>
                <input autoFocus placeholder="Nombre (Ej: Ender 3)" className="w-full bg-black/50 border border-white/10 rounded p-2 mb-4 text-sm text-white outline-none focus:border-primary" 
                    value={newPrinterName} onChange={e => setNewPrinterName(e.target.value)} />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsPrinterModalOpen(false)} className="text-xs px-3 py-2 text-gray-400 hover:text-white">Cancelar</button>
                    <button onClick={addPrinter} className="bg-primary text-black text-xs font-bold px-3 py-2 rounded hover:bg-primary/90">Guardar</button>
                </div>
            </div>
         </div>
      )}

      {isStartModalOpen && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-card p-6 rounded-xl border border-white/10 w-80 shadow-2xl">
                <h3 className="font-bold mb-4 text-white">Asignar Máquina</h3>
                
                <label className="text-xs text-gray-400 block mb-1">Seleccionar Impresora</label>
                <select className="w-full bg-black/50 border border-white/10 rounded p-2 mb-4 text-sm text-white outline-none focus:border-primary"
                    value={startConfig.printerId} onChange={e => setStartConfig({...startConfig, printerId: e.target.value})}>
                    <option value="">-- Elige una Libre --</option>
                    {printers.filter(p => p.status === 'idle').map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                </select>

                <label className="text-xs text-gray-400 block mb-1">Tiempo Estimado (Min)</label>
                <input type="number" className="w-full bg-black/50 border border-white/10 rounded p-2 mb-6 text-sm text-white outline-none focus:border-primary"
                    value={startConfig.minutes} onChange={e => setStartConfig({...startConfig, minutes: e.target.value})} />

                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsStartModalOpen(false)} className="text-xs px-3 py-2 text-gray-400 hover:text-white">Cancelar</button>
                    <button onClick={confirmStart} className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded hover:bg-blue-500">Comenzar</button>
                </div>
            </div>
         </div>
      )}

    </div>
  );
}