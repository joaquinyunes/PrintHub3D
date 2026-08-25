import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CartProviderWrapper from "@/components/CartProviderWrapper";
import SmoothScroll from "@/components/motion/SmoothScroll";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});
const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Global 3D Corrientes — Impresión 3D a medida",
  description:
    "Impresión 3D de alta precisión en Corrientes. Vasos, trofeos, llaveros y piezas personalizadas. Cotizá tu idea en segundos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        <SmoothScroll>
          <CartProviderWrapper>{children}</CartProviderWrapper>
        </SmoothScroll>
      </body>
    </html>
  );
}
