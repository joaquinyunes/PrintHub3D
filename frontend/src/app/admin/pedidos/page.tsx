"use client";

import { useState, useEffect } from "react";
import { Package, Search, CheckCircle, Clock, Printer, Wrench, Truck, XCircle } from "lucide-react";
import { getPedidos, updatePedidoStatus, Pedido } from "@/lib/dataService";

const ESTADOS = ["Pendiente", "Imprimiendo", "Post-procesado", "Listo", "Entregado", "Cancelado"];

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  Pendiente: { icon: Clock, color: "text-tone-amber", bg: "bg-tone-amber/10" },
  Imprimiendo: { icon: Printer, color: "text-tone-red", bg: "bg-tone-red/10" },
  "Post-procesado": { icon: Wrench, color: "text-tone-amber", bg: "bg-tone-amber/10" },
  Listo: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  Entregado: { icon: Truck, color: "text-blue-400", bg: "bg-blue-500/10" },
  Cancelado: { icon: XCircle, color: "text-gray-500", bg: "bg-gray-800" },
};

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tab, setTab] = useState("Pendiente");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPedidos(getPedidos());
    setLoading(false);
  }, []);

  const filtered = pedidos
    .filter((p) => tab === "Todas" || p.estado === tab)
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.cliente.toLowerCase().includes(q) || p.producto.toLowerCase().includes(q);
    });

  const handleStatus = (id: number, estado: string) => {
    updatePedidoStatus(id, estado);
    setPedidos(getPedidos());
  };

  if (loading) return <div className="p-8 text-gray-500">Cargando pedidos...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-tone-red/10 rounded-xl">
          <Package className="w-6 h-6 text-tone-red" />
        </div>
        <h1 className="text-2xl font-black text-white">Pedidos</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
        {["Todas", ...ESTADOS].map((e) => (
          <button
            key={e}
            onClick={() => setTab(e)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === e ? "bg-tone-red text-white" : "bg-white/5 text-gray-400 hover:bg-tone-red/10 hover:text-tone-red"
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente o producto..."
          className="w-full bg-tone-darker/80 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 transition"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-600">No hay pedidos en esta categoría</p>
          </div>
        ) : (
          filtered.map((p) => {
            const cfg = STATUS_CONFIG[p.estado] || STATUS_CONFIG.Pendiente;
            const StatusIcon = cfg.icon;
            return (
              <div
                key={p.id}
                className="bg-tone-dark/60 border border-white/5 rounded-xl p-4 md:p-5 hover:border-tone-red/20 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                  <div className={`p-2 rounded-lg ${cfg.bg} flex-shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-600 font-mono">#{p.id}</span>
                      <span className={`text-xs font-bold ${cfg.color}`}>{p.estado}</span>
                    </div>
                    <h3 className="font-bold text-white truncate">{p.cliente}</h3>
                    <p className="text-sm text-gray-400 truncate">{p.producto}</p>
                    {p.descripcion && <p className="text-xs text-gray-600 truncate mt-0.5">{p.descripcion}</p>}
                  </div>

                  <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-white font-black">${p.total.toLocaleString()}</p>
                      {p.saldo > 0 && <p className="text-tone-red text-xs">Saldo: ${p.saldo.toLocaleString()}</p>}
                    </div>

                    {p.estado !== "Entregado" && p.estado !== "Cancelado" && (
                      <div className="flex gap-1.5">
                        {ESTADOS.map((e) => {
                          const idxActual = ESTADOS.indexOf(p.estado);
                          const idxTarget = ESTADOS.indexOf(e);
                          if (idxTarget <= idxActual || e === "Cancelado") return null;
                          return (
                            <button
                              key={e}
                              onClick={() => handleStatus(p.id, e)}
                              className="px-3 py-1.5 bg-tone-red/10 text-tone-red text-xs font-semibold rounded-lg hover:bg-tone-red/20 transition"
                              title={`Marcar como ${e}`}
                            >
                              {e}
                            </button>
                          );
                        })}
                        {p.estado !== "Cancelado" && (
                          <button
                            onClick={() => handleStatus(p.id, "Cancelado")}
                            className="px-3 py-1.5 bg-gray-800 text-gray-400 text-xs font-semibold rounded-lg hover:bg-gray-700 transition"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
