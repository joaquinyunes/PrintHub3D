'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import PaymentButtons from '@/components/PaymentButtons';
import Nav from '@/components/store/Nav';
import Footer from '@/components/store/Footer';
import { WHATSAPP_PHONE } from '@/lib/config';
import { resolveMediaUrl } from '@/lib/api';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, total, depositTotal, itemCount } =
    useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  const validate = () => {
    if (name.trim().length < 2) {
      setFormError('Ingresá tu nombre.');
      return false;
    }
    if (phone.trim().replace(/\D/g, '').length < 6) {
      setFormError('Ingresá un teléfono válido.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleWhatsAppCheckout = () => {
    const itemsList = items
      .map(
        (item) =>
          `- ${item.product.name} x${item.quantity}: ${
            item.product.price > 0
              ? `$${(item.product.price * item.quantity).toLocaleString('es-AR')}`
              : 'a consultar'
          }`,
      )
      .join('\n');

    const message = `*Nuevo pedido - Global 3D*\n\n*Cliente:* ${name.trim()}\n*Tel:* ${phone.trim()}\n\n${itemsList}\n\n*Total:* $${total.toLocaleString('es-AR')}\n*Seña (50%):* $${depositTotal.toLocaleString('es-AR')}\n\nPor favor confirmar disponibilidad y datos para el envío.`;

    window.open(
      `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener',
    );
  };

  return (
    <div className="store min-h-screen">
      <Nav />

      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="font-display text-4xl uppercase md:text-5xl">Tu carrito</h1>

        {itemCount === 0 ? (
          <div className="card-hard mt-10 max-w-lg p-8">
            <h2 className="font-display text-2xl uppercase">Está vacío</h2>
            <p className="mt-2 text-ink-soft">Agregá productos para armar tu pedido.</p>
            <Link href="/productos" className="btn btn-signal mt-6">
              Ver productos
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_20rem]">
            <div className="space-y-4">
              {items.map((item) => {
                const url = item.product.imageUrl ? resolveMediaUrl(item.product.imageUrl) : '';
                return (
                  <div key={item.product._id} className="card-hard flex gap-4 p-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-sm border-2 border-ink bg-paper-2">
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={item.product.name}
                          className={`h-full w-full ${url.endsWith('.svg') ? 'object-contain p-1' : 'object-cover'}`}
                        />
                      ) : null}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="font-display text-lg uppercase leading-tight">{item.product.name}</h3>
                      {item.product.category && (
                        <span className="tag-plain mt-1 self-start">{item.product.category}</span>
                      )}
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                        <span className="whitespace-nowrap font-extrabold">
                          {item.product.price > 0
                            ? `$${item.product.price.toLocaleString('es-AR')}`
                            : 'A consultar'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                            aria-label="Menos"
                            className="grid h-8 w-8 place-items-center rounded-sm border-2 border-ink bg-white hover:bg-signal"
                          >
                            <Minus className="h-4 w-4" strokeWidth={3} />
                          </button>
                          <span className="w-6 text-center font-extrabold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                            aria-label="Más"
                            className="grid h-8 w-8 place-items-center rounded-sm border-2 border-ink bg-white hover:bg-signal"
                          >
                            <Plus className="h-4 w-4" strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.product._id)}
                            aria-label="Quitar"
                            className="ml-1 grid h-8 w-8 place-items-center rounded-sm border-2 border-ink bg-white hover:bg-danger hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="card-hard h-fit p-5">
              <h2 className="font-display text-xl uppercase">Resumen</h2>

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">
                    Nombre y apellido
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="field !py-2"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-extrabold uppercase tracking-wider">
                    WhatsApp / teléfono
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 379 4123456"
                    inputMode="tel"
                    className="field !py-2"
                  />
                </label>
                {formError && <p className="text-sm font-bold text-danger">{formError}</p>}
              </div>

              <dl className="mt-5 space-y-2 border-t-2 border-ink pt-4 text-sm">
                <div className="flex justify-between">
                  <dt>Productos ({itemCount})</dt>
                  <dd>${total.toLocaleString('es-AR')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Seña (50%)</dt>
                  <dd className="font-extrabold">${depositTotal.toLocaleString('es-AR')}</dd>
                </div>
                <div className="flex justify-between border-t-2 border-ink pt-3 text-lg font-extrabold">
                  <dt>Total</dt>
                  <dd>${total.toLocaleString('es-AR')}</dd>
                </div>
              </dl>

              <div className="mt-5">
                <PaymentButtons
                  total={total}
                  depositTotal={depositTotal}
                  items={items}
                  customer={{ name, phone }}
                  validate={validate}
                  onWhatsAppCheckout={handleWhatsAppCheckout}
                  clearCart={clearCart}
                />
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
