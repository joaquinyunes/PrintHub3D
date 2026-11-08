#!/usr/bin/env node
// Prueba de humo de una instancia ya desplegada (V4): ¿está viva y bien configurada?
//   API_URL=https://api.cliente.com WEB_URL=https://cliente.com node scripts/smoke-test.mjs
// Opcional (prueba también el login del admin): SMOKE_EMAIL=... SMOKE_PASSWORD=...
// Sale con código 1 si algo falla. No escribe datos (solo lecturas y un login).
const API = (process.env.API_URL || "").replace(/\/$/, "");
const WEB = (process.env.WEB_URL || "").replace(/\/$/, "");
if (!API || !WEB) {
  console.error("Falta API_URL y/o WEB_URL");
  process.exit(2);
}

let failed = 0;
const check = async (name, fn) => {
  try {
    const detail = await fn();
    console.log(`OK    ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (e) {
    failed++;
    console.log(`FALLA ${name} — ${e.message}`);
  }
};
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const get = (url, init) => fetch(url, { redirect: "manual", signal: AbortSignal.timeout(20000), ...init });

await check("API /api/health responde 200 y la base está OK", async () => {
  const r = await get(`${API}/api/health`);
  must(r.status === 200, `status ${r.status}`);
  const j = await r.json();
  must(j.services?.database?.status === "OK", `base: ${JSON.stringify(j.services?.database)}`);
  return `${Math.round(j.uptime)} s de uptime`;
});

await check("API: encabezados de seguridad", async () => {
  const r = await get(`${API}/api/health`);
  for (const h of ["x-content-type-options", "strict-transport-security", "referrer-policy", "permissions-policy"]) must(r.headers.get(h), `falta ${h}`);
});

await check("API: CORS cerrado a orígenes ajenos", async () => {
  const r = await get(`${API}/api/health`, { headers: { Origin: "https://sitio-ajeno.example" } });
  must(!r.headers.get("access-control-allow-origin"), "devuelve Access-Control-Allow-Origin a un origen ajeno");
});

await check("API: una ruta del panel sin sesión da 401", async () => {
  const r = await get(`${API}/api/orders`);
  must(r.status === 401, `status ${r.status}`);
});

await check("WEB: la tienda responde 200", async () => {
  const r = await get(`${WEB}/`);
  must(r.status === 200, `status ${r.status}`);
});

await check("WEB: CSP en bloqueo (no solo reporte) y sin X-Powered-By", async () => {
  const r = await get(`${WEB}/`);
  must(r.headers.get("content-security-policy"), "falta Content-Security-Policy");
  must(!r.headers.get("content-security-policy-report-only"), "todavía hay CSP solo-reporte");
  must(!r.headers.get("x-powered-by"), "expone X-Powered-By");
});

await check("WEB: /.well-known/security.txt existe", async () => {
  const r = await get(`${WEB}/.well-known/security.txt`);
  must(r.status === 200, `status ${r.status}`);
  must(!/COMPLETAR/.test(await r.text()), "security.txt todavía tiene el contacto sin completar");
});

if (process.env.SMOKE_EMAIL && process.env.SMOKE_PASSWORD) {
  await check("API: login del admin", async () => {
    const r = await get(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: process.env.SMOKE_EMAIL, password: process.env.SMOKE_PASSWORD, otp: process.env.SMOKE_OTP }),
    });
    must(r.status === 200, `status ${r.status}`);
  });
}

console.log(failed ? `\n${failed} chequeo(s) fallaron` : "\nTodo en orden");
process.exit(failed ? 1 : 0);
