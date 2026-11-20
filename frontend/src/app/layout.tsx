import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import CartProviderWrapper from '@/components/CartProviderWrapper';
import SmoothScroll from '@/components/motion/SmoothScroll';
import DemoBanner from '@/components/DemoBanner';

// Una sola familia con eje de ancho: titulares anchos y pesados, texto normal.
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-body',
  display: 'swap',
});
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Global 3D Corrientes — Impresión 3D a medida',
  description:
    'Impresión 3D en Corrientes: productos personalizados, impresoras Bambu Lab, filamentos e insumos. Cotizá tu pieza online.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Leer los encabezados hace dinámico el renderizado: cada pedido recibe su propio nonce de CSP (src/proxy.ts).
  await headers();
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${archivo.variable} ${mono.variable}`}
    >
      <body className="antialiased" suppressHydrationWarning>
        <SmoothScroll>
          <CartProviderWrapper>{children}</CartProviderWrapper>
        </SmoothScroll>
        <DemoBanner />
      </body>
    </html>
  );
}
