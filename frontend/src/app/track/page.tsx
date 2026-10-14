'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Loader2, Search } from 'lucide-react';
import { apiUrl, resolveMediaUrl } from '@/lib/api';
import Nav from '@/components/store/Nav';
import Footer from '@/components/store/Footer';

const money = (n: number) => '$' + Math.round(n || 0).toLocaleString('es-AR');

interface StatusStep {
  key: string;
  label: string;
  isComplete: boolean;
  isCurrent: boolean;
  media?: {
    image?: string;
    video?: string;
    message: string;
  };
}

interface OrderData {
  trackingCode: string;
  clientName: string;
  status: string;
  statusLabel: string;
  progress: number;
  dueDate: string;
  createdAt: string;
  notes: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: string;
  deposit: number;
  media: {
    image?: string;
    video?: string;
    message: string;
  };
  statusSteps: StatusStep[];
  customVideoUrl?: string | null;
  customerSatisfaction?: number;
  customerFeedback?: string;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="store min-h-screen">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">{children}</main>
      <Footer />
    </div>
  );
}

function TrackContentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code') || '';

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customVideo, setCustomVideo] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [codeInput, setCodeInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  const payBalance = async () => {
    if (!order) return;
    setPayLoading(true);
    setPayError('');
    try {
      const res = await fetch(apiUrl('/api/payments/create-preference'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingCode: order.trackingCode, balance: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No se pudo generar el pago');
      const url = data.initPoint || data.sandboxInitPoint;
      if (url) window.location.href = url;
      else throw new Error('MercadoPago no devolvió un link');
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setPayLoading(false);
    }
  };

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(apiUrl(`/api/orders/track/${encodeURIComponent(code)}`));
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Pedido no encontrado');

        setOrder(data);

        const rawVideo = data.customVideoUrl;
        if (rawVideo && String(rawVideo).trim()) {
          setCustomVideo(resolveMediaUrl(String(rawVideo).trim()));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [code, router]);

  useEffect(() => {
    if (videoRef.current && customVideo) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [customVideo]);

  if (!code)
    return (
      <Shell>
        <span className="tag">Rastreo</span>
        <h1 className="font-display mt-4 text-4xl uppercase md:text-5xl">Rastrear mi pedido</h1>
        <p className="mt-3 max-w-md text-ink-soft">
          Ingresá el código que te enviamos para ver el estado de producción.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const c = codeInput.trim();
            if (c) router.push(`/track?code=${encodeURIComponent(c)}`);
          }}
          className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
        >
          <label className="relative flex-1">
            <span className="sr-only">Código</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              strokeWidth={3}
            />
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Ej: joaquin-vasoboca-17032026"
              className="field pl-10"
            />
          </label>
          <button type="submit" disabled={!codeInput.trim()} className="btn btn-signal disabled:opacity-50">
            Rastrear
          </button>
        </form>
      </Shell>
    );

  if (loading)
    return (
      <Shell>
        <div className="flex items-center gap-3 font-bold">
          <Loader2 className="h-5 w-5 animate-spin" /> Buscando tu pedido…
        </div>
      </Shell>
    );

  if (error || !order)
    return (
      <Shell>
        <h1 className="font-display text-4xl uppercase">Pedido no encontrado</h1>
        <p className="mt-3 text-ink-soft">{error || 'Revisá el código e intentá de nuevo.'}</p>
        <button onClick={() => router.push('/track')} className="btn btn-signal mt-6">
          Probar con otro código
        </button>
      </Shell>
    );

  const balance = Math.max(0, order.total - order.deposit);

  return (
    <Shell>
      <div className="space-y-6">
        <section className="card-hard p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ink-soft">Código</p>
              <h1 className="font-display break-all text-2xl uppercase">{order.trackingCode}</h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ink-soft">Estado</p>
              <span className="tag mt-1 !text-sm">{order.statusLabel}</span>
            </div>
          </div>
          <div
            className="mt-6 h-4 overflow-hidden rounded-sm border-2 border-ink bg-white"
            role="progressbar"
            aria-valuenow={order.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-signal transition-all duration-1000" style={{ width: `${order.progress}%` }} />
          </div>
        </section>

        <section className="card-hard overflow-hidden">
          <h2 className="border-b-2 border-ink px-6 py-4 font-display text-lg uppercase">Registro visual</h2>
          <div className="relative aspect-video bg-paper-2">
            {customVideo ? (
              <video
                ref={videoRef}
                key={customVideo}
                src={customVideo}
                controls
                autoPlay
                muted
                loop
                playsInline
                crossOrigin="anonymous"
                className="h-full w-full object-contain"
              />
            ) : order.media?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.media.image} alt="Estado del pedido" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-sm font-extrabold uppercase tracking-widest text-steel-300">
                Todavía no hay fotos o videos
              </div>
            )}
          </div>
          {order.media?.message && (
            <p className="border-t-2 border-ink px-6 py-4 text-sm text-ink-soft">{order.media.message}</p>
          )}
        </section>

        <section className="card-hard p-6">
          <h2 className="font-display text-lg uppercase">Línea de tiempo</h2>
          <ol className="relative mt-6 space-y-5">
            <span className="absolute bottom-2 left-[13px] top-2 w-0.5 bg-ink" aria-hidden />
            {order.statusSteps?.map((step) => (
              <li key={step.key} className="relative z-10 flex items-center gap-4">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-sm border-2 border-ink ${
                    step.isComplete ? 'bg-ink text-paper' : step.isCurrent ? 'bg-signal' : 'bg-white'
                  }`}
                >
                  {step.isComplete && <Check className="h-4 w-4" strokeWidth={3.5} />}
                </span>
                <span
                  className={`font-bold ${step.isComplete || step.isCurrent ? '' : 'text-steel-300'}`}
                >
                  {step.label}
                  {step.isCurrent && <span className="tag ml-2">Ahora</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {order.items && order.items.length > 0 && (
          <section className="card-hard p-6">
            <h2 className="font-display text-lg uppercase">Tu pedido</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span>
                    {it.productName} <span className="text-ink-soft">× {it.quantity}</span>
                  </span>
                  <span className="font-bold">{money(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t-2 border-ink pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Total</dt>
                <dd>{money(order.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Pagado</dt>
                <dd>{money(order.deposit)}</dd>
              </div>
              <div className="flex justify-between text-lg font-extrabold">
                <dt>Saldo</dt>
                <dd>{money(balance)}</dd>
              </div>
            </dl>

            {balance > 0 ? (
              <>
                <button onClick={payBalance} disabled={payLoading} className="btn btn-signal mt-5 w-full disabled:opacity-50">
                  {payLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Pagar saldo con MercadoPago
                </button>
                {payError && (
                  <p role="alert" className="mt-2 text-center text-sm font-bold text-danger">
                    {payError}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-5 flex items-center justify-center gap-2 rounded-md border-2 border-ink bg-signal py-2.5 text-sm font-extrabold uppercase tracking-wide">
                <Check className="h-4 w-4" strokeWidth={3.5} /> Pedido saldado
              </p>
            )}
          </section>
        )}
      </div>
    </Shell>
  );
}

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="store grid min-h-screen place-items-center font-bold">Cargando…</div>
      }
    >
      <TrackContentInner />
    </Suspense>
  );
}
