import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import path from "path";

// Rutas del panel que se unificaron: se mantienen como redirects para no romper
// marcadores ni links viejos (antes eran páginas vacías con un useEffect).
const LEGACY_ADMIN_ROUTES: Record<string, string> = {
  "/admin/pedidos": "/admin/orders",
  "/admin/produccion": "/admin/production",
  "/admin/productos": "/admin/products",
  "/admin/gastos": "/admin/expenses",
};

// Origen de la API (el backend va en otro dominio): lo necesitan connect-src e img-src.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin;
  } catch {
    return "";
  }
})();

// Content-Security-Policy EN MODO BLOQUEO (S2). Límite conocido: Next.js inyecta scripts en línea y las
// páginas son estáticas, así que script-src conserva 'unsafe-inline' hasta pasar a nonces (requiere renderizado
// dinámico de todo el sitio; ver docs/SEGURIDAD.md). El resto de las directivas sí cierra: sin eval en producción,
// sin objetos/embeds, sin <base> ajeno, formularios y conexiones solo al propio sitio y a la API.
// Los héroes 3D (three.js) piden blob: y wasm; los archivos subidos vienen de la API o de Vercel Blob; el QR del panel
// se pide a api.qrserver.com. En desarrollo Next necesita eval para el hot reload.
const isDev = process.env.NODE_ENV !== "production";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${apiOrigin} https://*.public.blob.vercel-storage.com https://api.qrserver.com`,
  "font-src 'self' data:",
  `media-src 'self' blob: ${apiOrigin} https://*.public.blob.vercel-storage.com`,
  `connect-src 'self' ${apiOrigin}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

// Render no manda estos encabezados en un servicio web: los pone la app.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  output: "standalone",
  // Evita que Next infiera la raíz del monorepo (hay dos lockfiles) y anide
  // el output de standalone bajo .next/standalone/frontend/.
  outputFileTracingRoot: path.join(__dirname),
  // Fotos e ilustraciones casi no cambian: el navegador las reutiliza en vez de pedirlas en cada visita.
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
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

// Sin esta variable el sitio compilado apuntaría a localhost: mejor cortar el build.
const config = (phase: string): NextConfig => {
  if (phase === PHASE_PRODUCTION_BUILD && !process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("Falta NEXT_PUBLIC_API_URL (la URL pública de la API) para compilar en producción.");
  }
  return nextConfig;
};

export default config;
