"use client";

import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { importFromExcel, exportToExcel } from "@/lib/excelService";
import { clearAllData, getPedidos, getVentas, getFilamentos, getGastos, getImpresoras } from "@/lib/dataService";

export default function ImportarPage() {
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stats = {
    pedidos: getPedidos().length,
    ventas: getVentas().length,
    filamentos: getFilamentos().length,
    gastos: getGastos().length,
    impresoras: getImpresoras().length,
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".xlsx")) {
      setResult({ ok: false, message: "Solo archivos .xlsx" });
      return;
    }
    setImporting(true);
    setResult(null);
    const res = await importFromExcel(file);
    setResult(res);
    setImporting(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    if (confirm("¿Borrar todos los datos? Esta acción no se puede deshacer.")) {
      clearAllData();
      setResult({ ok: true, message: "Datos borrados" });
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-tone-red/10 rounded-xl">
          <FileSpreadsheet className="w-6 h-6 text-tone-red" />
        </div>
        <h1 className="text-2xl font-black text-white">Importar / Exportar Excel</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {[
          { label: "Pedidos", value: stats.pedidos, color: "text-tone-red" },
          { label: "Ventas", value: stats.ventas, color: "text-tone-amber" },
          { label: "Filamentos", value: stats.filamentos, color: "text-green-400" },
          { label: "Gastos", value: stats.gastos, color: "text-tone-red" },
          { label: "Impresoras", value: stats.impresoras, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-tone-dark/60 border border-white/5 rounded-xl p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
          dragging ? "border-tone-red bg-tone-red/5" : "border-white/10 hover:border-tone-red/30 hover:bg-tone-dark/30"
        }`}
      >
        <Upload className={`w-10 h-10 mx-auto mb-4 ${dragging ? "text-tone-red" : "text-gray-600"}`} />
        <p className="text-white font-bold mb-1">Soltá tu archivo .xlsx acá</p>
        <p className="text-sm text-gray-600">o hacé click para seleccionar</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {/* Result */}
      {importing && (
        <div className="mt-6 text-center text-gray-400 animate-pulse">Importando...</div>
      )}

      {result && (
        <div className={`mt-6 flex items-center gap-3 p-4 rounded-xl ${
          result.ok ? "bg-green-500/10 border border-green-500/20" : "bg-tone-red/10 border border-tone-red/20"
        }`}>
          {result.ok ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-tone-red" />}
          <span className={result.ok ? "text-green-400" : "text-tone-red"}>{result.message}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <button onClick={exportToExcel} className="flex items-center gap-2 px-6 py-3 bg-tone-red hover:bg-tone-red/90 text-white font-bold rounded-xl transition">
          <Download className="w-4 h-4" /> Exportar a .xlsx
        </button>
        <button onClick={handleClear} className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold rounded-xl transition">
          <Trash2 className="w-4 h-4" /> Borrar datos
        </button>
      </div>
    </div>
  );
}
