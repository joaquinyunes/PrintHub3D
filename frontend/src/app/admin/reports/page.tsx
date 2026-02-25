"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { 
  DollarSign, TrendingUp, Calendar, Filter, Package, Layers, Loader2, 
  Download, History, ArrowUpRight, Zap
} from "lucide-react";
import { apiUrl } from "@/lib/api";

// Colores Gráficos
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  const [data, setData] = useState<any>(null);

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const stored = localStorage.getItem("user");
      if (!stored) return;
      const session = JSON.parse(stored);

      try {
        const query = `?year=${selectedYear}&month=${selectedMonth}`;
        const res = await fetch(apiUrl(`/api/sales/analytics${query}`), {
          headers: { Authorization: `Bearer ${session.token}` }
        });

        if (res.ok) {
          const result = await res.json();
          // Formatear fechas gráfico
          const formattedChart = result.chartData.map((item: any) => ({
            ...item,
            name: new Date(item._id).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
          }));
          setData({ ...result, chartData: formattedChart });
        }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [selectedYear, selectedMonth]);

  // EXPORTAR A CSV
  const handleExport = () => {
      if(!data || !data.salesHistory) return;
      const csvContent = "data:text/csv;charset=utf-8," 
          + "Fecha,Producto,Categoria,Cantidad,Precio Total,Ganancia\n"
          + data.salesHistory.map((s:any) => 
              `${new Date(s.createdAt).toLocaleDateString()},${s.productName},${s.category},${s.quantity},${s.price},${s.profit||0}`
          ).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `reporte_ventas_${selectedMonth}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);
  const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  if (loading) return (<div className="flex min-h-screen items-center justify-center bg-[#050505] text-white"><Loader2 className="h-10 w-10 animate-spin text-blue-500" /></div>);

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white font-sans selection:bg-blue-500/30">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">REPORTES</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
              Análisis de: <span className="text-white">{selectedMonth === 'all' ? 'Todo el año' : months[Number(selectedMonth)]} {selectedYear}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-[#111] border border-white/10 rounded-xl px-5 py-3 pr-10 text-xs font-bold uppercase outline-none focus:border-blue-500 cursor-pointer hover:bg-[#161616] transition-colors">
                <option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option>
              </select>
              <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none"/>
            </div>
            <div className="relative">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-[#111] border border-white/10 rounded-xl px-5 py-3 pr-10 text-xs font-bold uppercase outline-none focus:border-blue-500 cursor-pointer hover:bg-[#161616] transition-colors">
                <option value="all">Todo el Año</option>
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <Filter className="absolute right-3 top-3 h-4 w-4 text-gray-500 pointer-events-none"/>
            </div>
            <button onClick={handleExport} className="bg-white text-black px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-lg shadow-white/5">
                <Download size={16}/> Exportar
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10 text-white group-hover:scale-110 transition-transform"><DollarSign size={40}/></div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Ingresos Totales</p>
                <div className="text-3xl font-black text-white">{formatMoney(data?.totals?.sales)}</div>
            </div>
            <div className="bg-[#0f0f0f] border border-green-500/20 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute left-0 top-0 w-1 h-full bg-green-500"></div>
                <div className="absolute top-0 right-0 p-6 opacity-10 text-green-500 group-hover:scale-110 transition-transform"><TrendingUp size={40}/></div>
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mb-2">Ganancia Neta</p>
                <div className="text-3xl font-black text-white">{formatMoney(data?.totals?.profit)}</div>
                <div className="text-xs text-green-400 mt-1 font-bold">
                    {data?.totals?.sales ? Math.round((data.totals.profit / data.totals.sales) * 100) : 0}% Margen
                </div>
            </div>
            <div className="bg-[#0f0f0f] border border-blue-500/20 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute left-0 top-0 w-1 h-full bg-blue-500"></div>
                <div className="absolute top-0 right-0 p-6 opacity-10 text-blue-500 group-hover:scale-110 transition-transform"><Package size={40}/></div>
                <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-2">Volumen Ventas</p>
                <div className="text-3xl font-black text-white">{data?.salesHistory?.length || 0}</div>
                <p className="text-xs text-blue-400 mt-1 font-bold">Transacciones</p>
            </div>
        </div>

        {/* GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2"><ArrowUpRight size={16} className="text-blue-500"/> Flujo de Caja</h3>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.chartData}>
                            <defs>
                                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="name" stroke="#444" tick={{fill: '#666', fontSize: 10}} tickLine={false} axisLine={false} />
                            <YAxis stroke="#444" tick={{fill: '#666', fontSize: 10}} tickFormatter={(val) => `$${val}`} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '8px' }} formatter={(val: any) => formatMoney(val)} />
                            <Area type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={3} fill="url(#colorVentas)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2"><Layers size={16} className="text-purple-500"/> Categorías</h3>
                <div className="flex-1 min-h-[250px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data?.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="total">
                                {data?.categoryData?.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: '#000', borderColor: '#222', borderRadius: '8px'}} formatter={(val: any) => formatMoney(val)} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <span className="text-[10px] text-gray-500 font-bold uppercase block">Total</span>
                            <span className="text-lg font-bold text-white">{formatMoney(data?.totals?.sales)}</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    {data?.categoryData?.map((cat: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}/>
                            <span className="text-gray-400 truncate">{cat._id}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- HISTORIAL DE TRANSACCIONES COMPLETO --- */}
        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111]">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2"><History size={18} className="text-orange-500"/> Historial de Transacciones</h3>
                <span className="text-xs bg-white/5 text-gray-400 px-3 py-1 rounded-full border border-white/5 font-mono">{data?.salesHistory?.length || 0} Movimientos</span>
            </div>
            
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[#111] z-10">
                        <tr className="text-[10px] uppercase text-gray-500 font-bold tracking-widest border-b border-white/5">
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Concepto / Producto</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4 text-center">Tipo</th>
                            <th className="px-6 py-4 text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data?.salesHistory?.map((sale: any, i: number) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="text-xs font-mono text-gray-400">{new Date(sale.createdAt).toLocaleDateString()}</div>
                                    <div className="text-[10px] text-gray-600">{new Date(sale.createdAt).toLocaleTimeString()}</div>
                                </td>
                                <td className="px-6 py-4 font-bold text-white text-sm">{sale.productName}</td>
                                <td className="px-6 py-4 text-xs text-gray-400">
                                    <span className="bg-white/5 px-2 py-1 rounded border border-white/5">{sale.category}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {/* Detectamos Origen basado en Categoría o Nombre */}
                                    {sale.category === 'Servicio' || sale.category === 'Impresión' ? (
                                        <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-1 rounded font-bold uppercase tracking-wider flex justify-center items-center gap-1"><Package size={10}/> Pedido</span>
                                    ) : (
                                        <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded font-bold uppercase tracking-wider flex justify-center items-center gap-1"><Zap size={10}/> Stock</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="font-bold text-white">{formatMoney(sale.price)}</div>
                                    <div className="text-[10px] text-emerald-500 font-bold">+{formatMoney(sale.profit)} Net</div>
                                </td>
                            </tr>
                        ))}
                        {(!data?.salesHistory || data.salesHistory.length === 0) && (
                            <tr><td colSpan={5} className="py-12 text-center text-gray-600 text-sm uppercase tracking-widest">Sin transacciones</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}