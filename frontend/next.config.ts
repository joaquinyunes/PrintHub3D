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
  // Fotos e ilustraciones casi no cambian: el navegador las reutiliza en vez de pedirlas en cada visita.
  async headers() {
    return [
      {
        source: "/:dir(photos|demo)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  async redirects() {
    return Object.entries(LEGACY_ADMIN_ROUTES).map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
