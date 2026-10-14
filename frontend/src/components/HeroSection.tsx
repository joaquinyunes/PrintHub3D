'use client';

import Link from 'next/link';

/** Portada: titular directo, dos acciones y la ilustración de góndola. */
export default function HeroSection() {
  return (
    <section className="border-b-2 border-ink">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:grid-cols-[1.1fr_1fr] md:px-6 md:py-20">
        <div>
          <span className="tag">Corrientes, Argentina</span>
          <h1 className="font-display mt-5 text-[clamp(2.8rem,7.4vw,6rem)] uppercase leading-[0.92]">
            Impresión 3D
            <br />
            <span className="marker">a medida</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
            Piezas personalizadas, impresoras, filamentos e insumos. Mandanos tu idea o elegí algo del
            catálogo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cotizar" className="btn btn-signal">
              Cotizar una pieza
            </Link>
            <a href="#pasillo-productos" className="btn btn-paper">
              Recorrer la tienda
            </a>
          </div>
        </div>

        <div className="card-hard overflow-hidden bg-paper-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/demo/hero-productos.svg"
            alt="Trofeo, vaso, figura y llavero impresos en 3D sobre un estante"
            className="aspect-[3/2] w-full object-contain p-4"
          />
        </div>
      </div>
    </section>
  );
}
