import { NextRequest, NextResponse } from "next/server";

// Content-Security-Policy con NONCE por pedido (S2): los scripts en línea que Next.js inyecta llevan el nonce y
// cualquier otro script en línea (el de un atacante) se bloquea. Requiere renderizado dinámico (ver layout.tsx).
// styles: se mantiene 'unsafe-inline' porque los componentes usan atributos style="" (riesgo mucho menor que en scripts).
// Los héroes 3D (three.js) piden blob: y wasm; los archivos subidos vienen de la API o de Vercel Blob; el QR del panel
// se pide a api.qrserver.com. En desarrollo React necesita eval para el hot reload.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "").origin;
  } catch {
    return "";
  }
})();

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  // Páginas: sin /api, assets estáticos ni prefetch (no necesitan CSP propia).
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|photos|demo|videos|\\.well-known).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
