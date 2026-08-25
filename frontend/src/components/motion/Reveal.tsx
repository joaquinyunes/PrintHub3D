"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useMounted } from "./useMounted";

type Dir = "up" | "down" | "left" | "right" | "none";

const offset: Record<Dir, { x?: number; y?: number }> = {
  up: { y: 28 },
  down: { y: -28 },
  left: { x: 28 },
  right: { x: -28 },
  none: {},
};

export default function Reveal({
  children,
  dir = "up",
  delay = 0,
  className,
  once = true,
}: {
  children: ReactNode;
  dir?: Dir;
  delay?: number;
  className?: string;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  const mounted = useMounted();

  // SSR y primer render: contenido visible, sin transform (sin mismatch, sin FOUC).
  if (!mounted || reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset[dir] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
