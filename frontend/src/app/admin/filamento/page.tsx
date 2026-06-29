"use client";

import { useState, useEffect } from "react";
import { Spool, Search, Download } from "lucide-react";
import { getFilamentos, Filamento } from "@/lib/dataService";
import { exportToExcel } from "@/lib/excelService";

export default function AdminFilamento() {
  const [filamentos, setFilamentos] = useState<Filamento[]>([]);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");

  useEffect(() => {
    setFilamentos(getFilamentos());
  }, []);

  const tipos = ["Todos", ...new Set(filamentos.map((f) => f.tipo))];
  const marcas = [...new Set(filamentos.map((f) => f.marca))];

  const filtered = filamentos.filter((f) => {
    if (filterTipo !== "Todos" && f.tipo !== filterTipo) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return f.marca.toLowerCase().includes(q) || f.color.toLowerCase().includes(q);
  });

  const totalStock = filtered.reduce((s, f) => s + f.stock, 0);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tone-red/10 rounded-xl">
            <Spool className="w-6 h-6 text-tone-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Filamento</h1>
            <p className="text-xs text-gray-600">{totalStock} kg en stock · {filamentos.length} variedades</p>
          </div>
        </div>
        <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2.5 bg-tone-red hover:bg-tone-red/90 text-white text-sm font-bold rounded-xl transition">
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por marca o color..."
            className="w-full bg-tone-darker/80 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 transition" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {tipos.map((t) => (
            <button key={t} onClick={() => setFilterTipo(t)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${filterTipo === t ? "bg-tone-red text-white" : "bg-white/5 text-gray-400 hover:bg-tone-red/10 hover:text-tone-red"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Marcas summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {marcas.map((m) => {
          const stock = filamentos.filter((f) => f.marca === m).reduce((s, f) => s + f.stock, 0);
          return (
            <div key={m} className="bg-tone-dark/60 border border-white/5 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-600 truncate">{m}</p>
              <p className="text-white font-black text-lg">{stock} kg</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        {filtered.map((f, i) => (
          <div key={i} className="bg-tone-dark/60 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-tone-red/20 transition">
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold">{f.color}</p>
              <p className="text-xs text-gray-600 truncate">{f.marca}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`text-lg font-black ${f.stock <= 2 ? "text-tone-red" : "text-green-400"}`}>
                {f.stock} kg
              </span>
              <p className="text-xs text-gray-600">{f.tipo}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
