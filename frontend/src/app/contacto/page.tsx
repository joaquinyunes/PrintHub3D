"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, MessageCircle, MapPin, Mail, Loader2, Phone, Instagram } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { motion } from "framer-motion";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </div>
  );
}

const DEFAULT_CONTACT = {
  whatsapp: "5493794000000",
  whatsappDisplay: "+54 9379 4000000",
  instagram: "global3dcorrientes",
  instagramUrl: "https://instagram.com/global3dcorrientes",
  location: "Corrientes, Argentina",
  email: "contacto@global3d.com",
};

export default function ContactoPage() {
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [loaded, setLoaded] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(apiUrl("/api/settings/public"))
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.contactInfo) {
          setContact({ ...DEFAULT_CONTACT, ...data.contactInfo });
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleWhatsApp = () => {
    const text = `Hola!${formData.name ? ` Soy ${formData.name}` : ""}${formData.message ? `: ${formData.message}` : ""}`;
    window.open(`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }, 1200);
  };

  const contactCards = [
    {
      icon: <Phone className="w-6 h-6" />,
      label: "WhatsApp",
      value: contact.whatsappDisplay,
      action: { label: "Escribir", onClick: handleWhatsApp },
      accent: "#22c55e",
      bgGlow: "rgba(34,197,94,0.08)",
    },
    {
      icon: <Instagram className="w-6 h-6" />,
      label: "Instagram",
      value: `@${contact.instagram}`,
      action: { label: "Seguir", href: contact.instagramUrl },
      accent: "#e94c89",
      bgGlow: "rgba(233,76,137,0.08)",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      label: "Ubicación",
      value: contact.location,
      accent: "#f59e0b",
      bgGlow: "rgba(245,158,11,0.08)",
    },
    {
      icon: <Mail className="w-6 h-6" />,
      label: "Email",
      value: contact.email,
      action: { label: "Enviar", href: `mailto:${contact.email}` },
      accent: "#3b82f6",
      bgGlow: "rgba(59,130,246,0.08)",
    },
  ];

  const renderCard = (card: typeof contactCards[0], delay: number, extraClass = "") => (
    <motion.div
      key={card.label}
      initial={{ opacity: 0, y: 30 }}
      animate={loaded ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`group relative bg-tone-dark/60 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all duration-500 ${extraClass}`}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(600px circle at 50% 50%, ${card.bgGlow}, transparent 70%)` }}
      />
      <div className="relative z-10 flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${card.accent}15`, color: card.accent }}
        >
          {card.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">{card.label}</p>
          <p className="text-white font-medium truncate">{card.value}</p>
        </div>
        {card.action && (
          "onClick" in card.action ? (
            <button
              onClick={card.action.onClick}
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all border border-white/5 hover:border-white/10"
            >
              {card.action.label}
            </button>
          ) : (
            <a
              href={card.action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all border border-white/5 hover:border-white/10"
            >
              {card.action.label}
            </a>
          )
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-tone-darker font-mono">
      <div className="fixed top-0 left-0 right-0 z-50 bg-tone-darker/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Link>
          <span className="text-xs text-gray-600 uppercase tracking-widest">Contacto</span>
          <div className="w-20" />
        </div>
      </div>

      <main className="pt-32 pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-tone-red/30 bg-tone-red/10 text-tone-red text-xs tracking-[0.15em] uppercase mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-tone-red animate-pulse" />
                Contacto
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="text-4xl md:text-6xl font-bold text-white mb-4"
              >
                Hablemos
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="text-gray-500 text-lg max-w-xl mx-auto"
              >
                Respondemos en el día
              </motion.p>
            </div>
          </RevealSection>

          <div className="flex flex-col gap-4 mb-16">
            <div className="grid md:grid-cols-3 gap-4">
              {contactCards.slice(0, 3).map((card, i) => renderCard(card, 0.3 + i * 0.1))}
            </div>
            {renderCard(contactCards[3], 0.6, "max-w-md mx-auto w-full")}
          </div>

          <RevealSection delay={0.2}>
            <div className="bg-tone-dark/60 border border-white/5 rounded-xl p-8 md:p-10">
              <div className="max-w-xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-2 text-center">Mensaje directo</h2>
                <p className="text-gray-600 text-sm text-center mb-8">Te respondemos a la brevedad</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 focus:bg-tone-darker transition-all"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 focus:bg-tone-darker transition-all"
                    />
                  </div>

                  <textarea
                    placeholder="Mensaje"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-tone-darker/80 border border-white/5 rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-tone-red/40 focus:bg-tone-darker transition-all resize-none"
                  />

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={sending || !formData.message.trim()}
                      className="flex-1 flex items-center justify-center gap-2 bg-tone-red hover:bg-tone-red/90 disabled:bg-gray-800 disabled:text-gray-600 text-white py-3 px-6 rounded-lg text-sm font-medium transition-all"
                    >
                      {sending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Enviando</>
                      ) : (
                        <><Mail className="w-4 h-4" /> Enviar mensaje</>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 px-6 rounded-lg text-sm font-medium transition-all border border-white/5 hover:border-white/10"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                  </div>

                  {sent && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-sm text-tone-amber pt-2"
                    >
                      Mensaje enviado correctamente
                    </motion.p>
                  )}
                </form>
              </div>
            </div>
          </RevealSection>
        </div>
      </main>

    </div>
  );
}
