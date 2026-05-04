import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CartProviderWrapper from "@/components/CartProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GLOBAL 3D CORRIENTES",
  description: "Sistema de Gestión",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <CartProviderWrapper>{children}</CartProviderWrapper>
      </body>
    </html>
  );
}