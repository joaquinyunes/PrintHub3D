"use client";

import Link from "next/link";
import { Instagram, MapPin, Mail, Phone } from "lucide-react";

interface Contact {
  whatsappDisplay?: string;
  instagram?: string;
  instagramUrl?: string;
  location?: string;
  email?: string;
}

export default function Footer({ contact }: { contact?: Contact }) {
  return (
    <footer className="relative border-t border-white/10 bg-ground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-flux font-display text-sm text-white">3D</span>
            <span className="font-display text-lg text-ink">
              GLOBAL<span className="text-flame">3D</span>
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-ink-dim">
            Impresión 3D de alta precisión en Corrientes. Piezas a medida, trabajos personalizados y suministros.
          </p>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">Tienda</p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["/productos", "Productos personalizados"],
              ["/impresoras", "Impresoras 3D"],
              ["/filamentos", "Filamentos y materiales"],
              ["/track", "Rastrear pedido"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-ink-dim transition hover:text-flame">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">Contacto</p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-dim">
            {contact?.whatsappDisplay && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-flame" /> {contact.whatsappDisplay}
              </li>
            )}
            {contact?.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-flame" /> {contact.email}
              </li>
            )}
            {contact?.location && (
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-flame" /> {contact.location}
              </li>
            )}
            {contact?.instagram && (
              <li>
                <a
                  href={contact.instagramUrl || `https://instagram.com/${contact.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 transition hover:text-flame"
                >
                  <Instagram className="h-4 w-4 text-flame" /> {contact.instagram}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-ink-dim/60">
        © {new Date().getFullYear()} Global 3D Corrientes
      </div>
    </footer>
  );
}
