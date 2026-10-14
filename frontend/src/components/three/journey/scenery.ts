import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PAL, hullGeometry } from './objects';
import { createFlatMaterial, createFloorMaterial, createOutlineMaterial, type SharedUniforms } from './shaders';

export const FLOOR_Y = -1.6;
/** Altura (centro) de cada estante, de abajo hacia arriba. */
export const BOARDS = [-1.45, -0.45, 0.55, 1.55];
export const SHELF_FRONT = 2.6;
const SHELF_DEPTH = 1.3;
const TOP_Y = 2.2;

export interface HeroSlot {
  z: number;
  side: 1 | -1;
  /** índice de estante (0 = el de abajo) */
  level: number;
}

type Rand = () => number;

/** Junta muchas cajas / cilindros en dos mallas (relleno + contorno) para dibujar todo en 2 llamadas. */
class SceneryBuilder {
  private readonly mains: THREE.BufferGeometry[] = [];
  private readonly hulls: THREE.BufferGeometry[] = [];

  private push(geo: THREE.BufferGeometry, color: string, outline: number) {
    geo.deleteAttribute('uv');
    const n = geo.attributes.position.count;
    const c = new THREE.Color(color);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) c.toArray(col, i * 3);
    const hull = hullGeometry(geo);
    hull.setAttribute('aW', new THREE.BufferAttribute(new Float32Array(hull.attributes.position.count).fill(outline), 1));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.mains.push(geo);
    this.hulls.push(hull);
  }

  box(x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, outline = 0.04, ry = 0) {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    this.push(g, color, outline);
  }

  cyl(x: number, y: number, z: number, r: number, h: number, color: string, outline = 0.035, seg = 14) {
    const g = new THREE.CylinderGeometry(r, r, h, seg);
    g.translate(x, y, z);
    this.push(g, color, outline);
  }

  build() {
    const main = mergeGeometries(this.mains, false)!;
    const hull = mergeGeometries(this.hulls, false)!;
    this.mains.forEach((g) => g.dispose());
    this.hulls.forEach((g) => g.dispose());
    return { main, hull };
  }
}

/** Cartel con texto (canvas): amarillo con borde de tinta, como un cartel de góndola. */
export function makeSign(opts: {
  kicker: string;
  title: string;
  w: number;
  h: number;
  fontFamily: string;
  bg?: string;
}) {
  const px = 160;
  const cw = Math.round(opts.w * px);
  const ch = Math.round(opts.h * px);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(0, 0, cw, ch);
  const b = 10;
  ctx.fillStyle = opts.bg ?? PAL.signal;
  ctx.fillRect(b, b, cw - b * 2, ch - b * 2);
  ctx.fillStyle = PAL.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(ch * 0.2)}px ${opts.fontFamily}`;
  ctx.fillText(opts.kicker.toUpperCase(), cw / 2, ch * 0.28);
  let size = Math.round(ch * 0.42);
  ctx.font = `900 ${size}px ${opts.fontFamily}`;
  while (ctx.measureText(opts.title.toUpperCase()).width > cw - 60 && size > 20) {
    size -= 4;
    ctx.font = `900 ${size}px ${opts.fontFamily}`;
  }
  ctx.fillText(opts.title.toUpperCase(), cw / 2, ch * 0.64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({ map: tex, fog: false });
  const geo = new THREE.PlaneGeometry(opts.w, opts.h);
  return { mesh: new THREE.Mesh(geo, mat), dispose: () => [tex, mat, geo].forEach((d) => d.dispose()) };
}

export interface AisleOptions {
  shared: SharedUniforms;
  /** Longitud del pasillo (hacia -z desde z=+6). */
  length: number;
  heroSlots: HeroSlot[];
  rand: Rand;
  fontFamily: string;
  aisleLabel: string;
  aisleTitle: string;
  counterZ: number;
}

export function buildAisle(o: AisleOptions) {
  const sc = new SceneryBuilder();
  const { rand } = o;
  const z0 = 6;
  const zEnd = -o.length;
  const L = z0 - zEnd;
  const zMid = (z0 + zEnd) / 2;
  const H = TOP_Y - FLOOR_Y;
  const stockColors = [PAL.cream, PAL.g1, PAL.g2, PAL.g3, PAL.paper2, PAL.cream, PAL.g1, PAL.signal, PAL.ink];

  for (const side of [-1, 1] as const) {
    const cx = side * (SHELF_FRONT + SHELF_DEPTH / 2);
    sc.box(side * (SHELF_FRONT + SHELF_DEPTH + 0.05), FLOOR_Y + H / 2, zMid, 0.1, H, L, PAL.g1, 0.05);
    sc.box(cx, FLOOR_Y + 0.2, zMid, SHELF_DEPTH, 0.4, L, PAL.g3, 0.05);
    for (const y of BOARDS) {
      sc.box(cx, y, zMid, SHELF_DEPTH, 0.1, L, PAL.cream, 0.04);
      sc.box(side * SHELF_FRONT, y + 0.02, zMid, 0.05, 0.16, L, PAL.g3, 0.03);
    }
    sc.box(cx, TOP_Y + 0.15, zMid, SHELF_DEPTH + 0.3, 0.34, L, PAL.signal, 0.05);
    for (let z = z0; z > zEnd; z -= 2.5) {
      sc.box(cx, FLOOR_Y + H / 2, z, SHELF_DEPTH, H, 0.1, PAL.g3, 0.04);
    }

    // mercadería
    BOARDS.forEach((by, level) => {
      let z = z0 - 0.4;
      let guard = 0;
      while (z > zEnd + 3 && guard++ < 4000) {
        const slot = o.heroSlots.find((s) => s.side === side && s.level === level && Math.abs(s.z - z) < 1.15);
        if (slot) {
          // 1.25 > 1.15: sin esto el redondeo de punto flotante puede dejar a z "dentro" del hueco
          // y el bucle no avanza nunca.
          z = slot.z - 1.25;
          continue;
        }
        const kind = rand();
        const color = stockColors[Math.floor(rand() * stockColors.length)];
        const base = by + 0.05;
        const depth = 0.55 + rand() * 0.45;
        const x = side * (SHELF_FRONT + 0.12 + depth / 2);
        if (kind < 0.55) {
          const w = 0.34 + rand() * 0.3;
          const h = 0.4 + rand() * 0.4;
          sc.box(x, base + h / 2, z - w / 2, depth, h, w, color, 0.022);
          z -= w + 0.05 + rand() * 0.08;
        } else if (kind < 0.88) {
          const r = 0.14 + rand() * 0.12;
          const h = 0.34 + rand() * 0.4;
          sc.cyl(x, base + h / 2, z - r, r, h, color, 0.022, 12);
          z -= r * 2 + 0.05 + rand() * 0.08;
        } else {
          const w = 0.5 + rand() * 0.2;
          sc.box(x, base + 0.09, z - w / 2, depth, 0.18, w, color, 0.022);
          sc.box(x, base + 0.27, z - w / 2, depth * 0.8, 0.18, w * 0.9, stockColors[Math.floor(rand() * 4)], 0.022);
          z -= w + 0.06;
        }
      }
    });
  }

  // cartel colgante del pasillo + varillas
  for (const x of [-1.7, 1.7]) sc.box(x, 3.4, -6, 0.06, 3.6, 0.06, PAL.ink, 0.02);

  // caja: mostrador, cinta, registradora y canasto
  const cz = o.counterZ;
  sc.box(0, FLOOR_Y + 0.55, cz, 3.8, 1.1, 1.5, PAL.ink, 0.05);
  sc.box(0, FLOOR_Y + 1.16, cz, 4.0, 0.14, 1.7, PAL.g1, 0.05);
  sc.box(-0.4, FLOOR_Y + 1.26, cz + 0.2, 2.2, 0.06, 0.8, PAL.ink, 0.025);
  sc.box(1.35, FLOOR_Y + 1.52, cz - 0.15, 0.9, 0.5, 0.7, PAL.g2, 0.035);
  sc.box(1.35, FLOOR_Y + 1.85, cz - 0.4, 0.8, 0.5, 0.08, PAL.ink, 0.03, 0);
  sc.box(1.35, FLOOR_Y + 1.38, cz + 0.22, 0.5, 0.06, 0.2, PAL.signal, 0.02);
  sc.box(-1.1, FLOOR_Y + 1.5, cz + 0.2, 0.7, 0.4, 0.5, PAL.signal, 0.035);
  sc.cyl(-0.2, FLOOR_Y + 1.6, cz + 0.2, 0.2, 0.55, PAL.cream, 0.03);
  sc.box(0.5, FLOOR_Y + 1.48, cz + 0.2, 0.5, 0.35, 0.4, PAL.g2, 0.03);
  sc.box(0, FLOOR_Y + 3.6, cz - 2.6, 16, 7.6, 0.3, PAL.paper2, 0.06);
  for (const x of [-1.5, 1.5]) sc.box(x, 3.2, cz - 0.4, 0.06, 3.2, 0.06, PAL.ink, 0.02);

  const { main, hull } = sc.build();
  const group = new THREE.Group();
  const mainMat = createFlatMaterial(o.shared, { vertexColors: true });
  const hullMat = createOutlineMaterial(o.shared, PAL.ink, 0);
  group.add(new THREE.Mesh(main, mainMat), new THREE.Mesh(hull, hullMat));

  // piso
  const floorGeo = new THREE.PlaneGeometry(26, L + 40);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = createFloorMaterial(o.shared, PAL.paper2, PAL.ink, PAL.signal);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, FLOOR_Y, zMid - 8);
  group.add(floor);

  // carteles
  const disposers: Array<() => void> = [];
  const start = makeSign({
    kicker: o.aisleLabel,
    title: o.aisleTitle,
    w: 3.6,
    h: 1.1,
    fontFamily: o.fontFamily,
  });
  start.mesh.position.set(0, 1.9, -6);
  group.add(start.mesh);
  disposers.push(start.dispose);

  const caja = makeSign({ kicker: 'Hora de pagar', title: 'Caja', w: 3.4, h: 1.0, fontFamily: o.fontFamily });
  caja.mesh.position.set(0, FLOOR_Y + 4.1, cz - 0.4);
  group.add(caja.mesh);
  disposers.push(caja.dispose);

  return {
    group,
    dispose: () => {
      main.dispose();
      hull.dispose();
      mainMat.dispose();
      hullMat.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      disposers.forEach((d) => d());
    },
  };
}
