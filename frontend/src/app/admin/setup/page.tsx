"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Rocket, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";

const STEPS = ["Tu taller", "Contacto", "Listo"];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState<any>({});
  const [form, setForm] = useState({
    businessName: "",
    currencySymbol: "$",
    adminPhone: "",
    monthlyGoal: "2000000",
    whatsapp: "",
    whatsappDisplay: "",
    instagram: "",
    location: "Corrientes, Argentina",
    email: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/settings");
        if (res.ok) {
          const s = await res.json();
          setCurrent(s);
          setForm((f) => ({
            ...f,
            businessName: s.businessName && s.businessName !== "Global 3D" ? s.businessName : "",
            currencySymbol: s.currencySymbol || "$",
            adminPhone: s.adminPhone || "",
            monthlyGoal: String(s.monthlyGoal || 2000000),
            whatsapp: s.contactInfo?.whatsapp || "",
            whatsappDisplay: s.contactInfo?.whatsappDisplay || "",
            instagram: s.contactInfo?.instagram || "",
            location: s.contactInfo?.location || "Corrientes, Argentina",
            email: s.contactInfo?.email || "",
          }));
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          businessName: form.businessName.trim() || "Mi Taller 3D",
          currencySymbol: form.currencySymbol || "$",
          adminPhone: form.adminPhone.trim(),
          monthlyGoal: Number(form.monthlyGoal) || 2000000,
          contactInfo: {
            ...(current.contactInfo || {}),
            whatsapp: form.whatsapp.trim(),
            whatsappDisplay: form.whatsappDisplay.trim() || form.whatsapp.trim(),
            instagram: form.instagram.trim(),
            location: form.location.trim(),
            email: form.email.trim(),
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "No se pudo guardar");
      setStep(2);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-tone-red" />
      </div>
    );
  }

  const field = (k: string, label: string, placeholder = "", type = "text") => (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wider text-gray-500">{label}</label>
      <input
        type={type}
        value={(form as any)[k]}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:border-tone-red/40 focus:outline-none"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] p-4 text-white md:p-8">
      <div className="mx-auto max-w-lg pt-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-tone-red/10 p-2">
            <Rocket className="h-6 w-6 text-tone-red" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Configurá tu taller</h1>
            <p className="text-xs text-gray-600">Un minuto. Podés cambiar todo después en Configuración.</p>
          </div>
        </div>

        <div className="mb-8 flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full ${i <= step ? "bg-tone-red" : "bg-white/10"}`} />
              <p className={`mt-1.5 text-[10px] uppercase tracking-wider ${i <= step ? "text-tone-red" : "text-gray-600"}`}>{s}</p>
            </div>
          ))}
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>}

        {step === 0 && (
          <div className="space-y-4">
            {field("businessName", "Nombre del negocio", "Global 3D Corrientes")}
            <div className="grid grid-cols-2 gap-4">
              {field("currencySymbol", "Símbolo de moneda", "$")}
              {field("monthlyGoal", "Meta mensual de facturación", "2000000", "number")}
            </div>
            {field("adminPhone", "Tu WhatsApp (para recibir avisos)", "5493794123456")}
            <button
              onClick={() => setStep(1)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-tone-red py-3 font-bold transition hover:bg-tone-red/90"
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {field("whatsapp", "WhatsApp del taller (para clientes)", "5493794123456")}
            {field("whatsappDisplay", "Cómo mostrarlo", "+54 9 379 412-3456")}
            {field("location", "Ubicación", "Corrientes, Argentina")}
            {field("email", "Email de contacto", "hola@tutaller.com")}
            {field("instagram", "Instagram", "@tutaller")}
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="rounded-xl border border-white/10 px-5 py-3 text-sm text-gray-400 hover:text-white">
                Atrás
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-tone-red py-3 font-bold transition hover:bg-tone-red/90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar y terminar"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rounded-2xl border border-white/5 bg-[#0f0f0f] p-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10">
              <Check className="h-7 w-7 text-emerald-400" />
            </div>
            <h2 className="text-xl font-black">Listo</h2>
            <p className="mt-2 text-sm text-gray-500">
              Ahora cargá tus productos, tus impresoras y tus precios. El resto de la web se edita en Inicio Web.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={() => router.push("/admin/products")} className="rounded-xl bg-tone-red py-3 font-bold transition hover:bg-tone-red/90">
                Cargar productos
              </button>
              <button onClick={() => router.push("/admin")} className="rounded-xl border border-white/10 py-3 text-sm text-gray-400 hover:text-white">
                Ir al dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
