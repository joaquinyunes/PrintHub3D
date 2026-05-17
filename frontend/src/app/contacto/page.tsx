"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, MessageCircle, MapPin, Mail, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { motion } from "framer-motion";

interface ContactSectionData {
  enabled: boolean;
  title: string;
  subtitle: string;
  badge: string;
  whatsapp: string;
  whatsappDisplay: string;
  instagram: string;
  instagramUrl: string;
  facebook: string;
  facebookUrl: string;
  location: string;
  email: string;
}

export default function ContactoPage() {
  const [sectionData, setSectionData] = useState<ContactSectionData | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(apiUrl("/api/settings/public"));
      if (res.ok) {
        const data = await res.json();
        setSectionData({
          enabled: true,
          title: data.contactInfo?.contactoTitle || 'Contactanos',
          subtitle: data.contactInfo?.contactoSubtitle || 'Estamos para ayudarte',
          badge: data.contactInfo?.contactoBadge || '📩 CONTACTO',
          whatsapp: data.contactInfo?.whatsapp || '',
          whatsappDisplay: data.contactInfo?.whatsappDisplay || '',
          instagram: data.contactInfo?.instagram || '',
          instagramUrl: data.contactInfo?.instagramUrl || '',
          facebook: data.contactInfo?.facebook || '',
          facebookUrl: data.contactInfo?.facebookUrl || '',
          location: data.contactInfo?.location || '',
          email: data.contactInfo?.email || ''
        });
      }
    } catch (e) {
      console.error("Error loading contacto:", e);
    }
  };

  const handleWhatsApp = () => {
    if (!sectionData?.whatsapp) return;
    const text = `Hola! Quiero consultar por${formData.name ? ` ${formData.name}` : ""}${formData.email ? ` (mi email: ${formData.email})` : ""}: ${formData.message}`;
    window.open(`https://wa.me/${sectionData.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }, 1000);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const socialLinks = [
    { key: 'whatsapp', icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.162-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.974 2.898 1.852 1.852 2.854 4.034 2.854 6.14 0 2.72-1.163 5.322-3.41 7.348l-1.565 1.11m4.084-3.176c.372-.621.55-1.304.54-2.005-.001-2.628-2.137-4.962-4.89-4.962-2.753 0-4.893 2.334-4.893 4.96 0 2.628 2.14 4.962 4.893 4.962 1.234 0 2.41-.463 3.303-1.287.162-.149.284-.33.374-.524.093-.197.053-.371-.027-.53-.079-.158-.285-.371-.43-.56-.144-.188-.288-.39-.372-.624-.085-.235-.093-.495-.001-.73.279-.697 1.79-2.12 2.89-2.12 1.18 0 2.17.797 2.79 1.77.62.974.65 1.95.65 2.003-.001 1.7-1.44 3.68-3.69 3.68"/>
      </svg>
    ), label: 'WhatsApp', value: sectionData?.whatsapp, link: sectionData?.whatsapp ? `https://wa.me/${sectionData.whatsapp}` : null, color: 'green', bg: 'bg-green-500/20', border: 'border-green-500/30', hover: 'hover:bg-green-500/30', text: 'text-green-400' },
    { key: 'instagram', icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ), label: 'Instagram', value: sectionData?.instagram, link: sectionData?.instagramUrl || (sectionData?.instagram ? `https://instagram.com/${sectionData.instagram}` : null), color: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500/30', hover: 'hover:bg-purple-500/30', text: 'text-purple-400', prefix: '@' },
    { key: 'facebook', icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ), label: 'Facebook', value: sectionData?.facebook, link: sectionData?.facebookUrl || (sectionData?.facebook ? `https://facebook.com/${sectionData.facebook}` : null), color: 'blue', bg: 'bg-blue-500/20', border: 'border-blue-500/30', hover: 'hover:bg-blue-500/30', text: 'text-blue-400', prefix: '' },
    { key: 'email', icon: <Mail className="w-7 h-7" />, label: 'Email', value: sectionData?.email, link: sectionData?.email ? `mailto:${sectionData.email}` : null, color: 'cyan', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', hover: 'hover:bg-cyan-500/30', text: 'text-cyan-400', prefix: '' },
  ].filter(item => item.value);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-500/5 via-transparent to-transparent rounded-full" />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Volver</span>
          </Link>
          <span className="font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">Contacto</span>
          <div className="w-20" />
        </div>
      </div>

      <div className="pt-24 pb-12 px-4 min-h-screen relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full border border-white/10 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-300">Disponible ahora</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-5 leading-tight">{sectionData?.title || 'Contactanos'}</h1>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">{sectionData?.subtitle || 'Estamos para ayudarte'}</p>
          </motion.div>

          {socialLinks.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {socialLinks.map((item, i) => (
                <motion.a
                  key={item.key}
                  href={item.link || '#'}
                  target={item.link ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className={`${item.bg} ${item.border} border rounded-2xl p-6 ${item.hover} transition-all cursor-pointer group`}
                >
                  <div className={`${item.text} mb-3 group-hover:scale-110 transition-transform`}>{item.icon}</div>
                  <p className="font-bold text-white text-sm">{item.label}</p>
                  {item.value && <p className={`${item.text} text-xs mt-1`}>{item.prefix}{item.value}</p>}
                </motion.a>
              ))}
            </motion.div>
          )}

          {sectionData?.location && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-xl mb-12">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-800 rounded-xl">
                  <MapPin className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Nuestra ubicación</p>
                  <p className="text-white font-medium">{sectionData.location}</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-2xl font-bold mb-6 text-center">Envianos un mensaje</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" placeholder="Tu nombre" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-gray-800/50 border border-gray-700/50 rounded-xl py-4 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-all" />
                <input type="email" placeholder="Tu email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-gray-800/50 border border-gray-700/50 rounded-xl py-4 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-all" />
              </div>
              <textarea placeholder="Tu mensaje..." rows={4} value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl py-4 px-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-all resize-none" />
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={sending || !formData.message.trim()} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 text-white py-4 px-6 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20">
                  {sending ? <><Loader2 className="w-5 h-5 animate-spin" />Enviando...</> : <><Mail className="w-5 h-5" />Enviar mensaje</>}
                </motion.button>
                {sectionData?.whatsapp && (
                  <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleWhatsApp} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-4 px-6 rounded-xl font-bold transition-all">
                    <MessageCircle className="w-5 h-5" />WhatsApp
                  </motion.button>
                )}
              </div>
              {sent && <p className="text-green-400 text-center text-sm py-2">Mensaje enviado correctamente!</p>}
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}