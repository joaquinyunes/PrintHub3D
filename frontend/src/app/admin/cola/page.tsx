"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { usePolling } from "@/hooks/usePolling";

// Cola "¿Qué imprimo?" (portada de global3d-corrientes): piezas pendientes agrupadas por color o por cliente.
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
}
interface Group {
  key: string;
  label: string;
  swatch: string | null;
  entries: Entry[];
}

const TONE = { late: "text-red-400", soon: "text-amber-400", ok: "text-gray-400" } as const;
const NEXT_LABEL = { pending: "Empezar", printing: "Terminar", done: "Reabrir" } as const;

export default function ColaPage() {
  const [mode, setMode] = useState<"color" | "customer">("color");
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/production-queue/queue?group=${mode}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Error ${res.status}`);
      setGroups((await res.json()).groups);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }, [mode]);

  useEffect(() => { load(); }, [load]);
  usePolling(load, 15000);

  const advance = async (id: string) => {
    const res = await apiFetch(`/api/production-queue/pieces/${id}/advance`, { method: "PATCH" });
    if (!res.ok) setError((await res.json().catch(() => ({}))).message || "No se pudo actualizar la pieza.");
    await load();
  };

  return (
    <div className="p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">¿Qué imprimo?</h1>
          <p className="text-sm text-gray-400">Piezas pendientes, lo más urgente primero.</p>
        </div>
        <div className="flex gap-2">
          {(["color", "customer"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 text-sm ${mode === m ? "bg-blue-600 text-white" : "bg-white/5 text-gray-300 hover:bg-white/10"}`}>
              {m === "color" ? "Por color" : "Por cliente"}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {!error && groups.length === 0 && <p className="text-gray-400">No hay piezas pendientes. Generá las piezas de un pedido para verlas acá.</p>}

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              {g.swatch && <span className="inline-block h-4 w-4 rounded-full border border-white/20" style={{ background: g.swatch }} aria-hidden />}
              {g.label} <span className="text-xs font-normal text-gray-400">· {g.entries.length} pieza{g.entries.length === 1 ? "" : "s"}</span>
            </h2>
            <ul className="divide-y divide-white/5">
              {g.entries.map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium">{e.label} <span className="text-gray-400">· {e.quantityDone}/{e.quantityTotal}</span></p>
                    <p className="text-xs text-gray-400">{e.itemName} · {e.trackingCode}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${TONE[e.due.tone]}`}>{e.due.label}</span>
                    <button onClick={() => advance(e._id)} className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20">{NEXT_LABEL[e.status]}</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
