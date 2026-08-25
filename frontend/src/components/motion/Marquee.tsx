"use client";

import type { ReactNode } from "react";

export default function Marquee({
  children,
  duration = 32,
  reverse = false,
  className = "",
}: {
  children: ReactNode;
  duration?: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={`group relative flex overflow-hidden ${className}`}>
      <div
        className="flex shrink-0 items-center gap-6 pr-6 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ ["--marquee-duration" as string]: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="flex shrink-0 items-center gap-6 pr-6 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ ["--marquee-duration" as string]: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {children}
      </div>
    </div>
  );
}
