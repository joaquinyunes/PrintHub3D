"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

// Calculadora de costo por pieza (planilla del taller): gramos y horas del slicer + costos reales → precio sugerido.
// Las diferencias con el cotizador público están en docs/COTIZACION-DIFERENCIAS.md.
interface Result { material: number; power: number; wear: number; error: number; cost: number; extras: number; total: number; mercadoLibre: number }

const DEFAULTS = { filamentPrice: "21000", kwhPrice: "140", watts: "100", lifeHours: "3000", spareParts: "150000", errorPct: "5", mlSurcharge: "0.8" };
const MULTS = [2, 2.5, 3, 3.5, 4, 5];
const FIELDS: [keyof typeof DEFAULTS, string][] = [
  ["filamentPrice", "Filamento ($/kg)"], ["kwhPrice", "Luz ($/kWh)"], ["watts", "Consumo de la impresora (W)"],
  ["lifeHours", "Vida útil de la máquina (h)"], ["spareParts", "Repuestos en toda la vida útil ($)"], ["errorPct", "Margen de error (%)"], ["mlSurcharge", "Recargo MercadoLibre (se suma al multiplicador)"],
];
const money = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
// Acepta "16.000", "3,5" y "3.5".
const num = (raw: string) => {
  let s = raw.trim().replace(/\s|\$/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export default function CalculadoraPage() {
  const [s, setS] = useState(DEFAULTS);
  const [piece, setPiece] = useState({ hours: "", minutes: "", grams: "", extras: "" });
  const [mult, setMult] = useState(4);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    try { const saved = localStorage.getItem("ph3d_cost_settings"); if (saved) setS({ ...DEFAULTS, ...JSON.parse(saved) }); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      localStorage.setItem("ph3d_cost_settings", JSON.stringify(s));
      try {
        const r = await apiFetch("/api/quotes/cost", {
          method: "POST",
          body: JSON.stringify({
            settings: Object.fromEntries(Object.entries(s).map(([k, v]) => [k, num(v)])),
            piece: { hours: num(piece.hours), minutes: num(piece.minutes), grams: num(piece.grams), extras: num(piece.extras) },
            multiplier: mult,
          }),
        });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).message || "No se pudo calcular");
        setRes((await r.json()).quote);
        setErr("");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "No se pudo calcular");
      }
    }, 250);
    return () => clearTimeout(t);
  }, [s, piece, mult]);

  const input = "w-full rounded-lg bg-white/10 p-2 text-white";
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold">Calculadora de costo</h1>
      <p className="mb-6 text-sm text-gray-300">Cargá los gramos y el tiempo que te da el slicer. Los costos del taller quedan guardados en este navegador.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="pieza" className="space-y-3 rounded-2xl border border-white/10 p-4">
          <h2 id="pieza" className="font-semibold">Pieza</h2>
          <div className="grid grid-cols-2 gap-3">
            {([["hours", "Horas"], ["minutes", "Minutos"], ["grams", "Gramos"], ["extras", "Insumos extra ($)"]] as const).map(([k, label]) => (
              <label key={k} className="text-sm"><span className="mb-1 block">{label}</span>
                <input inputMode="decimal" className={input} value={piece[k]} onChange={(e) => setPiece({ ...piece, [k]: e.target.value })} /></label>
            ))}
          </div>
          <fieldset><legend className="mb-1 text-sm">Multiplicador</legend>
            <div className="flex flex-wrap gap-2">
              {MULTS.map((m) => (
                <button key={m} type="button" aria-pressed={mult === m} onClick={() => setMult(m)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${mult === m ? "bg-blue-700" : "bg-white/10 hover:bg-white/20"}`}>×{String(m).replace(".", ",")}</button>
              ))}
            </div></fieldset>
          <h2 className="pt-2 font-semibold">Costos del taller</h2>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(([k, label]) => (
              <label key={k} className="text-sm"><span className="mb-1 block">{label}</span>
                <input inputMode="decimal" className={input} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></label>
            ))}
          </div>
        </section>
        <section aria-labelledby="resultado" aria-live="polite" className="rounded-2xl border border-white/10 p-4">
          <h2 id="resultado" className="mb-3 font-semibold">Resultado</h2>
          {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
          {res && (
            <dl className="space-y-1 text-sm">
              {([["Material", res.material], ["Luz", res.power], ["Desgaste", res.wear], ["Margen de error", res.error], ["Costo", res.cost], ["Insumos (×1,3)", res.extras]] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between"><dt className="text-gray-300">{k}</dt><dd>{money(v)}</dd></div>
              ))}
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-lg font-bold"><dt>Precio</dt><dd>{money(res.total)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-300">Precio en MercadoLibre</dt><dd>{money(res.mercadoLibre)}</dd></div>
            </dl>
          )}
        </section>
      </div>
    </div>
  );
}
