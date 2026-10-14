"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { WHATSAPP_PHONE } from "@/lib/config";
import Nav from "@/components/store/Nav";
import Footer from "@/components/store/Footer";

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

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em]">{children}</p>;
}

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo enviar");
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

  const choice = (active: boolean) =>
    `rounded-md border-2 border-ink px-3 py-2.5 text-left transition-colors ${
      active ? "bg-signal shadow-hard-sm" : "bg-white hover:bg-paper-2"
    }`;

  return (
    <div className="store min-h-screen">
      <Nav />

      <div className="border-b-2 border-ink">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
          <span className="tag">Cotizador</span>
          <h1 className="font-display mt-4 text-[clamp(2.2rem,5.5vw,4rem)] uppercase leading-[0.95]">
            Precio y plazo <span className="marker">al instante</span>
          </h1>
          <p className="mt-4 max-w-lg text-ink-soft">
            Estimación automática por material, tamaño y solidez. Es orientativa: confirmamos al ver tu archivo.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-[1.3fr_1fr] md:px-6">
        {/* Formulario */}
        <form onSubmit={send} className="space-y-8">
          <div>
            <Label>Material</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MATERIALS.map((m) => (
                <button type="button" key={m.id} onClick={() => set({ material: m.id })} className={choice(form.material === m.id)}>
                  <span className="block text-sm font-extrabold">{m.label}</span>
                  <span className="block text-xs text-ink-soft">{m.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Medidas aproximadas (mm)</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["x", "y", "z"] as const).map((k) => (
                <label key={k} className="block">
                  <span className="mb-1 block text-xs uppercase text-ink-soft">
                    {({ x: "Ancho", y: "Profundidad", z: "Alto" } as const)[k]}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={form[k]}
                    onChange={(e) => set({ [k]: e.target.value } as Partial<typeof form>)}
                    className="field !py-2.5"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Solidez</Label>
            <div className="grid grid-cols-3 gap-2">
              {SOLIDITY.map((s) => (
                <button type="button" key={s.id} onClick={() => set({ solidity: s.id })} className={choice(form.solidity === s.id)}>
                  <span className="block text-sm font-extrabold">{s.label}</span>
                  <span className="block text-xs text-ink-soft">{s.hint}</span>
                </button>
              ))}
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider">
                <span>Relleno</span>
                <span>{form.infill}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={80}
                step={5}
                value={form.infill}
                onChange={(e) => set({ infill: Number(e.target.value) })}
                className="mt-2 w-full accent-ink"
                aria-label="Relleno"
              />
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">Cantidad</span>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => set({ quantity: Math.max(1, Number(e.target.value) || 1) })}
                  className="field !py-2.5"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">Terminación</span>
                <select
                  value={form.finish}
                  onChange={(e) => set({ finish: e.target.value })}
                  className="field !py-2.5"
                >
                  <option value="estandar">Estándar</option>
                  <option value="premium">Premium (lijado/pintado)</option>
                </select>
              </label>
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-md border-2 border-ink bg-white px-3 py-3">
              <input
                type="checkbox"
                checked={form.rush}
                onChange={(e) => set({ rush: e.target.checked })}
                className="h-4 w-4 accent-ink"
              />
              <span className="text-sm font-bold">
                Urgente <span className="font-normal text-ink-soft">— prioridad en la cola (+40%)</span>
              </span>
            </label>
          </div>

          <div className="card-hard space-y-3 p-5">
            <Label>Tus datos</Label>
            <input
              placeholder="Nombre"
              aria-label="Nombre"
              value={form.clientName}
              onChange={(e) => set({ clientName: e.target.value })}
              className="field"
            />
            <input
              placeholder="WhatsApp o email"
              aria-label="WhatsApp o email"
              value={form.contact}
              onChange={(e) => set({ contact: e.target.value })}
              className="field"
            />
            <textarea
              placeholder="Contanos qué necesitás (opcional)"
              aria-label="Notas"
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              rows={3}
              className="field resize-none"
            />
            {error && (
              <p role="alert" className="text-sm font-bold text-danger">
                {error}
              </p>
            )}
          </div>
        </form>

        {/* Resultado */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="card-hard overflow-hidden">
            <div className="border-b-2 border-ink bg-signal p-6">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em]">Estimado</p>
              <div className="mt-1 flex items-end gap-3">
                <span className="font-display text-5xl leading-none">{est ? money(est.total) : "—"}</span>
                {calc && <Loader2 className="mb-1 h-5 w-5 animate-spin" />}
              </div>
              {est && form.quantity > 1 && (
                <p className="mt-2 text-sm font-bold">
                  {money(est.unitPrice)} por unidad · {form.quantity} unidades
                </p>
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
                <p className="text-ink-soft">Completá las medidas para ver el estimado.</p>
              )}
            </div>

            <div className="space-y-3 border-t-2 border-ink p-6">
              {sent ? (
                <div className="flex items-center gap-2 rounded-md border-2 border-ink bg-paper-2 px-4 py-3 text-sm font-bold">
                  <Check className="h-4 w-4" strokeWidth={3} /> Cotización enviada. Te contactamos pronto.
                </div>
              ) : (
                <button onClick={send} disabled={sending} className="btn btn-signal w-full disabled:opacity-50">
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar cotización
                </button>
              )}
              <a href={waLink()} target="_blank" rel="noreferrer" className="btn btn-paper w-full">
                Enviar por WhatsApp
              </a>
            </div>
          </div>
          <p className="mt-3 px-1 text-xs leading-relaxed text-ink-soft">
            El estimado es orientativo. El precio final se confirma al revisar el archivo o la pieza.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-soft">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  );
}
