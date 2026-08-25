"use client";
import { useEffect, useState } from "react";

/** true después del primer render en cliente. Evita mismatches de hidratación con framer-motion. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
