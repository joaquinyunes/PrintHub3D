/**
 * Ilustraciones de la tienda: vectores planos estilo "calcomanía troquelada".
 * Uso: node scripts/gen-illustrations.mjs
 *
 * Reglas del estilo (una sola paleta, cero fotos, cero IA):
 *  - contorno de tinta grueso y uniforme, uniones redondeadas
 *  - pocas formas planas en grises fríos / crema; un degradado radial solo en metal
 *  - líneas finas paralelas para el detalle (capas, ranuras, roscas)
 *  - UN color de acento por pieza + un trazo blanco curvo como brillo
 *  - calcomanía: borde crema que sigue la silueta + sombra dura de tinta, sin desenfoque
 * Salen en public/demo con los mismos nombres que usa el catálogo (se pisan los viejos).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/demo');
mkdirSync(OUT, { recursive: true });

const INK = '#0d0e0f';
const CREAM = '#f2efe8';
const G1 = '#d7dbe0';
const G2 = '#b4b9be';
const G3 = '#9aa1a8';
const ACC = '#ffd21f';
const SW = 8;

/* ---------- primitivas ---------- */
const shape = (d, fill, w = SW) =>
  `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const rect = (x, y, w, h, fill, r = 0, sw = SW) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const circ = (cx, cy, r, fill, sw = SW) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const ell = (cx, cy, rx, ry, fill, sw = SW) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
const line = (d, w = 3) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const hi = (d, w = 8) =>
  `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity=".7"/>`;
/** Tubo con contorno (asas, filamento, sorbete): tinta gruesa debajo, relleno encima. */
const tube = (d, fill, w = 18) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + SW * 2}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const star = (cx, cy, R, r, fill) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)} ${(cy + Math.sin(a) * rad).toFixed(1)}`);
  }
  return shape(`M${pts.join(' L')} Z`, fill, 6);
};
const layers = (x1, x2, ys) => ys.map((y) => line(`M${x1} ${y} H${x2}`, 3)).join('');

/* ---------- objetos (centrados en 0,0; caben en ~440x440) ---------- */
const spool = (fill = ACC, strand = true) => `
  ${strand ? tube('M118 120 C 190 190, 262 150, 240 236', fill, 14) : ''}
  ${circ(0, 0, 200, G1)}
  ${circ(0, 0, 156, fill, 6)}
  ${[138, 120, 102].map((r) => `<circle r="${r}" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".55"/>`).join('')}
  ${circ(0, 0, 76, CREAM, 6)}
  ${[0, 120, 240]
    .map((a) => {
      const r = (a * Math.PI) / 180;
      return line(`M${(Math.cos(r) * 40).toFixed(1)} ${(Math.sin(r) * 40).toFixed(1)} L${(Math.cos(r) * 70).toFixed(1)} ${(Math.sin(r) * 70).toFixed(1)}`, 3);
    })
    .join('')}
  ${circ(0, 0, 30, INK, 5)}
  ${hi('M-150 -116 A 190 190 0 0 1 -62 -176')}`;

const printerEnclosed = (variant) => `
  ${circ(0, -196, 46, G2)}${circ(0, -196, 16, INK, 5)}
  ${rect(-210, 170, 420, 50, G3, 12)}
  ${rect(-190, -170, 380, 350, G1, 20)}
  ${rect(-190, -170, 380, 40, G2, 20)}
  ${rect(-150, -112, 300, 240, CREAM, 12)}
  ${rect(-150, -60, 300, 18, G3, 4)}
  ${rect(-36, -76, 72, 48, ACC, 6)}
  ${shape('M-14 -28 L14 -28 L0 -2 Z', INK, 4)}
  ${rect(-120, 66, 240, 22, G2, 6)}
  ${rect(-44, 4, 88, 62, ACC, 4)}
  ${layers(-44, 44, [20, 36, 52])}
  ${hi('M-128 -92 L-66 -92')}
  ${hi('M-128 -70 L-100 -70', 6)}
  ${variant === 'p1s' ? `${line('M-190 -150 H190', 3)}${[0, 1, 2, 3].map((i) => line(`M${-168} ${60 + i * 14} H${-150}`, 3)).join('')}` : ''}
  ${variant === 'x1c' ? `${rect(-170, 138, 88, 30, INK, 6, 5)}${circ(-148, 153, 6, ACC, 3)}${circ(150, 153, 14, G3, 5)}` : ''}
  ${variant === 'p1s' ? `${rect(100, 138, 70, 30, INK, 6, 5)}${circ(122, 153, 6, ACC, 3)}` : ''}`;

const printerMini = () => `
  ${circ(-100, -206, 40, G2)}${circ(-100, -206, 14, INK, 5)}
  ${rect(-180, 130, 360, 64, G3, 12)}
  ${rect(-160, -180, 60, 320, G1, 10)}
  ${rect(-160, -130, 320, 38, G2, 10)}
  ${rect(-34, -150, 68, 52, ACC, 6)}
  ${shape('M-12 -98 L12 -98 L0 -72 Z', INK, 4)}
  ${rect(-110, 84, 240, 22, G2, 6)}
  ${rect(-34, 26, 68, 58, ACC, 4)}
  ${layers(-34, 34, [42, 56, 70])}
  ${rect(40, 150, 90, 28, INK, 6, 5)}${circ(60, 164, 6, ACC, 3)}
  ${hi('M-146 -160 V-60')}`;

const trophy = () => `
  ${tube('M-100 -170 C -190 -170 -190 -70 -80 -66', G2, 14)}
  ${tube('M100 -170 C 190 -170 190 -70 80 -66', G2, 14)}
  ${shape('M-110 -210 H110 C110 -100 70 -56 22 -44 L22 36 H74 V76 H-74 V36 H-22 L-22 -44 C-70 -56 -110 -100 -110 -210 Z', G1)}
  ${star(0, -126, 44, 20, ACC)}
  ${rect(-100, 76, 200, 40, G3, 8)}
  ${rect(-136, 116, 272, 46, INK, 8)}
  ${rect(-46, 126, 92, 26, ACC, 4, 5)}
  ${hi('M-80 -190 C -80 -150 -66 -118 -40 -98')}`;

const cup = () => `
  ${tube('M-118 -120 C -200 -120 -196 -10 -90 -10', G2, 14)}
  ${tube('M118 -120 C 200 -120 196 -10 90 -10', G2, 14)}
  ${shape('M-128 -130 C -128 -10 -70 40 -22 52 L-22 100 H22 L22 52 C 70 40 128 -10 128 -130 Z', G1)}
  ${shape('M-128 -130 C -128 -230 128 -230 128 -130 Z', G2)}
  ${circ(0, -228, 18, ACC, 6)}
  ${rect(-92, 100, 184, 36, G3, 8)}
  ${rect(-120, 136, 240, 40, INK, 8)}
  ${line('M-128 -80 H128', 3)}
  ${rect(-44, -70, 88, 26, ACC, 4, 5)}
  ${hi('M-100 -150 C -100 -110 -86 -70 -56 -40')}`;

const keychain = () => `
  ${tube('M-168 0 m-50 0 a50 50 0 1 0 100 0 a50 50 0 1 0 -100 0', G2, 12)}
  ${rect(-170, -100, 330, 200, ACC, 44)}
  ${circ(-110, 0, 20, CREAM, 6)}
  ${star(52, 0, 62, 28, CREAM)}
  ${layers(-130, 140, [-72, 72])}
  ${hi('M-130 -76 H-40')}`;

const tumbler = () => `
  ${tube('M70 -150 L110 -250', G3, 10)}
  ${shape('M-126 -170 H126 L96 168 Q94 196 66 196 H-66 Q-94 196 -96 168 Z', CREAM)}
  ${shape('M-116 -60 H116 L108 24 H-108 Z', ACC, 6)}
  ${layers(-100, 100, [-110, 70, 110])}
  ${rect(-132, -190, 264, 30, G2, 8)}
  ${hi('M-96 -140 L-76 120')}`;

const mate = () => `
  ${tube('M34 -78 C 70 -150 120 -190 150 -250', G3, 10)}
  ${circ(150, -250, 14, G2, 5)}
  ${shape('M-112 -76 C -156 40 -104 172 0 172 C 104 172 156 40 112 -76 Z', G1)}
  ${shape('M-112 -76 C -116 -20 -90 -4 0 -4 C 90 -4 116 -20 112 -76 Z', ACC, 6)}
  ${ell(0, -76, 112, 30, INK)}
  ${layers(-70, 70, [60, 90, 120])}
  ${hi('M-92 -10 C -120 50 -96 120 -50 150')}`;

const figure = () => `
  ${line('M0 -200 V-160', 6)}${circ(0, -210, 14, ACC, 6)}
  ${rect(-90, -160, 180, 130, G1, 28)}
  ${circ(-34, -98, 18, INK, 5)}${circ(34, -98, 18, INK, 5)}
  ${line('M-30 -56 H30', 5)}
  ${rect(-70, -30, 140, 160, G2, 18)}
  ${rect(-34, 8, 68, 52, ACC, 8, 6)}
  ${rect(-128, -20, 44, 120, G1, 16)}${rect(84, -20, 44, 120, G1, 16)}
  ${rect(-60, 130, 50, 70, G3, 12)}${rect(10, 130, 50, 70, G3, 12)}
  ${hi('M-72 -140 H-44')}`;

const planter = () => `
  ${shape('M-14 -40 C -10 -130 -60 -190 -120 -210 C -110 -140 -70 -80 -14 -40 Z', G2)}
  ${shape('M14 -40 C 20 -150 70 -200 130 -220 C 140 -150 90 -80 14 -40 Z', ACC)}
  ${shape('M0 -40 C -4 -120 0 -170 0 -230', 'none', 6)}
  ${shape('M-140 -50 H140 L106 150 H-106 Z', G1)}
  ${line('M-92 -50 L-60 150 M0 -50 V150 M92 -50 L60 150', 3)}
  ${rect(-130, 150, 260, 34, G3, 8)}
  ${hi('M-120 -36 L-96 100')}`;

const nozzle = () => `
  ${rect(-60, -210, 120, 40, G2, 8)}
  ${[0, 1, 2, 3, 4].map((i) => rect(-100, -170 + i * 22, 200, 14, G1, 4, 5)).join('')}
  ${shape('M-90 -60 L-50 -102 H50 L90 -60 L50 -18 H-50 Z', ACC)}
  ${rect(-56, -18, 112, 80, G2, 8)}
  ${shape('M-56 62 L56 62 L16 156 H-16 Z', ACC)}
  ${rect(-16, 156, 32, 36, G3, 6)}
  ${line('M-56 8 H56 M-56 36 H56', 3)}
  ${hi('M-72 -62 L-48 -88')}`;

const resin = () => `
  ${shape('M-110 -50 Q-110 -90 -70 -100 L-42 -120 V-150 H42 V-120 L70 -100 Q110 -90 110 -50 V170 Q110 196 84 196 H-84 Q-110 196 -110 170 Z', G1)}
  ${rect(-60, -190, 120, 52, INK, 8)}
  ${rect(-110, -20, 220, 140, CREAM, 6)}
  ${shape('M0 -2 C 34 40 34 70 0 96 C -34 70 -34 40 0 -2 Z', ACC, 6)}
  ${layers(-92, 92, [-40, 140])}
  ${hi('M-88 -70 V-30', 7)}`;

const plate = () => `
  ${rect(-190, -190, 380, 380, G2, 18)}
  ${rect(-160, -160, 320, 320, G1, 8, 6)}
  ${[-80, 0, 80].map((v) => line(`M${v} -160 V160 M-160 ${v} H160`, 2.5)).join('')}
  ${[
    [-160, -160],
    [160, -160],
    [-160, 160],
    [160, 160],
  ]
    .map(([x, y]) => circ(x, y, 18, G3, 6))
    .join('')}
  ${rect(-48, 168, 96, 44, ACC, 8)}
  ${hi('M-140 -140 H-70')}`;

const tools = () => `
  <g transform="rotate(-38)">
    ${rect(-30, -40, 60, 190, ACC, 14)}
    ${shape('M-26 -40 V-160 L0 -200 L26 -160 V-40 Z', G1)}
    ${line('M-14 90 H14 M-14 60 H14', 3)}
  </g>
  <g transform="rotate(34) translate(80 20)">
    ${rect(-22, -150, 44, 230, G2, 10)}
    ${rect(-22, 40, 44, 150, INK, 10)}
    ${hi('M-6 -120 V-40', 6)}
  </g>`;

const gearPath = (teeth, rOut, rIn) => {
  const pts = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    [
      [rIn, a],
      [rOut, a + step * 0.2],
      [rOut, a + step * 0.46],
      [rIn, a + step * 0.66],
    ].forEach(([r, ang]) => pts.push(`${(Math.cos(ang) * r).toFixed(1)} ${(Math.sin(ang) * r).toFixed(1)}`));
  }
  return `M${pts.join(' L')} Z`;
};

/** Engranaje grande + chico engranados. */
const gears = () => `
  <g transform="translate(-40 -30)">
    ${shape(gearPath(14, 170, 138), G2)}
    ${circ(0, 0, 100, G1, 6)}
    ${circ(0, 0, 44, INK, 6)}
    ${[0, 72, 144, 216, 288].map((a) => { const r = (a * Math.PI) / 180; return line(`M${(Math.cos(r) * 52).toFixed(1)} ${(Math.sin(r) * 52).toFixed(1)} L${(Math.cos(r) * 96).toFixed(1)} ${(Math.sin(r) * 96).toFixed(1)}`, 3); }).join('')}
    ${hi('M-120 -90 A 150 150 0 0 1 -50 -146')}
  </g>
  <g transform="translate(150 120) rotate(12)">
    ${shape(gearPath(9, 92, 72), ACC)}
    ${circ(0, 0, 38, CREAM, 6)}
    ${circ(0, 0, 14, INK, 4)}
  </g>`;

const OBJECTS = {
  spool,
  printerEnclosed,
  printerMini,
  trophy,
  cup,
  keychain,
  tumbler,
  mate,
  figure,
  planter,
  gears,
  nozzle,
  resin,
  plate,
  tools,
};

/* ---------- calcomanía ---------- */
const FILTER = `
  <filter id="sticker" x="-12%" y="-12%" width="130%" height="130%" color-interpolation-filters="sRGB">
    <feMorphology in="SourceAlpha" operator="dilate" radius="11" result="d"/>
    <feGaussianBlur in="d" stdDeviation="4" result="b"/>
    <feComponentTransfer in="b" result="round"><feFuncA type="linear" slope="24" intercept="-11"/></feComponentTransfer>
    <feFlood flood-color="${CREAM}"/><feComposite in2="round" operator="in" result="border"/>
    <feOffset in="round" dx="11" dy="13" result="o"/>
    <feFlood flood-color="${INK}"/><feComposite in2="o" operator="in" result="shadow"/>
    <feMerge><feMergeNode in="shadow"/><feMergeNode in="border"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;

const place = (name, x, y, s = 1, rot = 0) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${OBJECTS[name]()}</g>`;

const plank = (x, y, w) =>
  `${rect(x, y, w, 26, G1, 6)}${line(`M${x + 14} ${y + 13} H${x + w - 14}`, 2.5)}`;

const svg = (w, h, label, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">
  <defs>${FILTER}</defs>
  <g filter="url(#sticker)">${inner}</g>
</svg>
`;

const files = {};
const single = (file, label, name, s = 0.95, y = 300) => {
  files[file] = svg(600, 600, label, place(name, 300, y, s));
};
const duo = (file, label, a, b, sa = 0.5, sb = 0.5) => {
  files[file] =
    svg(
      600,
      600,
      label,
      `${plank(50, 452, 500)}${place(a, 190, 452 - 190 * sa, sa)}${place(b, 410, 452 - 190 * sb, sb)}`,
    );
};

// Productos
single('prod-trofeo', 'Trofeo', 'trophy', 1.12, 296);
single('prod-copa', 'Copa', 'cup', 1.08, 300);
single('prod-llavero', 'Llavero', 'keychain', 1.2);
single('prod-vaso', 'Vaso', 'tumbler', 0.98, 306);
single('prod-mate', 'Mate', 'mate', 1.08, 310);
single('prod-figura', 'Figura', 'figure', 1.1, 300);
single('prod-macetero', 'Macetero', 'planter', 1.12, 320);
single('prod-engranaje', 'Engranajes', 'gears', 1.0, 296);
// Categorias
duo('cat-trofeos', 'Trofeos y copas', 'trophy', 'cup', 0.62, 0.62);
duo('cat-llaveros', 'Llaveros', 'keychain', 'keychain', 0.62, 0.5);
duo('cat-vasos', 'Vasos y mates', 'tumbler', 'mate', 0.62, 0.62);
duo('cat-figuras', 'Figuras y deco', 'figure', 'planter', 0.62, 0.62);
// Impresoras
files['imp-x1c'] = svg(600, 600, 'Impresora cerrada multicolor', `<g transform="translate(300 306) scale(0.98)">${printerEnclosed('x1c')}</g>`);
files['imp-p1s'] = svg(600, 600, 'Impresora cerrada', `<g transform="translate(300 306) scale(0.98)">${printerEnclosed('p1s')}</g>`);
single('imp-a1mini', 'Impresora compacta', 'printerMini', 1.0, 300);
// Filamentos: un acento por pieza, variantes de forma
files['fil-pla'] = svg(600, 600, 'Filamento PLA', `<g transform="translate(290 300) scale(0.98)">${spool(ACC)}</g>`);
files['fil-petg'] = svg(
  600,
  600,
  'Filamento PETG',
  `<g transform="translate(290 300) scale(0.98)">${spool(CREAM)}${rect(-60, -226, 120, 34, ACC, 6)}</g>`,
);
files['fil-abs'] = svg(
  600,
  600,
  'Filamento ABS',
  `<g transform="translate(290 300) scale(0.98)">${spool(INK)}${circ(0, 0, 30, ACC, 5)}</g>`,
);
files['fil-tpu'] = svg(
  600,
  600,
  'Filamento TPU',
  `<g transform="translate(290 300) scale(0.98)">${spool(G3)}${shape('M-120 -20 C -70 -70 -40 30 0 -20 C 40 -70 70 30 120 -20', 'none', 7)}${circ(0, 0, 30, ACC, 5)}</g>`,
);
// Insumos
single('ins-boquilla', 'Boquilla', 'nozzle', 1.0, 300);
single('ins-resina', 'Resina', 'resin', 1.1, 298);
single('ins-placa', 'Placa de impresion', 'plate', 1.0, 290);
single('ins-herramientas', 'Herramientas', 'tools', 1.0, 300);
// Heroes (apaisados): objetos sobre un estante
const hero = (file, label, items) => {
  files[file] = svg(
    900,
    560,
    label,
    `${plank(40, 470, 820)}${items.map(([n, x, s]) => place(n, x, 470 - 200 * s, s)).join('')}`,
  );
};
hero('hero-productos', 'Productos personalizados', [
  ['trophy', 150, 0.62],
  ['tumbler', 330, 0.6],
  ['figure', 510, 0.58],
  ['keychain', 700, 0.62],
]);
hero('hero-impresoras', 'Impresoras 3D', [
  ['spool', 190, 0.46],
  ['printerEnclosed', 460, 0.82],
  ['nozzle', 730, 0.55],
]);
hero('hero-filamentos', 'Filamentos', [
  ['spool', 170, 0.62],
  ['spool', 430, 0.7],
  ['spool', 690, 0.62],
]);
files['placeholder'] = svg(600, 600, 'Producto', place('keychain', 300, 300, 0.9));

for (const [name, content] of Object.entries(files)) {
  writeFileSync(resolve(OUT, `${name}.svg`), content);
}
console.log(`OK: ${Object.keys(files).length} ilustraciones en ${OUT}`);
