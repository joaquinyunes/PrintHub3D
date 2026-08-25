"use client";

/**
 * Fondo atmosférico: manchas de color desenfocadas que flotan lento + textura
 * de líneas de capa + grano. Puramente decorativo.
 */
export default function GradientField({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`grain pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="layer-lines absolute inset-0 opacity-60" />
      <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-flame/20 blur-[130px] animate-float-slow" />
      <div
        className="absolute -bottom-52 right-[-10rem] h-[40rem] w-[40rem] rounded-full bg-flare/15 blur-[150px] animate-float-slow"
        style={{ animationDelay: "-3s" }}
      />
      <div
        className="absolute left-1/3 top-1/4 h-[28rem] w-[28rem] rounded-full bg-resin/10 blur-[140px] animate-float-slow"
        style={{ animationDelay: "-6s" }}
      />
    </div>
  );
}
