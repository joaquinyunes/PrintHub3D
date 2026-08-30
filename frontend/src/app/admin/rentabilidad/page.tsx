"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Loader2, Percent, Wallet, Package, Layers } from "lucide-react";
import { apiFetch } from "@/lib/api";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const PIE = ["#ff5c1a", "#ff2e88", "#14e0c8", "#f5a524", "#8b5cf6", "#38bdf8"];
const money = (n: number) => "$" + Math.round(n || 0).toLocaleString("es-AR");

interface Data {
  totals: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    grossMargin: number;
    expenses: number;
    netProfit: number;
    netMargin: number;
  };
  pipeline: { value: number; estimatedProfit: number; orders: number };
  products: { name: string; units: number; revenue: number; cost: number; profit: number; margin: number }[];
  expensesByCategory: { category: string; total: number }[];
}

export default function RentabilidadPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<string>(String(now.getMonth()));
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/analytics/profitability?year=${year}&month=${month}`);
      if (!res.ok) throw new Error("No se pudo cargar la rentabilidad");
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const t = data?.totals;
  const netPositive = (t?.netProfit ?? 0) >= 0;

  const productChart = useMemo(
    () => (data?.products || []).slice(0, 8).map((p) => ({ name: p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name, profit: Math.round(p.profit) })),
    [data],
  );

  return (
    <div className="min-h-screen bg-[#050505] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">
              RENTABILIDAD
            </h1>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-gray-500">Margen real · P&amp;L</p>
          </div>
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-sm text-white [&>option]:bg-[#111]"
            >
              <option value="all">Todo el año</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={String(i)}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-sm text-white [&>option]:bg-[#111]"
            >
              {[0, 1, 2].map((d) => {
                const y = now.getFullYear() - d;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

        {loading || !t ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-tone-red" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Kpi label="Ingresos (ventas)" value={money(t.revenue)} icon={Wallet} accent="text-white" />
              <Kpi label="Costo de lo vendido" value={money(t.cogs)} icon={Layers} accent="text-orange-400" sub={`${t.revenue ? Math.round((t.cogs / t.revenue) * 100) : 0}% de los ingresos`} />
              <Kpi
                label="Ganancia bruta"
                value={money(t.grossProfit)}
                icon={Percent}
                accent="text-emerald-400"
                sub={`${t.grossMargin}% de margen`}
              />
              <Kpi
                label="Ganancia neta"
                value={money(t.netProfit)}
                icon={netPositive ? TrendingUp : TrendingDown}
                accent={netPositive ? "text-emerald-400" : "text-red-400"}
                sub={`${t.netMargin}% · gastos ${money(t.expenses)}`}
              />
            </div>

            {/* Waterfall simple */}
            <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
              <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">De ingresos a ganancia neta</h3>
              <div className="space-y-2">
                <Bar2 label="Ingresos" value={t.revenue} total={t.revenue} color="bg-white/70" />
                <Bar2 label="− Costo de material / mercadería" value={t.cogs} total={t.revenue} color="bg-orange-500" />
                <Bar2 label="= Ganancia bruta" value={t.grossProfit} total={t.revenue} color="bg-emerald-500" />
                <Bar2 label="− Gastos del período" value={t.expenses} total={t.revenue} color="bg-tone-red" />
                <Bar2 label="= Ganancia neta" value={t.netProfit} total={t.revenue} color={netPositive ? "bg-emerald-400" : "bg-red-500"} strong />
              </div>
              {data.pipeline.orders > 0 && (
                <p className="mt-4 border-t border-white/5 pt-3 text-xs text-gray-500">
                  + {data.pipeline.orders} pedido(s) en curso por {money(data.pipeline.value)} (ganancia estimada {money(data.pipeline.estimatedProfit)}), todavía no facturados.
                </p>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Top productos por ganancia */}
              <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
                <h3 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">
                  <Package className="h-4 w-4" /> Productos que más dejan
                </h3>
                {productChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={productChart} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid horizontal={false} stroke="#ffffff10" />
                      <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "#111", border: "1px solid #ffffff20", borderRadius: 12 }}
                        formatter={(v: any) => money(v)}
                      />
                      <Bar dataKey="profit" fill="#14e0c8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-12 text-center text-sm text-gray-600">Sin ventas en el período</p>
                )}
              </div>

              {/* Gastos por categoría */}
              <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-6">
                <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">Gastos por categoría</h3>
                {data.expensesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={data.expensesByCategory} dataKey="total" nameKey="category" innerRadius={55} outerRadius={95} paddingAngle={3}>
                        {data.expensesByCategory.map((_, i) => (
                          <Cell key={i} fill={PIE[i % PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#111", border: "1px solid #ffffff20", borderRadius: 12 }}
                        formatter={(v: any) => money(v)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="py-12 text-center text-sm text-gray-600">Sin gastos en el período</p>
                )}
              </div>
            </div>

            {/* Tabla de márgenes */}
            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-[#0f0f0f]">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-right">Unid.</th>
                    <th className="px-4 py-3 text-right">Ingresos</th>
                    <th className="px-4 py-3 text-right">Costo</th>
                    <th className="px-4 py-3 text-right">Ganancia</th>
                    <th className="px-4 py-3 text-right">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.products.map((p) => (
                    <tr key={p.name} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-medium text-white">{p.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">{p.units}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{money(p.revenue)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-orange-400/80">{money(p.cost)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-emerald-400">{money(p.profit)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            p.margin >= 40 ? "bg-emerald-500/10 text-emerald-400" : p.margin >= 15 ? "bg-tone-amber/10 text-tone-amber" : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {p.margin}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-600">
                        Todavía no hay ventas registradas en este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, accent, sub }: any) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#0f0f0f] p-5">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-gray-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className={`mt-2 text-2xl font-black tracking-tight ${accent}`}>{value}</p>
      {sub && <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-600">{sub}</p>}
    </div>
  );
}

function Bar2({ label, value, total, color, strong }: { label: string; value: number; total: number; color: string; strong?: boolean }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (Math.abs(value) / total) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className={strong ? "font-bold text-white" : "text-gray-400"}>{label}</span>
        <span className={`tabular-nums ${strong ? "font-bold text-white" : "text-gray-400"}`}>{money(value)}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
