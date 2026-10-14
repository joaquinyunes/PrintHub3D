"use client";

import Link from "next/link";
import { Instagram, MapPin, Mail, Phone } from "lucide-react";
import Logo from "@/components/brand/Logo";

interface Contact {
  whatsappDisplay?: string;
  instagram?: string;
  instagramUrl?: string;
  location?: string;
  email?: string;
}

const shop = [
  ["/productos", "Productos personalizados"],
  ["/impresoras", "Impresoras 3D"],
  ["/filamentos", "Filamentos e insumos"],
  ["/cotizar", "Cotizar una pieza"],
  ["/track", "Rastrear pedido"],
];

export default function Footer({ contact }: { contact?: Contact }) {
  const location = contact?.location || "Corrientes, Argentina";
  return (
    <footer className="store border-t-2 border-ink !bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.3fr_1fr_1fr] md:px-6">
        <div>
          <Logo invert />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-steel-200">
            Impresión 3D en Corrientes: piezas a medida, impresoras, filamentos e insumos.
          </p>
        </div>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-signal">Tienda</p>
          <ul className="mt-4 space-y-2 text-sm">
            {shop.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-paper underline-offset-4 hover:text-signal hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-signal">Contacto</p>
          <ul className="mt-4 space-y-2.5 text-sm text-steel-100">
            {contact?.whatsappDisplay && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-signal" /> {contact.whatsappDisplay}
              </li>
            )}
            {contact?.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-signal" /> {contact.email}
              </li>
            )}
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-signal" /> {location}
            </li>
            {contact?.instagram && (
              <li>
                <a
                  href={contact.instagramUrl || `https://instagram.com/${contact.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 underline-offset-4 hover:text-signal hover:underline"
                >
                  <Instagram className="h-4 w-4 text-signal" /> {contact.instagram}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t-2 border-steel-300/30 py-5 text-center text-xs font-bold uppercase tracking-[0.15em] text-steel-300">
        © {new Date().getFullYear()} Global 3D · Corrientes
      </div>
    </footer>
  );
}
