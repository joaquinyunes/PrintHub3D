import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrintHub3D",
  description: "Sistema de Gestión",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
