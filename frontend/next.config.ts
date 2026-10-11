import type { NextConfig } from "next";
import path from "path";

// Rutas del panel que se unificaron: se mantienen como redirects para no romper
// marcadores ni links viejos (antes eran páginas vacías con un useEffect).
const LEGACY_ADMIN_ROUTES: Record<string, string> = {
  "/admin/pedidos": "/admin/orders",
  "/admin/produccion": "/admin/production",
  "/admin/productos": "/admin/products",
  "/admin/gastos": "/admin/expenses",
};

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  // Evita que Next infiera la raíz del monorepo (hay dos lockfiles) y anide
  // el output de standalone bajo .next/standalone/frontend/.
  outputFileTracingRoot: path.join(__dirname),
  async redirects() {
    return Object.entries(LEGACY_ADMIN_ROUTES).map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
