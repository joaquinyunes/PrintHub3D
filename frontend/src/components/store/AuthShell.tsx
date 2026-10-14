import Link from 'next/link';
import Logo from '@/components/brand/Logo';

/** Marco común de las pantallas de cuenta y de resultado de pago. */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="store flex min-h-screen flex-col">
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Logo />
          <Link href="/" className="text-sm font-extrabold uppercase tracking-wide underline-offset-4 hover:underline">
            Volver a la tienda
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {title && (
            <div className="mb-6">
              <h1 className="font-display text-3xl uppercase leading-tight md:text-4xl">{title}</h1>
              {subtitle && <p className="mt-2 text-ink-soft">{subtitle}</p>}
            </div>
          )}
          <div className="card-hard p-6 md:p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-sm border-2 border-danger bg-white px-3 py-2 text-sm font-bold text-danger">
      {children}
    </p>
  );
}
