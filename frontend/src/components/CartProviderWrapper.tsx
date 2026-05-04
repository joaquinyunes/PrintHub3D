"use client";

import React from "react";
import { CartProvider } from "@/context/CartContext";

export default function CartProviderWrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
