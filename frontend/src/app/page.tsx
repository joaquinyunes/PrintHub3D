"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowRight, ArrowUpRight, Search, Sparkles, Layers, Boxes, Timer } from "lucide-react";
import { motion } from "framer-motion";

import { apiUrl } from "@/lib/api";
import Appear from "@/components/motion/Appear";
import { useMounted } from "@/components/motion/useMounted";
import { WHATSAPP_PHONE } from "@/lib/config";
import type { Product } from "@/types";

import Nav from "@/components/store/Nav";
import Footer from "@/components/store/Footer";
import StoreProductCard from "@/components/store/ProductCard";
import GradientField from "@/components/motion/GradientField";
import Reveal from "@/components/motion/Reveal";
import Marquee from "@/components/motion/Marquee";
import Magnetic from "@/components/motion/Magnetic";
import CountUp from "@/components/motion/CountUp";
import Cursor from "@/components/motion/Cursor";

const Hero3D = dynamic(() => import("@/components/three/Hero3D"), { ssr: false });

const FALLBACK_CATS = [
  { icon: "🥤", name: "Vasos personalizados", desc: "River, Boca, Racing y tu escudo" },
  { icon: "🏆", name: "Trofeos y copas", desc: "Premios a medida, acabado premium" },
  { icon: "🔑", name: "Llaveros", desc: "Diseños únicos, texto y logos" },
  { icon: "🎮", name: "Funkos & figuras", desc: "Coleccionables impresos" },
  { icon: "🧩", name: "Piezas técnicas", desc: "Repuestos, prototipos, encastres" },
  { icon: "📦", name: "Organizadores", desc: "Guardado a medida para tu espacio" },
];

const MARQUEE = ["PLA", "PETG", "ABS", "TPU", "RESINA", "0.1 mm", "24–72 h", "CORRIENTES", "DISEÑO PROPIO", "ENVÍOS"];

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [home, setHome] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    fetch(apiUrl("/api/products/public?tenantId=global3d_hq"))
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch(apiUrl("/api/settings/public"))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.homepageSections) setHome(d.homepageSections);
        if (d?.contactInfo) setContact(d.contactInfo);
      })
      .catch(() => {});
  }, []);

  const hero = home || {};
  const stats = hero.heroStats || {};

  const categories = useMemo(() => {
    const list = home?.productCategories;
    if (Array.isArray(list) && list.filter((c: any) => c?.name?.trim()).length) {
      return list
        .filter((c: any) => c?.name?.trim())
        .map((c: any) => ({ icon: c.icon || "▲", name: c.name, desc: c.description || "Personalizado a tu gusto" }));
    }
    return FALLBACK_CATS;
  }, [home]);

  const featured = products.slice(0, 8);
  const mounted = useMounted();

  const goQuote = () => router.push("/cotizar");
  const buyWA = (p: Product) => {
    const text = `Hola! Quiero encargar: *${p.name}* ($${p.price}).`;
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`, "_blank");
  };
  const track = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) router.push(`/track?code=${encodeURIComponent(code.trim())}`);
  };
  const searchProducts = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(q.trim() ? `/productos?q=${encodeURIComponent(q.trim())}` : "/productos");
  };

  return (
    <div className="min-h-screen bg-ground text-ink">
      <Cursor />
      <Nav onQuote={goQuote} />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16">
        <GradientField />
        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 pb-10 pt-12 md:grid-cols-2 md:px-6 md:pb-20 md:pt-20">
          <div>
            <Appear delay={0} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-resin" />
              {hero.heroBadge || "Taller de impresión 3D · Corrientes"}
            </Appear>

            <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.95] tracking-tight text-balance">
              {(hero.heroTitle || "Tu idea, impresa en 24 horas").split(" ").map((w: string, i: number) => {
                const hot = w === "3D" || w.toLowerCase() === "impresa";
                return mounted ? (
                  <motion.span
                    key={i}
                    className="inline-block"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <span className={hot ? "text-flux" : undefined}>{w}</span>&nbsp;
                  </motion.span>
                ) : (
                  <span key={i} className="inline-block">
                    <span className={hot ? "text-flux" : undefined}>{w}</span>&nbsp;
                  </span>
                );
              })}
            </h1>

            <Appear delay={0.45} className="mt-5 max-w-md text-pretty text-base text-ink-dim md:text-lg">
              {hero.heroDescription ||
                "Diseñamos e imprimimos piezas a medida con precisión de 0,1 mm. Vasos, trofeos, repuestos y proyectos personalizados."}
            </Appear>

            <Appear delay={0.55} className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <button
                  onClick={goQuote}
                  className="group flex items-center gap-2 rounded-full bg-flux px-6 py-3.5 font-mono text-xs uppercase tracking-[0.14em] text-white shadow-xl shadow-flare/30 transition hover:brightness-110"
                >
                  Cotizar mi pieza
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Magnetic>
              <Link
                href="/productos"
                className="rounded-full border border-white/15 px-6 py-3.5 font-mono text-xs uppercase tracking-[0.14em] text-ink-dim transition hover:border-flame/50 hover:text-ink"
              >
                Ver catálogo
              </Link>
            </Appear>

            <Appear delay={0.7} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <form onSubmit={searchProducts} className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <Search className="h-4 w-4 text-ink-dim" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar en el catálogo"
                  className="w-full bg-transparent text-sm text-ink placeholder:text-ink-dim/60 focus:outline-none"
                />
              </form>
              <form onSubmit={track} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Código de seguimiento"
                  className="w-40 bg-transparent font-mono text-sm uppercase text-ink placeholder:text-ink-dim/60 focus:outline-none"
                />
                <button type="submit" className="text-flame" aria-label="Rastrear">
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </form>
            </Appear>
          </div>

          <div className="relative h-[340px] md:h-[520px]">
            <Hero3D />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
              <span className="rounded-full border border-white/10 bg-ground/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim backdrop-blur">
                render en vivo
              </span>
            </div>
          </div>
        </div>

        <Marquee className="border-y border-white/10 bg-white/[0.02] py-3" duration={38}>
          {MARQUEE.map((m, i) => (
            <span key={i} className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.25em] text-ink-dim">
              {m} <span className="text-flame">/</span>
            </span>
          ))}
        </Marquee>
      </section>

      {/* ── STATS ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4">
          {[
            { v: parseInt(stats.orders) || 500, suffix: "+", label: "pedidos entregados" },
            { v: parseFloat(stats.reviews) || 4.9, decimals: 1, label: "estrellas de reseña" },
            { v: 72, suffix: " h", label: "entrega promedio" },
            { v: 6, suffix: "+", label: "materiales disponibles" },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.05} className="bg-ground-2 p-6 text-center">
              <div className="font-display text-4xl text-flux">
                <CountUp to={s.v} suffix={s.suffix} decimals={s.decimals || 0} />
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-dim">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CATEGORÍAS ─────────────────────────────────────── */}
      <section id="categorias" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <Reveal className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-flame">Qué imprimimos</p>
            <h2 className="mt-2 font-display text-[clamp(1.9rem,4vw,3rem)] leading-tight">Elegí un punto de partida</h2>
          </div>
          <Link href="/productos" className="hidden shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-ink-dim hover:text-flame md:block">
            Ver todo →
          </Link>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.slice(0, 6).map((c: any, i: number) => (
            <Reveal key={c.name} delay={i * 0.05}>
              <Link
                href="/productos"
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ground-2 p-6 transition-colors hover:border-flame/40"
              >
                <div className="grain absolute inset-0 opacity-30" />
                <span className="relative text-3xl">{c.icon}</span>
                <h3 className="relative mt-4 font-display text-xl">{c.name}</h3>
                <p className="relative mt-1 text-sm text-ink-dim">{c.desc}</p>
                <ArrowUpRight className="relative mt-6 h-5 w-5 text-ink-dim transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-flame" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ──────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-white/10 bg-ground-2 py-20">
        <GradientField className="opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-flame">Cómo funciona</p>
            <h2 className="mt-2 font-display text-[clamp(1.9rem,4vw,3rem)] leading-tight">De la idea a la pieza, en 3 pasos</h2>
          </Reveal>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { n: "01", icon: Sparkles, t: "Contanos tu idea", d: "Subís tu archivo o nos describís la pieza por WhatsApp. Sin STL también sirve." },
              { n: "02", icon: Layers, t: "Cotizamos al instante", d: "Calculamos material, tiempo de impresión y precio con nuestro cotizador." },
              { n: "03", icon: Boxes, t: "Imprimimos y entregamos", d: "Producción en 24–72 h. Retirás en el taller o te lo enviamos." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className="relative h-full rounded-2xl border border-white/10 bg-ground/60 p-6">
                  <span className="font-mono text-sm text-ink-dim/50">{s.n}</span>
                  <s.icon className="mt-4 h-7 w-7 text-flame" />
                  <h3 className="mt-4 font-display text-xl">{s.t}</h3>
                  <p className="mt-2 text-sm text-ink-dim">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTACADOS ─────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 md:px-6">
          <Reveal className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-flame">Catálogo</p>
              <h2 className="mt-2 font-display text-[clamp(1.9rem,4vw,3rem)] leading-tight">Listos para llevar</h2>
            </div>
            <Link href="/productos" className="shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-ink-dim hover:text-flame">
              Ver todo →
            </Link>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p._id} delay={(i % 4) * 0.05}>
                <StoreProductCard product={p} onWhatsApp={buyWA} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA FINAL ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <GradientField />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center md:px-6">
          <Reveal>
            <Timer className="mx-auto h-8 w-8 text-flame" />
            <h2 className="mt-5 font-display text-[clamp(2.2rem,5vw,4rem)] leading-[0.95] text-balance">
              ¿Tenés una pieza en mente?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-ink-dim">
              Mandanos la idea y te devolvemos precio y plazo el mismo día.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Magnetic>
                <button
                  onClick={goQuote}
                  className="rounded-full bg-flux px-7 py-4 font-mono text-xs uppercase tracking-[0.14em] text-white shadow-xl shadow-flare/30 transition hover:brightness-110"
                >
                  Cotizar ahora
                </button>
              </Magnetic>
              <a
                href={`https://wa.me/${WHATSAPP_PHONE}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/15 px-7 py-4 font-mono text-xs uppercase tracking-[0.14em] text-ink-dim transition hover:border-resin/50 hover:text-ink"
              >
                Escribir por WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer contact={contact} />
    </div>
  );
}
