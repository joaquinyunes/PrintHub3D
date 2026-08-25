"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import CartIcon from "@/components/CartIcon";
import Magnetic from "@/components/motion/Magnetic";

const links = [
  { href: "/productos", label: "Productos" },
  { href: "/impresoras", label: "Impresoras" },
  { href: "/filamentos", label: "Filamentos" },
  { href: "/track", label: "Rastreo" },
  { href: "/contacto", label: "Contacto" },
];

export default function Nav({ onQuote }: { onQuote?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-white/10 bg-ground/80 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-flux font-display text-sm text-white">3D</span>
          <span className="font-display text-lg tracking-tight text-ink">
            GLOBAL<span className="text-flame">3D</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group relative font-mono text-xs uppercase tracking-[0.15em] text-ink-dim transition hover:text-ink"
            >
              {l.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-flame transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <CartIcon />
          <Magnetic className="hidden md:block">
            <button
              onClick={onQuote}
              className="rounded-full bg-flux px-5 py-2 font-mono text-xs uppercase tracking-[0.12em] text-white shadow-lg shadow-flare/25 transition hover:brightness-110"
            >
              Cotizar
            </button>
          </Magnetic>
          <button className="md:hidden text-ink" onClick={() => setOpen((v) => !v)} aria-label="Menú">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-ground/95 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 font-mono text-sm uppercase tracking-[0.12em] text-ink-dim hover:bg-white/5 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                onQuote?.();
              }}
              className="mt-2 rounded-full bg-flux px-5 py-3 font-mono text-sm uppercase tracking-[0.12em] text-white"
            >
              Cotizar mi pieza
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
