'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, MapPin, Mail, Phone, Instagram } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { WHATSAPP_PHONE, WHATSAPP_DISPLAY } from '@/lib/config';
import Nav from '@/components/store/Nav';
import Footer from '@/components/store/Footer';

interface Contact {
  whatsapp: string;
  whatsappDisplay: string;
  instagram: string;
  instagramUrl: string;
  location: string;
  email: string;
}

const DEFAULT_CONTACT: Contact = {
  whatsapp: WHATSAPP_PHONE,
  whatsappDisplay: WHATSAPP_DISPLAY,
  instagram: 'global3dcorrientes',
  instagramUrl: 'https://instagram.com/global3dcorrientes',
  location: 'Corrientes, Argentina',
  email: '',
};

export default function ContactoPage() {
  const [contact, setContact] = useState<Contact>(DEFAULT_CONTACT);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(apiUrl('/api/settings/public'), { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.contactInfo) {
          const c = data.contactInfo as Partial<Contact>;
          setContact({
            whatsapp: c.whatsapp || DEFAULT_CONTACT.whatsapp,
            whatsappDisplay: c.whatsappDisplay || DEFAULT_CONTACT.whatsappDisplay,
            instagram: c.instagram || DEFAULT_CONTACT.instagram,
            instagramUrl: c.instagramUrl || DEFAULT_CONTACT.instagramUrl,
            location: c.location || DEFAULT_CONTACT.location,
            email: c.email || '',
          });
        }
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  // No hay backend de email: el envío abre WhatsApp con el mensaje ya redactado,
  // que es el canal real por el que el negocio responde.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;
    const text = `Hola!${formData.name ? ` Soy ${formData.name}.` : ''}${
      formData.email ? ` (${formData.email})` : ''
    }\n${formData.message}`;
    window.open(
      `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener',
    );
    setSent(true);
    window.setTimeout(() => setSent(false), 4000);
  };

  const cards = [
    {
      icon: <Phone className="h-6 w-6" strokeWidth={2.5} />,
      label: 'WhatsApp',
      value: contact.whatsappDisplay,
      href: `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`,
      action: 'Escribir',
    },
    {
      icon: <Instagram className="h-6 w-6" strokeWidth={2.5} />,
      label: 'Instagram',
      value: `@${contact.instagram.replace('@', '')}`,
      href: contact.instagramUrl,
      action: 'Seguir',
    },
    {
      icon: <MapPin className="h-6 w-6" strokeWidth={2.5} />,
      label: 'Ubicación',
      value: contact.location,
    },
    ...(contact.email
      ? [
          {
            icon: <Mail className="h-6 w-6" strokeWidth={2.5} />,
            label: 'Email',
            value: contact.email,
            href: `mailto:${contact.email}`,
            action: 'Enviar',
          },
        ]
      : []),
  ];

  return (
    <div className="store min-h-screen">
      <Nav />

      <main className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
        <span className="tag">Contacto</span>
        <h1 className="font-display mt-4 text-[clamp(2.4rem,6vw,4.5rem)] uppercase leading-[0.95]">
          Hablemos<span className="marker">.</span>
        </h1>
        <p className="mt-4 max-w-lg text-lg text-ink-soft">Respondemos en el día.</p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {cards.map((c) => (
            <div key={c.label} className="card-hard flex items-start gap-4 p-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-sm border-2 border-ink bg-signal">
                {c.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-ink-soft">{c.label}</p>
                <p className="mt-0.5 truncate font-bold">{c.value}</p>
              </div>
              {c.href && c.action && (
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-paper shrink-0 !px-3 !py-1.5 !text-xs"
                >
                  {c.action}
                </a>
              )}
            </div>
          ))}
        </div>

        <section className="card-hard mt-12 p-6 md:p-10">
          <h2 className="font-display text-2xl uppercase">Escribinos</h2>
          <p className="mt-1 text-ink-soft">El mensaje se abre en WhatsApp, listo para enviar.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">Nombre</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="field"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">Email</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="field"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">Mensaje</span>
              <textarea
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="field resize-none"
              />
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" disabled={!formData.message.trim()} className="btn btn-signal disabled:opacity-50">
                <MessageCircle className="h-4 w-4" strokeWidth={3} /> Enviar por WhatsApp
              </button>
              {sent && <p className="text-sm font-bold">Se abrió WhatsApp con tu mensaje.</p>}
            </div>
          </form>
        </section>
      </main>

      <Footer contact={contact} />
    </div>
  );
}
