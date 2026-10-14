"use client";

import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative grid h-10 w-10 place-items-center rounded-md border-2 border-ink bg-white text-ink shadow-hard-sm transition-transform hover:-translate-y-px"
      aria-label={`Carrito${itemCount > 0 ? `, ${itemCount} productos` : ""}`}
    >
      <ShoppingBasket className="h-5 w-5" strokeWidth={2.4} />
      {itemCount > 0 && (
        <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-sm border-2 border-ink bg-signal px-1 text-[11px] font-extrabold leading-none text-ink">
          {itemCount > 99 ? "99" : itemCount}
        </span>
      )}
    </Link>
  );
}
