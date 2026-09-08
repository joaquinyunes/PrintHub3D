"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle, FileSpreadsheet, Database } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Row = (string | number | boolean | Date | null | undefined)[];

interface Payload {
  replace: boolean;
  pedidos: Record<string, unknown>[];
  ventasProductos: Record<string, unknown>[];
  ventasFilamento: Record<string, unknown>[];
  gastosLocal: Record<string, unknown>[];
  gastosCasa: Record<string, unknown>[];
  stockFilamento: Record<string, unknown>[];
}

const S = (v: unknown): string => (v == null ? "" : String(v).trim());

/** Parsea números en formato AR ("$19.000,00") o llano. */
const N = (v: unknown): number => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  let s = S(v).replace(/\s|\$/g, "");
  if (!s) return 0;
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
};

const D = (v: unknown): string | null => {
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
  const s = S(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

function sheetRows(wb: XLSX.WorkBook, name: string): Row[] {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Row>(ws, { header: 1, raw: true, blankrows: false, defval: null });
}

function normalize(wb: XLSX.WorkBook): Omit<Payload, "replace"> {
  // --- PEDIDOS ---
  const pedRows = sheetRows(wb, "Pedidos").slice(1);
  const pedidos = pedRows
    .filter((r) => S(r[1]))
    .map((r) => ({
      cliente: S(r[1]),
      producto: S(r[2]),
      descripcion: S(r[3]),
      fechaEntrega: D(r[4]),
      total: N(r[5]),
      sena: N(r[6]),
      canal: S(r[8]),
      estado: S(r[9]),
    }));

  // --- VENTAS (Productos / Filamento): saltea títulos y cabeceras repetidas por mes ---
  const mapVentas = (name: string) =>
    sheetRows(wb, name)
      .filter((r) => (r[0] instanceof Date || (typeof r[0] === "number" && r[0] > 40000)) && S(r[1]) && S(r[1]).toUpperCase() !== "PRODUCTO")
      .map((r) => ({
        fecha: D(r[0]),
        producto: S(r[1]),
        cantidad: N(r[2]) || 1,
        cliente: S(r[3]),
        formaPago: S(r[4]),
        total: N(r[5]),
        observaciones: S(r[6]),
      }));
  const ventasProductos = mapVentas("Ventas Productos");
  const ventasFilamento = mapVentas("Ventas Filamento");

  // --- GASTOS LOCAL --- [FECHA, DESCRIPCION, PROVEEDOR, MONTO, MEDIO DE PAGO, ESTADO, OBS]
  const gastosLocal = sheetRows(wb, "Gastos Local")
    .slice(2)
    .filter((r) => S(r[1]))
    .map((r) => ({
      fecha: D(r[0]),
      descripcion: S(r[1]),
      proveedor: S(r[2]),
      monto: N(r[3]),
      medioPago: S(r[4]),
      estado: S(r[5]),
      observaciones: S(r[6]),
    }));

  // --- GASTOS CASA --- [FECHA, DESCRIPCION, MONTO, MEDIO DE PAGO, OBS]
  const gastosCasa = sheetRows(wb, "Gastos Casa")
    .slice(2)
    .filter((r) => S(r[1]))
    .map((r) => ({
      fecha: D(r[0]),
      descripcion: S(r[1]),
      monto: N(r[2]),
      medioPago: S(r[3]),
      observaciones: S(r[4]),
    }));

  // --- STOCK SYNC --- [PRODUCTO, COLOR, ROLLOS, PRECIO, SKU]
  const stockFilamento = sheetRows(wb, "Stock Sync")
    .slice(1)
    .filter((r) => S(r[0]) && S(r[0]).toUpperCase() !== "PRODUCTO")
    .map((r) => ({
      producto: S(r[0]),
      color: S(r[1]),
      rollos: N(r[2]),
      precio: N(r[3]),
      sku: S(r[4]),
    }));

  return { pedidos, ventasProductos, ventasFilamento, gastosLocal, gastosCasa, stockFilamento };
}

export default function ImportarPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Omit<Payload, "replace"> | null>(null);
  const [fileName, setFileName] = useState("");
  const [replace, setReplace] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Record<string, number> | null>(null);
  const [status, setStatus] = useState<{ importados: Record<string, number>; totales: Record<string, number> } | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/import/status");
      if (res.ok) setStatus(await res.json());
    } catch { /* noop */ }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const onFile = async (file: File) => {
    setError(""); setResult(null); setParsed(null); setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      setParsed(normalize(wb));
    } catch (e) {
      setError("No se pudo leer el archivo. ¿Es el .xlsx correcto?");
      console.error(e);
    }
  };

  const doImport = async () => {
    if (!parsed) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const res = await apiFetch("/api/import/excel", {
        method: "POST",
        body: JSON.stringify({ replace, ...parsed } as Payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Falló la importación");
      setResult(data.report || {});
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  const counts = parsed && {
    Pedidos: parsed.pedidos.length,
    "Ventas productos": parsed.ventasProductos.length,
    "Ventas filamento": parsed.ventasFilamento.length,
    "Gastos local": parsed.gastosLocal.length,
    "Gastos casa": parsed.gastosCasa.length,
    "Filamento (catálogo)": parsed.stockFilamento.length,
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto text-white">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-500/10 rounded-xl"><FileSpreadsheet className="w-6 h-6 text-blue-400" /></div>
        <h1 className="text-2xl font-black">Importar planilla</h1>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Subí el Excel de <span className="text-gray-300">Pedidos / Ventas / Gastos / Stock</span> y se carga todo al sistema.
      </p>

      {status && (
        <div className="mb-6 grid grid-cols-3 gap-3 text-center">
          {(["pedidos", "ventas", "gastos"] as const).map((k) => (
            <div key={k} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-[10px] uppercase tracking-widest text-gray-500">{k}</div>
              <div className="text-lg font-black">{status.totales[k] ?? 0}</div>
              <div className="text-[10px] text-blue-400">{status.importados[k] ?? 0} de la planilla</div>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept=".xlsx,.xls" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />

      <button onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-white/15 hover:border-blue-500/50 rounded-2xl py-10 flex flex-col items-center gap-3 transition-colors">
        <UploadCloud className="w-8 h-8 text-gray-500" />
        <span className="text-sm font-bold text-gray-300">{fileName || "Elegir archivo .xlsx"}</span>
      </button>

      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {counts && (
        <div className="mt-6 bg-[#141414] border border-white/10 rounded-2xl p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Se van a importar</h2>
          <div className="space-y-1.5">
            {Object.entries(counts).map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-400">{k}</span>
                <span className={`font-bold ${v ? "text-white" : "text-gray-600"}`}>{v}</span>
              </div>
            ))}
          </div>

          <label className="mt-4 flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            Borrar lo importado antes (evita duplicados si reimportás)
          </label>

          <button onClick={doImport} disabled={busy}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {busy ? "Importando..." : "Importar al sistema"}
          </button>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3">
            <CheckCircle2 className="w-5 h-5" /> Importación completada
          </div>
          <div className="space-y-1 text-sm">
            {Object.entries(result).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-gray-400 capitalize">{k}</span><span className="font-bold">{v}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
