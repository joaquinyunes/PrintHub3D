'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import CartIcon from '@/components/CartIcon';
import Logo from '@/components/brand/Logo';

const links = [
  { href: '/productos', label: 'Productos' },
  { href: '/impresoras', label: 'Impresoras' },
  { href: '/filamentos', label: 'Filamentos' },
  { href: '/track', label: 'Rastreo' },
  { href: '/contacto', label: 'Contacto' },
];

export default function Nav({ onQuote }: { onQuote?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setIsAdmin(JSON.parse(stored)?.user?.role === 'admin');
    } catch {
      /* ignore parse errors */
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const goQuote = onQuote || (() => router.push('/cotizar'));

  return (
    <header className="store sticky top-0 z-50 border-b-2 border-ink bg-paper">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-sm px-3 py-2 text-sm font-extrabold uppercase tracking-wide transition-colors ${
                  active ? 'bg-ink text-paper' : 'text-ink hover:bg-signal'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <CartIcon />
          <button onClick={goQuote} className="btn btn-signal hidden !py-2 md:inline-flex">
            Cotizar
          </button>
          {isAdmin ? (
            <div className="hidden items-center gap-1.5 md:flex">
              <Link href="/admin" className="btn btn-paper !py-2">
                Admin
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-sm p-2 text-ink transition hover:bg-signal"
                aria-label="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="hidden text-sm font-bold uppercase tracking-wide text-ink-soft underline-offset-4 hover:underline md:block"
            >
              Ingresar
            </Link>
          )}
          <button
            className="grid h-10 w-10 place-items-center rounded-md border-2 border-ink bg-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t-2 border-ink bg-paper px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-sm px-3 py-3 text-base font-extrabold uppercase tracking-wide hover:bg-signal"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={isAdmin ? '/admin' : '/admin/login'}
              onClick={() => setOpen(false)}
              className="rounded-sm px-3 py-3 text-base font-bold uppercase tracking-wide text-ink-soft hover:bg-signal"
            >
              {isAdmin ? 'Admin' : 'Ingresar'}
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                goQuote();
              }}
              className="btn btn-signal mt-3"
            >
              Cotizar mi pieza
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
