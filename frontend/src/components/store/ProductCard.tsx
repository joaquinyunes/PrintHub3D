"use client";

import Tilt from "react-parallax-tilt";
import { ShoppingCart, Plus, Box, Check } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { resolveMediaUrl } from "@/lib/api";

export default function ProductCard({
  product,
  onWhatsApp,
}: {
  product: Product;
  onWhatsApp: (p: Product) => void;
}) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const add = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Tilt
      glareEnable
      glareMaxOpacity={0.12}
      glareColor="#ff5c1a"
      glarePosition="all"
      tiltMaxAngleX={7}
      tiltMaxAngleY={7}
      transitionSpeed={900}
      className="h-full [transform-style:preserve-3d]"
    >
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ground-2/80 backdrop-blur-xl transition-colors hover:border-flame/40">
        <div className="relative aspect-square overflow-hidden bg-ground-3 layer-lines">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveMediaUrl(product.imageUrl)}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/15">
              <Box className="h-16 w-16" />
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-ground/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-dim backdrop-blur">
            {product.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-display text-lg leading-tight text-ink">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink-dim">{product.description || "Pieza personalizada"}</p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-4">
            <span className="font-display text-2xl text-flux">${product.price.toLocaleString("es-AR")}</span>
            <div className="flex gap-2">
              <button
                onClick={add}
                aria-label="Agregar al carrito"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-ink transition hover:border-flame/50 hover:text-flame"
              >
                {added ? <Check size={17} className="text-resin" /> : <Plus size={17} />}
              </button>
              <button
                onClick={() => onWhatsApp(product)}
                aria-label="Comprar por WhatsApp"
                className="grid h-10 w-10 place-items-center rounded-xl bg-flux text-white shadow-lg shadow-flare/25 transition hover:brightness-110"
              >
                <ShoppingCart size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Tilt>
  );
}
