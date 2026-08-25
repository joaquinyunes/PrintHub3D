"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartIcon() {
  const { itemCount } = useCart();

  return (
    <a href="/cart" className="relative p-2 text-ink-dim transition hover:text-ink" aria-label="Carrito">
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-flame px-1 font-mono text-[10px] font-bold leading-none text-white">
          {itemCount > 99 ? "99" : itemCount}
        </span>
      )}
    </a>
  );
}
