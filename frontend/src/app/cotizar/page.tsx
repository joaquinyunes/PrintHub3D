"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiUrl } from "@/lib/api";
import { WHATSAPP_PHONE } from "@/lib/config";
import GradientField from "@/components/motion/GradientField";
import Reveal from "@/components/motion/Reveal";

const MATERIALS = [
  { id: "PLA", label: "PLA", hint: "Uso general, económico" },
  { id: "PETG", label: "PETG", hint: "Resistente, exterior" },
  { id: "ABS", label: "ABS", hint: "Técnico, alta temp." },
  { id: "TPU", label: "TPU", hint: "Flexible" },
  { id: "RESINA", label: "Resina", hint: "Máximo detalle" },
];
const SOLIDITY = [
  { id: "hueco", label: "Hueco", hint: "Decorativo" },
  { id: "normal", label: "Normal", hint: "Uso cotidiano" },
  { id: "solido", label: "Sólido", hint: "Máxima resistencia" },
];

interface Estimate {
  weightGrams: number;
  printHours: number;
  materialCost: number;
  machineCost: number;
  laborCost: number;
  unitPrice: number;
  total: number;
}

const money = (n: number) => "$" + Math.round(n).toLocaleString("es-AR");

export default function CotizarPage() {
  const [form, setForm] = useState({
    material: "PLA",
    x: "80",
    y: "80",
    z: "60",
    solidity: "normal",
    infill: 20,
    quantity: 1,
    finish: "estandar",
    rush: false,
    clientName: "",
    contact: "",
    notes: "",
  });
  const [est, setEst] = useState<Estimate | null>(null);
  const [calc, setCalc] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const recalc = useCallback(async () => {
    setCalc(true);
    try {
      const res = await fetch(apiUrl("/api/quotes/estimate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material: form.material,
          dimensionsMm: { x: Number(form.x), y: Number(form.y), z: Number(form.z) },
          solidity: form.solidity,
          infill: form.infill,
          quantity: form.quantity,
          finish: form.finish,
          rush: form.rush,
        }),
      });
      if (res.ok) setEst((await res.json()).estimate);
    } catch {
      /* ignore */
    } finally {
      setCalc(false);
    }
  }, [form.material, form.x, form.y, form.z, form.solidity, form.infill, form.quantity, form.finish, form.rush]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(recalc, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [recalc]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.clientName.trim() || !form.contact.trim()) {
      setError("Completá tu nombre y un contacto.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(apiUrl("/api/quotes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName,
          contact: form.contact,
          notes: form.notes,
          material: form.material,
          dimensionsMm: { x: Number(form.x), y: Number(form.y), z: Number(form.z) },
          solidity: form.solidity,
          infill: form.infill,
          quantity: form.quantity,
          finish: form.finish,
          rush: form.rush,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "No se pudo enviar");
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const waLink = () => {
    const t =
      `Hola! Quiero cotizar una pieza.\n` +
      `Material: ${form.material} · ${form.x}×${form.y}×${form.z} mm · ${form.solidity}\n` +
      `Cantidad: ${form.quantity}${form.rush ? " · urgente" : ""}\n` +
      (est ? `Estimado web: ${money(est.total)}` : "");
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(t)}`;
  };

  const pill = (active: boolean) =>
    `rounded-xl border px-3 py-2.5 text-left transition ${
      active ? "border-flame bg-flame/10 text-ink" : "border-white/10 bg-white/5 text-ink-dim hover:border-white/25"
    }`;

  return (
    <div className="min-h-screen bg-ground text-ink">
      <div className="relative overflow-hidden border-b border-white/10">
        <GradientField />
        <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-24 md:px-6">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-ink-dim hover:text-flame">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-flame">Cotizador</p>
          <h1 className="mt-2 font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[0.95]">
            Precio y plazo, <span className="text-flux">al instante</span>
          </h1>
          <p className="mt-3 max-w-lg text-ink-dim">
            Estimación automática por material, tamaño y solidez. Es orientativa: confirmamos al ver tu archivo.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-[1.3fr_1fr] md:px-6">
        {/* ── Formulario ── */}
        <form onSubmit={send} className="space-y-8">
          <Reveal>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">Material</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MATERIALS.map((m) => (
                <button type="button" key={m.id} onClick={() => set({ material: m.id })} className={pill(form.material === m.id)}>
                  <span className="block font-display text-sm">{m.label}</span>
                  <span className="block text-[11px] text-ink-dim">{m.hint}</span>
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">Medidas aproximadas (mm)</p>
            <div className="grid grid-cols-3 gap-2">
              {(["x", "y", "z"] as const).map((k) => (
                <div key={k}>
                  <label className="mb-1 block text-[11px] uppercase text-ink-dim">
                    {({ x: "Ancho", y: "Profundidad", z: "Alto" } as const)[k]}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form[k]}
                    onChange={(e) => set({ [k]: e.target.value } as any)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm text-ink focus:border-flame/50 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">Solidez</p>
            <div className="grid grid-cols-3 gap-2">
              {SOLIDITY.map((s) => (
                <button type="button" key={s.id} onClick={() => set({ solidity: s.id })} className={pill(form.solidity === s.id)}>
                  <span className="block font-display text-sm">{s.label}</span>
                  <span className="block text-[11px] text-ink-dim">{s.hint}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] uppercase text-ink-dim">
                <span>Relleno</span>
                <span className="font-mono text-flame">{form.infill}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={80}
                step={5}
                value={form.infill}
                onChange={(e) => set({ infill: Number(e.target.value) })}
                className="mt-2 w-full accent-flame"
              />
            </div>
          </Reveal>

          <Reveal>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[11px] uppercase text-ink-dim">Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => set({ quantity: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-sm text-ink focus:border-flame/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase text-ink-dim">Terminación</label>
                <select
                  value={form.finish}
                  onChange={(e) => set({ finish: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-ink focus:border-flame/50 focus:outline-none [&>option]:bg-ground-2"
                >
                  <option value="estandar">Estándar</option>
                  <option value="premium">Premium (lijado/pintado)</option>
                </select>
              </div>
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <input type="checkbox" checked={form.rush} onChange={(e) => set({ rush: e.target.checked })} className="h-4 w-4 accent-flame" />
              <span className="text-sm">
                Urgente <span className="text-ink-dim">— prioridad en la cola (+40%)</span>
              </span>
            </label>
          </Reveal>

          <Reveal className="space-y-3 rounded-2xl border border-white/10 bg-ground-2 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">Tus datos</p>
            <input
              placeholder="Nombre"
              value={form.clientName}
              onChange={(e) => set({ clientName: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-ink placeholder:text-ink-dim/60 focus:border-flame/50 focus:outline-none"
            />
            <input
              placeholder="WhatsApp o email"
              value={form.contact}
              onChange={(e) => set({ contact: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-ink placeholder:text-ink-dim/60 focus:border-flame/50 focus:outline-none"
            />
            <textarea
              placeholder="Contanos qué necesitás (opcional)"
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-ink placeholder:text-ink-dim/60 focus:border-flame/50 focus:outline-none"
            />
            {error && <p className="text-sm text-flame">{error}</p>}
          </Reveal>
        </form>

        {/* ── Resultado (sticky) ── */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-ground-2 ring-flux">
            <div className="grain relative border-b border-white/10 bg-flux/10 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">Estimado</p>
              <div className="mt-1 flex items-end gap-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={est?.total ?? 0}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="font-display text-4xl text-flux"
                  >
                    {est ? money(est.total) : "—"}
                  </motion.span>
                </AnimatePresence>
                {calc && <Loader2 className="mb-2 h-4 w-4 animate-spin text-ink-dim" />}
              </div>
              {est && form.quantity > 1 && (
                <p className="mt-1 text-xs text-ink-dim">{money(est.unitPrice)} por unidad · {form.quantity} unidades</p>
              )}
            </div>

            <div className="space-y-2 p-6 text-sm">
              {est ? (
                <>
                  <Row k="Peso estimado" v={`${est.weightGrams} g`} />
                  <Row k="Tiempo de impresión" v={`~${est.printHours} h`} />
                  <Row k="Material" v={money(est.materialCost)} />
                  <Row k="Máquina" v={money(est.machineCost)} />
                  <Row k="Preparación + posproceso" v={money(est.laborCost)} />
                </>
              ) : (
                <p className="text-ink-dim">Completá las medidas para ver el estimado.</p>
              )}
            </div>

            <div className="space-y-2 border-t border-white/10 p-6">
              {sent ? (
                <div className="flex items-center gap-2 rounded-xl border border-resin/30 bg-resin/10 px-4 py-3 text-sm text-resin">
                  <Check className="h-4 w-4" /> Cotización enviada. Te contactamos pronto.
                </div>
              ) : (
                <button
                  onClick={send}
                  disabled={sending}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-flux px-6 py-3.5 font-mono text-xs uppercase tracking-[0.14em] text-white shadow-lg shadow-flare/25 transition hover:brightness-110 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Enviar cotización
                </button>
              )}
              <a
                href={waLink()}
                target="_blank"
                rel="noreferrer"
                className="block rounded-full border border-white/15 px-6 py-3 text-center font-mono text-xs uppercase tracking-[0.14em] text-ink-dim transition hover:border-resin/50 hover:text-ink"
              >
                Enviar por WhatsApp
              </a>
            </div>
          </div>
          <p className="mt-3 px-1 text-[11px] leading-relaxed text-ink-dim/70">
            El estimado es orientativo. El precio final se confirma al revisar el archivo o la pieza.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-dim">{k}</span>
      <span className="font-mono text-ink">{v}</span>
    </div>
  );
}
