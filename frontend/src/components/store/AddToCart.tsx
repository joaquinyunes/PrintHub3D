'use client';

import { useState } from 'react';
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types';

const MAX_QTY = 99;

/** Selector de unidades + "Agregar al carrito". */
export default function AddToCart({ product, className = '' }: { product: Product; className?: string }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const soldOut = product.stock === 0;
  const max = product.stock && product.stock > 0 ? Math.min(product.stock, MAX_QTY) : MAX_QTY;

  const add = () => {
    addToCart(product, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  const step = 'grid h-9 w-9 place-items-center bg-white transition-colors hover:bg-signal disabled:opacity-40';

  return (
    <div className={`flex items-stretch gap-2 ${className}`}>
      <div className="flex shrink-0 items-center overflow-hidden rounded-md border-2 border-ink">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={soldOut || qty <= 1}
          aria-label="Menos unidades"
          className={step}
        >
          <Minus size={14} strokeWidth={3} />
        </button>
        <span className="w-8 text-center text-sm font-extrabold tabular-nums" aria-live="polite">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(max, q + 1))}
          disabled={soldOut || qty >= max}
          aria-label="Más unidades"
          className={step}
        >
          <Plus size={14} strokeWidth={3} />
        </button>
      </div>
      <button
        type="button"
        onClick={add}
        disabled={soldOut}
        className="btn btn-signal flex-1 !px-3 !py-1.5 !text-xs disabled:opacity-50"
      >
        {added ? <Check size={16} strokeWidth={3} /> : <ShoppingCart size={16} strokeWidth={2.5} />}
        {soldOut ? 'Sin stock' : added ? 'Agregado' : 'Agregar'}
      </button>
    </div>
  );
}
