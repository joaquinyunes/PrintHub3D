"use client";

import React from "react";
import { Product } from "@/types";
import AddToCart from "@/components/store/AddToCart";
import RevealImage from "@/components/store/RevealImage";
import { photoFor } from "@/lib/demoPhotos";
import { resolveMediaUrl } from "@/lib/api";

interface ProductCardProps {
  product: Product;
  handleWhatsAppBuy: (item: Product) => void;
}

/** Tarjeta de producto de la tienda: papel, borde de tinta, sombra dura y etiqueta de precio. */
export default function ProductCard({ product, handleWhatsAppBuy }: ProductCardProps) {
  const url = product.imageUrl ? resolveMediaUrl(product.imageUrl) : "";
  const photo = photoFor(product.imageUrl);

  return (
    <article className="card-hard flex h-full flex-col overflow-hidden transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg">
      <RevealImage
        src={url}
        photo={photo}
        alt={product.name}
        className="aspect-square border-b-2 border-ink bg-paper-2"
      >
        {product.category && (
          <span className="tag-plain pointer-events-none absolute left-3 top-3">{product.category}</span>
        )}
      </RevealImage>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg uppercase leading-tight">{product.name}</h3>
        {product.description && (
          <p className="line-clamp-2 text-sm leading-snug text-ink-soft">{product.description}</p>
        )}
        <div className="mt-auto space-y-3 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="tag !text-sm">${product.price.toLocaleString("es-AR")}</span>
            <button
              onClick={() => handleWhatsAppBuy(product)}
              className="btn btn-paper !px-3 !py-1.5 !text-xs"
            >
              Comprar
            </button>
          </div>
          <AddToCart product={product} />
        </div>
      </div>
    </article>
  );
}
