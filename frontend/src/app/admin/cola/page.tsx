"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { usePolling } from "@/hooks/usePolling";

// Cola "¿Qué imprimo?" (portada de global3d-corrientes): piezas pendientes agrupadas por color o por cliente.
// Si el taller tiene operarios, cada avance se hace con el PIN de quien imprime (queda registrado quién fue).
interface Entry {
  _id: string;
  orderId: string;
  trackingCode: string;
  itemName: string;
  label: string;
  quantityTotal: number;
  quantityDone: number;
  status: "pending" | "printing" | "done";
  due: { label: string; tone: "late" | "soon" | "ok" };
  lastAdvancedBy?: { kind: string; name: string } | null;
}
interface Group {
  key: string;
  label: string;
  swatch: string | null;
  entries: Entry[];
}
interface Operator {
  id: string;
  name: string;
}

const TONE = { late: "text-red-400", soon: "text-amber-400", ok: "text-gray-400" } as const;
const NEXT_LABEL = { pending: "Empezar", printing: "Terminar", done: "Reabrir" } as const;
const TOKEN_KEY = "ph3d_operator_token";
const NAME_KEY = "ph3d_operator_name";

export default function ColaPage() {
  const [mode, setMode] = useState<"color" | "customer">("color");
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState("");
  const [operator, setOperator] = useState<string | null>(null);
  const [pinFor, setPinFor] = useState<string | null>(null); // id de la pieza que esperaba el PIN
  const [pinOpen, setPinOpen] = useState(false);

  useEffect(() => {
    setOperator(sessionStorage.getItem(NAME_KEY));
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/production-queue/queue?group=${mode}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Error ${res.status}`);
      setGroups((await res.json()).groups);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la cola.");
    }
  }, [mode]);

  useEffect(() => { load(); }, [load]);
  usePolling(load, 15000);

  const advance = async (id: string) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const res = await apiFetch(`/api/production-queue/pieces/${id}/advance`, { method: "PATCH", headers: token ? { "x-operator-token": token } : {} });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.code === "PIN_REQUIRED" || body.code === "OPERATOR_TOKEN_INVALID") {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(NAME_KEY);
        setOperator(null);
        setPinFor(id);
        setPinOpen(true);
        return;
      }
      setError(body.message || "No se pudo actualizar la pieza.");
    }
    await load();
  };

  const onIdentified = async (name: string) => {
    setOperator(name);
    setPinOpen(false);
    const id = pinFor;
    setPinFor(null);
    if (id) await advance(id);
  };

  return (
    <div className="p-6 text-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">¿Qué imprimo?</h1>
          <p className="text-sm text-gray-300">Piezas pendientes, lo más urgente primero.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setPinFor(null); setPinOpen(true); }}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-gray-200 hover:bg-white/10"
          >
            {operator ? `Operario: ${operator} · cambiar` : "Identificarme con PIN"}
          </button>
          {(["color", "customer"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
              className={`rounded-lg px-3 py-1.5 text-sm ${mode === m ? "bg-blue-700 text-white" : "bg-white/5 text-gray-200 hover:bg-white/10"}`}>
              {m === "color" ? "Por color" : "Por cliente"}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {!error && groups.length === 0 && <p className="text-gray-300">No hay piezas pendientes. Las piezas se generan solas al crear un pedido con productos que tienen partes, o a mano desde el pedido.</p>}

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.key} aria-label={g.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              {g.swatch && <span className="inline-block h-4 w-4 rounded-full border border-white/20" style={{ background: g.swatch }} aria-hidden />}
              {g.label} <span className="text-xs font-normal text-gray-300">· {g.entries.length} pieza{g.entries.length === 1 ? "" : "s"}</span>
            </h2>
            <ul className="divide-y divide-white/5">
              {g.entries.map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium">{e.label} <span className="text-gray-300">· {e.quantityDone}/{e.quantityTotal}</span></p>
                    <p className="text-xs text-gray-300">
                      {e.itemName} · {e.trackingCode}
                      {e.lastAdvancedBy?.name ? ` · último movimiento: ${e.lastAdvancedBy.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${TONE[e.due.tone]}`}>{e.due.label}</span>
                    <button onClick={() => advance(e._id)} aria-label={`${NEXT_LABEL[e.status]}: ${e.label}`} className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20">{NEXT_LABEL[e.status]}</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {pinOpen && <PinDialog onClose={() => setPinOpen(false)} onIdentified={onIdentified} />}
    </div>
  );
}

function PinDialog({ onClose, onIdentified }: { onClose: () => void; onIdentified: (name: string) => void }) {
  const [ops, setOps] = useState<Operator[]>([]);
  const [opId, setOpId] = useState("");
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const res = await apiFetch("/api/operators");
      if (res.ok) {
        const items: Operator[] = (await res.json()).items;
        setOps(items);
        if (items.length === 1) setOpId(items[0].id);
      }
    })();
  }, []);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await apiFetch("/api/operators/login", { method: "POST", body: JSON.stringify({ operatorId: opId, pin }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body.message || "No se pudo verificar el PIN.");
        setPin("");
        pinRef.current?.focus();
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, body.token);
      sessionStorage.setItem(NAME_KEY, body.operator.name);
      onIdentified(body.operator.name);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="pin-title">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-gray-900 p-6">
        <h2 id="pin-title" className="text-lg font-bold">¿Quién imprime?</h2>
        {ops.length === 0 ? (
          <p className="text-sm text-gray-300">Todavía no hay operarios cargados. El administrador los crea en «Operarios».</p>
        ) : (
          <>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-200">Operario</span>
              <select value={opId} onChange={(e) => setOpId(e.target.value)} required className="w-full rounded-lg bg-white/10 p-2 text-white">
                <option value="">Elegí tu nombre…</option>
                {ops.map((o) => <option key={o.id} value={o.id} className="text-black">{o.name}</option>)}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-200">PIN</span>
              <input ref={pinRef} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} type="password" inputMode="numeric" autoComplete="off" required minLength={4} maxLength={8}
                className="w-full rounded-lg bg-white/10 p-2 text-white tracking-widest" />
            </label>
          </>
        )}
        {msg && <p role="alert" className="text-sm text-red-300">{msg}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">Cancelar</button>
          <button type="submit" disabled={busy || !opId || pin.length < 4} className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold disabled:opacity-50">{busy ? "Verificando…" : "Entrar"}</button>
        </div>
      </form>
    </div>
  );
}
