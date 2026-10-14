"use client";

import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { resolveMediaUrl } from "@/lib/api";

interface ProductCardProps {
  product: Product;
  handleWhatsAppBuy: (item: Product) => void;
}

/** Tarjeta de producto de la tienda: papel, borde de tinta, sombra dura y etiqueta de precio. */
export default function ProductCard({ product, handleWhatsAppBuy }: ProductCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const add = () => {
    addToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  const url = product.imageUrl ? resolveMediaUrl(product.imageUrl) : "";
  const drawing = url.endsWith(".svg");

  return (
    <article className="card-hard flex h-full flex-col overflow-hidden transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg">
      <div className="relative aspect-square border-b-2 border-ink bg-paper-2">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={product.name}
            loading="lazy"
            className={`absolute inset-0 h-full w-full ${drawing ? "object-contain p-5" : "object-cover"}`}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-xs font-extrabold uppercase tracking-widest text-steel-300">
            Sin imagen
          </div>
        )}
        {product.category && <span className="tag-plain absolute left-3 top-3">{product.category}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg uppercase leading-tight">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm leading-snug text-ink-soft">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="tag !text-sm">${product.price.toLocaleString("es-AR")}</span>
          <div className="flex gap-2">
            <button
              onClick={add}
              aria-label={`Agregar ${product.name} al carrito`}
              className="grid h-9 w-9 place-items-center rounded-md border-2 border-ink bg-white transition-colors hover:bg-signal"
            >
              {added ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
            </button>
            <button
              onClick={() => handleWhatsAppBuy(product)}
              className="btn btn-paper !px-3 !py-1.5 !text-xs"
            >
              Comprar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
