/**
 * Genera las imagenes de demo (SVG) que usa el catalogo de ejemplo.
 * Uso: node scripts/gen-placeholders.mjs
 *
 * Son SVG a proposito: pesan ~2 KB, se ven nitidas en cualquier pantalla y
 * viven en public/ (a diferencia de /uploads, que Render borra en cada deploy).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/demo');
mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Cubo isometrico con lineas de capa: evoca una pieza impresa en 3D. */
const objeto = (c) => {
  const w = 150;
  const h = 84;
  const sh = 165;
  const ty = -sh / 2;
  const capas = Array.from({ length: 6 }, (_, i) => {
    const dy = ((i + 1) * sh) / 7;
    return `<path d="M${-w} ${ty + dy} L0 ${ty + h + dy} L${w} ${ty + dy}" fill="none" stroke="${c}" stroke-opacity=".16" stroke-width="2"/>`;
  }).join('');
  return `
    <path d="M0 ${ty - h} L${w} ${ty} L0 ${ty + h} L${-w} ${ty} Z" fill="${c}" fill-opacity=".55"/>
    <path d="M${-w} ${ty} L0 ${ty + h} L0 ${ty + h + sh} L${-w} ${ty + sh} Z" fill="${c}" fill-opacity=".22"/>
    <path d="M${w} ${ty} L0 ${ty + h} L0 ${ty + h + sh} L${w} ${ty + sh} Z" fill="${c}" fill-opacity=".34"/>
    ${capas}
    <path d="M0 ${ty - h} L${w} ${ty} L0 ${ty + h} L${-w} ${ty} Z" fill="none" stroke="${c}" stroke-opacity=".9" stroke-width="3" stroke-linejoin="round"/>
    <path d="M${-w} ${ty} L${-w} ${ty + sh} L0 ${ty + h + sh} L${w} ${ty + sh} L${w} ${ty}" fill="none" stroke="${c}" stroke-opacity=".9" stroke-width="3" stroke-linejoin="round"/>
    <path d="M0 ${ty + h} L0 ${ty + h + sh}" fill="none" stroke="${c}" stroke-opacity=".9" stroke-width="3"/>`;
};

/** Impresora: marco cubico abierto con una pieza adentro. */
const impresora = (c) => `
    <rect x="-160" y="-150" width="320" height="300" rx="14" fill="${c}" fill-opacity=".07" stroke="${c}" stroke-opacity=".85" stroke-width="4"/>
    <path d="M-160 -96 L160 -96" stroke="${c}" stroke-opacity=".5" stroke-width="3"/>
    <rect x="-34" y="-58" width="68" height="30" rx="6" fill="${c}" fill-opacity=".9"/>
    <path d="M0 -28 L0 52" stroke="${c}" stroke-opacity=".55" stroke-width="3" stroke-dasharray="7 7"/>
    <path d="M-70 118 L0 78 L70 118 L0 158 Z" fill="${c}" fill-opacity=".5" stroke="${c}" stroke-opacity=".9" stroke-width="3" stroke-linejoin="round"/>
    <rect x="-118" y="120" width="236" height="14" rx="7" fill="${c}" fill-opacity=".3"/>`;

/** Carrete de filamento. */
const carrete = (c) => {
  const radios = Array.from({ length: 11 }, (_, i) => {
    const a = (i * Math.PI * 2) / 11;
    const x1 = (Math.cos(a) * 44).toFixed(1);
    const y1 = (Math.sin(a) * 44).toFixed(1);
    const x2 = (Math.cos(a) * 102).toFixed(1);
    const y2 = (Math.sin(a) * 102).toFixed(1);
    return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${c}" stroke-opacity=".35" stroke-width="3"/>`;
  }).join('');
  return `
    <circle r="150" fill="${c}" fill-opacity=".1" stroke="${c}" stroke-opacity=".85" stroke-width="5"/>
    <circle r="104" fill="${c}" fill-opacity=".3" stroke="${c}" stroke-opacity=".6" stroke-width="3"/>
    ${radios}
    <circle r="40" fill="#08080b" stroke="${c}" stroke-opacity=".9" stroke-width="5"/>
    <path d="M150 0 q58 26 40 86" fill="none" stroke="${c}" stroke-opacity=".9" stroke-width="5" stroke-linecap="round"/>`;
};

const ICONOS = { objeto, impresora, carrete };

function svg({ titulo = '', sub = '', color = '#ff5c1a', icono = 'objeto', w = 800, h = 800 }) {
  const cx = w / 2;
  const cy = h / 2 - (titulo ? 40 : 0);
  const textoTitulo = titulo
    ? `<text x="${cx}" y="${h - 96}" text-anchor="middle" fill="#ffffff" font-family="ui-sans-serif,system-ui,Segoe UI,Arial" font-size="40" font-weight="800">${esc(titulo)}</text>`
    : '';
  const textoSub = sub
    ? `<text x="${cx}" y="${h - 54}" text-anchor="middle" fill="#ffffff" fill-opacity=".45" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="21" letter-spacing="2">${esc(sub.toUpperCase())}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(titulo || 'Global 3D')}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="62%">
      <stop offset="0%" stop-color="${color}" stop-opacity=".26"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0 H0 V40" fill="none" stroke="#ffffff" stroke-opacity=".04" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="#08080b"/>
  <rect width="${w}" height="${h}" fill="url(#grid)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <g transform="translate(${cx} ${cy})">${ICONOS[icono](color)}</g>
  ${textoTitulo}
  ${textoSub}
  <text x="${w - 26}" y="${h - 20}" text-anchor="end" fill="${color}" fill-opacity=".5" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="16" letter-spacing="3">GLOBAL 3D</text>
</svg>
`;
}

const NARANJA = '#ff5c1a';
const AMBAR = '#f5a524';
const CIAN = '#14e0c8';
const AZUL = '#3b82f6';
const VIOLETA = '#a855f7';
const VERDE = '#22c55e';

const ARCHIVOS = [
  // Portadas de seccion (apaisadas)
  ['hero-productos', { titulo: 'Productos Personalizados', sub: 'Piezas a medida', color: NARANJA, icono: 'objeto', w: 1600, h: 900 }],
  ['hero-impresoras', { titulo: 'Impresoras 3D', sub: 'Equipos y repuestos', color: AZUL, icono: 'impresora', w: 1600, h: 900 }],
  ['hero-filamentos', { titulo: 'Filamentos', sub: 'Todos los materiales', color: CIAN, icono: 'carrete', w: 1600, h: 900 }],
  // Categorias de productos
  ['cat-trofeos', { titulo: 'Trofeos y Copas', sub: 'Categoria', color: AMBAR }],
  ['cat-llaveros', { titulo: 'Llaveros', sub: 'Categoria', color: NARANJA }],
  ['cat-vasos', { titulo: 'Vasos y Mates', sub: 'Categoria', color: VERDE }],
  ['cat-figuras', { titulo: 'Figuras y Deco', sub: 'Categoria', color: VIOLETA }],
  // Productos
  ['prod-trofeo', { titulo: 'Trofeo Personalizado', sub: 'Producto', color: AMBAR }],
  ['prod-copa', { titulo: 'Copa de la Liga', sub: 'Producto', color: AMBAR }],
  ['prod-llavero', { titulo: 'Llavero con Nombre', sub: 'Producto', color: NARANJA }],
  ['prod-vaso', { titulo: 'Vaso Personalizado', sub: 'Producto', color: VERDE }],
  ['prod-mate', { titulo: 'Mate Impreso 3D', sub: 'Producto', color: VERDE }],
  ['prod-figura', { titulo: 'Figura Coleccionable', sub: 'Producto', color: VIOLETA }],
  ['prod-macetero', { titulo: 'Macetero Geometrico', sub: 'Producto', color: VIOLETA }],
  // Impresoras
  ['imp-x1c', { titulo: 'Bambu Lab X1 Carbon', sub: 'Impresora', color: AZUL, icono: 'impresora' }],
  ['imp-p1s', { titulo: 'Bambu Lab P1S', sub: 'Impresora', color: AZUL, icono: 'impresora' }],
  ['imp-a1mini', { titulo: 'Bambu Lab A1 mini', sub: 'Impresora', color: AZUL, icono: 'impresora' }],
  // Filamentos
  ['fil-pla', { titulo: 'Filamento PLA', sub: 'Material', color: CIAN, icono: 'carrete' }],
  ['fil-petg', { titulo: 'Filamento PETG', sub: 'Material', color: VERDE, icono: 'carrete' }],
  ['fil-abs', { titulo: 'Filamento ABS', sub: 'Material', color: NARANJA, icono: 'carrete' }],
  ['fil-tpu', { titulo: 'Filamento TPU', sub: 'Material', color: VIOLETA, icono: 'carrete' }],
  // Comodin para cualquier hueco
  ['placeholder', { titulo: 'Imagen no disponible', sub: 'Global 3D', color: NARANJA }],
];

let n = 0;
for (const [nombre, opts] of ARCHIVOS) {
  writeFileSync(resolve(OUT, `${nombre}.svg`), svg(opts), 'utf8');
  n++;
}
console.log(`${n} imagenes generadas en public/demo/`);
