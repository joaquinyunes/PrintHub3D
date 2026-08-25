"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { useMounted } from "./useMounted";

/**
 * Entrada al montar (no depende del scroll). Server-render visible → sin FOUC
 * ni mismatch de hidratación.
 */
export default function Appear({
  children,
  delay = 0,
  y = 18,
  className,
  as = "div",
  duration = 0.6,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "span" | "p" | "h1" | "li";
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const mounted = useMounted();
  const Tag = motion[as] as React.ComponentType<HTMLMotionProps<"div">>;

  if (!mounted || reduce) {
    const Plain = as as "div";
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}
