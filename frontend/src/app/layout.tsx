import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrintHub3D",
  description: "Sistema de Gestión",
};



// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}