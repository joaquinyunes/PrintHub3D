"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { 
  DollarSign, TrendingUp, Calendar, Layers, Loader2, 
  Download, Zap, ArrowUpRight, Archive, Search, ChevronRight, 
  Boxes, LayoutGrid, Clock, ShoppingCart, BarChart3, ChevronDown, MousePointer2
} from "lucide-react";
import { apiUrl } from "@/lib/api";

/**
 * CONFIGURACIÓN DE COLORES Y CONSTANTES
 * Mantiene la línea visual del Dashboard
 */
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

/**
 * INTERFACES DE DATOS
 */
interface SaleRecord {
    _id: string;
    productName: string;
    category: string;
    quantity: number;
    price: number;
    cost: number;
    profit: number;
    createdAt: string;
    tenantId: string;
}

interface AnalyticsData {
    chartData: { _id: string; ventas: number; ganancia: number; name?: string }[];
    categoryData: { _id: string; total: number; count: number }[];
    topProducts: { _id: string; sales: number; quantity: number; category: string }[];
    salesHistory: SaleRecord[];
    totals: { sales: number; profit: number };
}

/**
 * COMPONENTE: TARJETA DE ESTADÍSTICA (KPI)
 * Rectángulos con iluminación lateral y fondo oscuro profundo
 */
function StatCard({ title, value, icon: Icon, color, sub, trend }: any) {
    return (
        <div className="bg-[#0f0f0f] border border-white/5 p-6 rounded-[32px] relative overflow-hidden group hover:border-white/10 transition-all duration-500 shadow-2xl flex-1 min-w-[280px]">
            {/* Iluminación de fondo al hacer hover */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${color.bg}`}/>
            
            {/* Icono de fondo decorativo */}
            <div className={`absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 ${color.text}`}>
                <Icon size={80} />
            </div>

            {/* Barra lateral de estado */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.bg} shadow-[0_0_15px_currentColor]`}/>
            
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${color.text}`}>
                        <Icon size={16}/>
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${color.text}`}>
                        {title}
                    </p>
                </div>
                
                <div className="text-4xl font-black text-white tracking-tighter mb-1">
                    {value}
                </div>

                {sub && (
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{sub}</p>
                        {trend && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-black flex items-center gap-0.5">
                                <ArrowUpRight size={10}/> {trend}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * COMPONENTE PRINCIPAL: ANALYTICS PAGE
 */
export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  
  // FILTROS DE CABECERA
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  
  // FILTROS DE HISTORIAL (PEDIDO VS STOCK)
  const [originFilter, setOriginFilter] = useState<'all' | 'stock' | 'custom'>('all');
  const [historySearch, setHistorySearch] = useState("");
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

  // FILTRO DE CALENDARIO (AÑO/MES/SEMANA)
  const [timePeriod, setTimePeriod] = useState<'year' | 'month' | 'week'>('month');

  /**
   * CARGA DE DATOS DESDE EL BACKEND
   */
  const fetchData = useCallback(async () => {
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
        
        // Procesar datos para el gráfico
        const formattedChart = result.chartData.map((item: any) => ({
          ...item,
          name: new Date(item._id).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
        }));
        
        setData({ ...result, chartData: formattedChart });
      }
    } catch (error) {
      console.error("Error en analíticas:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * LÓGICA DE FILTRADO LOCAL
   * Cruza búsqueda de texto + filtro de origen (filamento/stock vs pedido)
   */
  const filteredHistory = useMemo(() => {
    if (!data?.salesHistory) return [];
    
    return data.salesHistory.filter(sale => {
      const matchesSearch = sale.productName.toLowerCase().includes(historySearch.toLowerCase());
      
      const isCustom = (sale.category === 'Servicio' || sale.category === 'Impresión');
      const matchesOrigin = 
        originFilter === 'all' || 
        (originFilter === 'custom' && isCustom) || 
        (originFilter === 'stock' && !isCustom);

      return matchesSearch && matchesOrigin;
    });
  }, [data, historySearch, originFilter]);

  /**
   * CÁLCULO DE VENTAS SEGÚN EL "CALENDARIO" (SEMANA/MES/AÑO)
   */
  const periodTotal = useMemo(() => {
    if (!data?.salesHistory) return 0;
    const now = new Date();
    
    const filtered = data.salesHistory.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        if (timePeriod === 'year') return saleDate.getFullYear() === now.getFullYear();
        if (timePeriod === 'month') return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
        if (timePeriod === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            return saleDate >= weekAgo;
        }
        return true;
    });
    
    return filtered.reduce((acc, s) => acc + s.price, 0);
  }, [data, timePeriod]);

  /**
   * EXPORTACIÓN DE DATOS A EXCEL (CSV)
   */
  const handleExport = () => {
      if(!data?.salesHistory?.length) return;
      const headers = "Fecha,Hora,Producto,Categoria,Cantidad,Monto,Ganancia\n";
      const rows = data.salesHistory.map((s) => {
          const d = new Date(s.createdAt);
          return `${d.toLocaleDateString()},${d.toLocaleTimeString()},"${s.productName}",${s.category},${s.quantity},${s.price},${s.profit}`;
      }).join("\n");
      
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `Reporte_PrintHub_${selectedMonth}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val || 0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505]">
        <div className="relative flex flex-col items-center gap-4">
            <Loader2 className="h-16 w-16 animate-spin text-blue-500 opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
                <BarChart3 className="text-blue-500 h-6 w-6 animate-pulse"/>
            </div>
            <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.4em] animate-pulse">Sincronizando Métricas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white font-sans selection:bg-blue-500/30">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* --- HEADER PRINCIPAL --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-10">
          <div>
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-white tracking-tighter mb-4 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              REPORTES
            </h1>
            <div className="flex items-center gap-4 text-gray-500">
                <p className="text-xs font-bold uppercase tracking-[0.3em] pl-1 border-l-2 border-blue-500 ml-1 py-1">
                    Análisis de Rendimiento <span className="text-white/40 mx-2">|</span> 
                    <span className="text-white uppercase"> {selectedMonth === 'all' ? 'Anual' : MONTHS[Number(selectedMonth)]} {selectedYear}</span>
                </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 bg-white/5 p-2 rounded-[24px] border border-white/5 backdrop-blur-md">
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-black border border-white/10 rounded-xl px-6 py-3 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-[#111]">
                {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-black border border-white/10 rounded-xl px-6 py-3 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-[#111]">
                <option value="all">Todo el Año</option>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>

            <button onClick={handleExport} className="bg-white text-black px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95 flex items-center gap-3">
                <Download size={14}/> Exportar DATA
            </button>
          </div>
        </div>

        {/* --- KPI GRID (RECTANGULOS) --- */}
        <div className="flex flex-wrap gap-6">
            <StatCard 
                title="Facturación Bruta" 
                value={formatMoney(data?.totals?.sales || 0)} 
                icon={DollarSign} 
                color={{text:'text-blue-400', bg:'bg-blue-600'}} 
                sub="Ingresos por Ventas"
                trend="+12.5%" 
            />
            <StatCard 
                title="Ganancia Neta" 
                value={formatMoney(data?.totals?.profit || 0)} 
                icon={TrendingUp} 
                color={{text:'text-emerald-400', bg:'bg-emerald-600'}} 
                sub={`${data?.totals?.sales ? Math.round((data.totals.profit / data.totals.sales) * 100) : 0}% de Rentabilidad`} 
            />
            <StatCard 
                title="Movimientos" 
                value={data?.salesHistory?.length || 0} 
                icon={ShoppingCart} 
                color={{text:'text-purple-400', bg:'bg-purple-600'}} 
                sub="Transacciones cerradas" 
            />
        </div>

        {/* --- FILTRO DE CALENDARIO DINÁMICO --- */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
            {/* Efecto de fondo sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent pointer-events-none"/>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <Calendar className="text-blue-500 h-8 w-8"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Filtro Temporal</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Consulta períodos específicos</p>
                    </div>
                </div>

                <div className="flex gap-2 bg-black p-1.5 rounded-2xl border border-white/5">
                    {[
                        { id: 'week', label: 'Semana' },
                        { id: 'month', label: 'Mes' },
                        { id: 'year', label: 'Año' }
                    ].map((period) => (
                        <button 
                            key={period.id}
                            onClick={() => setTimePeriod(period.id as any)}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${timePeriod === period.id ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-white'}`}
                        >
                            {period.label}
                        </button>
                    ))}
                </div>

                <div className="bg-white/5 px-8 py-4 rounded-2xl border border-white/5 flex flex-col items-center md:items-end">
                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Ventas en este tramo</span>
                    <span className="text-2xl font-black text-emerald-400 tracking-tighter">{formatMoney(periodTotal)}</span>
                </div>
            </div>
        </div>

        {/* --- SECCIÓN DE GRÁFICOS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* GRÁFICO DIARIO (2/3) */}
            <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 shadow-2xl">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                        <TrendingUp size={16} className="text-blue-500"/> Histograma de Flujo
                    </h3>
                </div>
                <div className="h-[380px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.chartData}>
                            <defs>
                                <linearGradient id="glowVentas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                            <XAxis dataKey="name" stroke="#333" tick={{fill: '#555', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} dy={15}/>
                            <YAxis stroke="#333" tick={{fill: '#555', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} tickFormatter={(v)=>`$${v/1000}k`} dx={-10}/>
                            <Tooltip 
                                cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '20px', padding: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#3b82f6', fontSize: '14px', fontWeight: '900' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="ventas" 
                                stroke="#3b82f6" 
                                strokeWidth={4} 
                                fill="url(#glowVentas)" 
                                animationDuration={2000}
                                activeDot={{ r: 8, fill: '#fff', stroke: '#3b82f6', strokeWidth: 4 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* GRÁFICO DISTRIBUCIÓN (1/3) */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 shadow-2xl relative">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                    <Layers size={16} className="text-purple-500"/> Categorías
                </h3>
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={data?.categoryData} 
                                cx="50%" cy="50%" 
                                innerRadius={80} 
                                outerRadius={110} 
                                paddingAngle={10} 
                                dataKey="total" 
                                cornerRadius={12}
                                stroke="none"
                            >
                                {data?.categoryData?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '16px', padding: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-10">
                        <span className="text-[10px] text-gray-600 font-black uppercase">Mix de</span>
                        <span className="text-3xl font-black text-white tracking-tighter">Ventas</span>
                    </div>
                </div>
                <div className="mt-10 space-y-3">
                    {data?.categoryData?.map((cat, i) => (
                        <div key={i} className="flex justify-between items-center group">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}/>
                                <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-gray-300 transition-colors">{cat._id}</span>
                            </div>
                            <span className="text-[11px] font-mono font-black text-white/80">{formatMoney(cat.total)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- SECCIÓN: HISTORIAL DETALLADO (EXPANDIBLE) --- */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
            {/* Header del Historial */}
            <div className="p-10 border-b border-white/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white/[0.01]">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                        className="p-4 rounded-2xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-all border border-orange-500/10"
                    >
                        {isHistoryExpanded ? <ChevronDown size={24}/> : <ChevronRight size={24}/>}
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Historial Detallado</h2>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Registros de transacciones unitarias</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    {/* Buscador */}
                    <div className="relative flex-1 sm:w-80 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-blue-500 transition-colors"/>
                        <input 
                            type="text" 
                            placeholder="Buscar producto o categoría..." 
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-[11px] text-white outline-none focus:border-blue-500 transition-all font-bold placeholder:text-gray-700"
                        />
                    </div>

                    {/* Filtro de Origen */}
                    <div className="flex bg-black p-1 rounded-2xl border border-white/5">
                        {[
                            { id: 'all', label: 'Todos', icon: LayoutGrid },
                            { id: 'stock', label: 'Filamentos/Stock', icon: Boxes },
                            { id: 'custom', label: 'Pedidos', icon: Archive }
                        ].map((btn) => (
                            <button 
                                key={btn.id}
                                onClick={() => setOriginFilter(btn.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${originFilter === btn.id ? 'bg-white text-black shadow-xl' : 'text-gray-600 hover:text-gray-400'}`}
                            >
                                <btn.icon size={12}/> {btn.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabla Expandible */}
            {isHistoryExpanded && (
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                            <tr className="text-[10px] uppercase text-gray-600 font-black tracking-[0.2em] border-b border-white/5">
                                <th className="px-10 py-6">Fecha y Hora</th>
                                <th className="px-10 py-6">Producto Seleccionado</th>
                                <th className="px-10 py-6">Origen / Cat</th>
                                <th className="px-10 py-6 text-center">Unidades</th>
                                <th className="px-10 py-6 text-right">Inversión</th>
                                <th className="px-10 py-6 text-right text-white">Ingreso Bruto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredHistory.map((sale, i) => {
                                const isCustom = (sale.category === 'Servicio' || sale.category === 'Impresión');
                                return (
                                    <tr key={sale._id || i} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black text-white/90">{new Date(sale.createdAt).toLocaleDateString('es-AR', {day:'2-digit', month:'short', year:'numeric'})}</span>
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <Clock size={10}/>
                                                    <span className="text-[10px] font-mono">{new Date(sale.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="font-black text-white text-sm tracking-tight group-hover:text-blue-400 transition-colors uppercase">
                                                {sale.productName}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`w-fit text-[9px] font-black px-2 py-0.5 rounded border ${isCustom ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'} uppercase tracking-widest`}>
                                                    {isCustom ? 'Pedido Web' : 'Inventario Stock'}
                                                </span>
                                                <span className="text-[10px] text-gray-600 font-bold uppercase">{sale.category}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-center">
                                            <span className="font-mono text-xs font-black bg-white/5 px-3 py-1 rounded-lg">x{sale.quantity}</span>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="text-xs font-bold text-gray-500">{formatMoney(sale.cost)}</div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="font-black text-white text-base tracking-tighter">{formatMoney(sale.price)}</div>
                                                <div className="text-[10px] text-emerald-500 font-black uppercase mt-1 flex items-center gap-1">
                                                    <Zap size={10} fill="currentColor"/> +{formatMoney(sale.profit)} Net
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredHistory.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Archive size={64}/>
                                            <p className="text-[11px] font-black uppercase tracking-[0.5em]">Sin registros coincidentes</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Footer de la tabla */}
            <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <MousePointer2 size={14} className="text-gray-600"/>
                    <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Fin de registros para este tramo</span>
                </div>
                <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                    PrintHub3D Analytics System v2.0
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}