import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createFlatMaterial, createOutlineMaterial, type SharedUniforms } from './shaders';

/** Paleta de la tienda: papel, tinta, grises fríos y un solo acento. */
export const PAL = {
  ink: '#0d0e0f',
  paper: '#f2efe8',
  paper2: '#e6e2d6',
  cream: '#f2efe8',
  g1: '#d7dbe0',
  g2: '#b4b9be',
  g3: '#9aa1a8',
  signal: '#ffd21f',
};

type V3 = [number, number, number];

interface PartOpts {
  at?: V3;
  rot?: V3;
  scale?: V3 | number;
  flat?: boolean;
  layers?: number;
  group?: string;
}

export interface BuiltItem {
  /** Raíz que el motor posiciona / rota / escala. */
  root: THREE.Group;
  /** Escala base para que la pieza mida `height` unidades de alto. */
  fit: number;
  height: number;
  /** 'y' gira entera; 'wobble' oscila (piezas planas que miran a cámara). */
  spin: 'y' | 'wobble';
  /** Animación propia de la pieza (cabezal, engranajes, etc.). */
  tick?: (t: number) => void;
  dispose: () => void;
}

/** Copia con normales suavizadas: el contorno no se abre en las aristas. */
export function hullGeometry(geo: THREE.BufferGeometry) {
  const g = geo.clone();
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g.deleteAttribute('color');
  const merged = mergeVertices(g, 1e-3);
  merged.computeVertexNormals();
  g.dispose();
  return merged;
}

class ItemBuilder {
  readonly root = new THREE.Group();
  private readonly inner = new THREE.Group();
  private readonly groups: Record<string, THREE.Group> = {};
  private readonly disposables: Array<{ dispose: () => void }> = [];
  private minY = Infinity;
  private maxY = -Infinity;

  constructor(
    private readonly shared: SharedUniforms,
    private readonly outlineWidth = 0.04,
  ) {
    this.root.add(this.inner);
  }

  pivot(name: string, p: V3) {
    const g = new THREE.Group();
    g.position.set(...p);
    this.inner.add(g);
    this.groups[name] = g;
    return g;
  }

  group(name: string) {
    return this.groups[name];
  }

  part(geo: THREE.BufferGeometry, color: string, o: PartOpts = {}) {
    const s = o.scale ?? 1;
    const scale = typeof s === 'number' ? new THREE.Vector3(s, s, s) : new THREE.Vector3(...s);
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...(o.at ?? [0, 0, 0])),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.rot ?? [0, 0, 0]))),
      scale,
    );
    const g = geo.clone();
    geo.dispose();
    g.applyMatrix4(m);
    g.computeBoundingBox();
    this.minY = Math.min(this.minY, g.boundingBox!.min.y);
    this.maxY = Math.max(this.maxY, g.boundingBox!.max.y);

    let parent: THREE.Object3D = this.inner;
    if (o.group && this.groups[o.group]) {
      const grp = this.groups[o.group];
      g.translate(-grp.position.x, -grp.position.y, -grp.position.z);
      parent = grp;
    }

    const mat = createFlatMaterial(this.shared, { color, flat: o.flat, layers: o.layers });
    const hull = hullGeometry(g);
    const outlineMat = createOutlineMaterial(this.shared, PAL.ink, this.outlineWidth);
    parent.add(new THREE.Mesh(g, mat), new THREE.Mesh(hull, outlineMat));
    this.disposables.push(g, hull, mat, outlineMat);
  }

  finish(opts: { spin?: 'y' | 'wobble'; tick?: (t: number) => void; targetH?: number }): BuiltItem {
    const h = Math.max(0.001, this.maxY - this.minY);
    const center = (this.minY + this.maxY) / 2;
    this.inner.position.y = -center;
    const height = opts.targetH ?? 2.4;
    return {
      root: this.root,
      fit: height / h,
      height,
      spin: opts.spin ?? 'y',
      tick: opts.tick,
      dispose: () => this.disposables.forEach((d) => d.dispose()),
    };
  }
}

/* ---------- helpers de geometría ---------- */

const lathe = (pts: Array<[number, number]>, seg = 40) =>
  new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    seg,
  );

const cyl = (rTop: number, rBot: number, h: number, seg = 36) =>
  new THREE.CylinderGeometry(rTop, rBot, h, seg);

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function gearGeometry(teeth: number, rOut: number, rIn: number, hole: number, depth: number) {
  const s = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts: Array<[number, number]> = [
      [rIn, a],
      [rOut, a + step * 0.18],
      [rOut, a + step * 0.44],
      [rIn, a + step * 0.62],
    ];
    pts.forEach(([r, ang], k) => {
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r;
      if (i === 0 && k === 0) s.moveTo(px, py);
      else s.lineTo(px, py);
    });
  }
  s.closePath();
  const h = new THREE.Path();
  h.absarc(0, 0, hole, 0, Math.PI * 2, true);
  s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    bevelSegments: 1,
    curveSegments: 20,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

function starShape(points: number, outer: number, inner: number) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

/* ============================ PRODUCTOS ============================ */

function buildTrophy(sh: SharedUniforms): BuiltItem {
  const b = new ItemBuilder(sh);
  b.part(box(1.9, 0.34, 1.1), PAL.ink, { at: [0, 0.17, 0] });
  b.part(box(0.9, 0.16, 0.06), PAL.signal, { at: [0, 0.17, 0.57] });
  b.part(box(1.5, 0.24, 0.9), PAL.g3, { at: [0, 0.46, 0] });
  b.part(
    lathe([
      [0, 0.58],
      [0.4, 0.58],
      [0.22, 0.75],
      [0.16, 1.3],
      [0.3, 1.4],
      [0.3, 1.5],
      [0.18, 1.58],
      [0.3, 1.7],
      [0.8, 1.98],
      [1.0, 2.55],
      [0.94, 2.6],
      [0, 2.6],
    ]),
    PAL.g1,
    { layers: 22 },
  );
  const handle = () => new THREE.TorusGeometry(0.42, 0.08, 12, 24, Math.PI);
  b.part(handle(), PAL.g2, { at: [1.0, 2.05, 0], rot: [0, 0, -Math.PI / 2] });
  b.part(handle(), PAL.g2, { at: [-1.0, 2.05, 0], rot: [0, 0, Math.PI / 2] });
  b.part(new THREE.ExtrudeGeometry(starShape(5, 0.36, 0.15), { depth: 0.08, bevelEnabled: false }), PAL.signal, {
    at: [0, 2.2, 0.97],
    rot: [-0.18, 0, 0],
  });
  return b.finish({ spin: 'y' });
}

function buildMug(sh: SharedUniforms): BuiltItem {
  const b = new ItemBuilder(sh);
  b.part(
    lathe([
      [0, 0],
      [0.62, 0],
      [0.7, 0.1],
      [0.9, 1.7],
      [0.93, 1.78],
      [0, 1.78],
    ]),
    PAL.cream,
    { layers: 28 },
  );
  b.part(
    lathe([
      [0.742, 0.55],
      [0.775, 0.55],
      [0.815, 1.05],
      [0.78, 1.05],
    ]),
    PAL.signal,
  );
  b.part(cyl(0.96, 0.96, 0.1), PAL.g2, { at: [0, 1.8, 0] });
  b.part(cyl(0.05, 0.05, 1.1, 10), PAL.g3, { at: [0.35, 2.3, 0], rot: [0, 0, -0.25] });
  return b.finish({ spin: 'y' });
}

function buildGears(sh: SharedUniforms): BuiltItem {
  const b = new ItemBuilder(sh);
  b.pivot('big', [-0.35, 0.2, 0]);
  b.pivot('small', [1.08, -0.8, 0]);
  b.part(gearGeometry(14, 1.25, 1.05, 0.36, 0.42), PAL.g2, { at: [-0.35, 0.2, 0], group: 'big', layers: 16 });
  b.part(gearGeometry(8, 0.68, 0.54, 0.18, 0.42), PAL.signal, { at: [1.08, -0.8, 0], group: 'small', layers: 16 });
  return b.finish({
    spin: 'wobble',
    tick: (t) => {
      b.group('big').rotation.z = t * 0.35;
      b.group('small').rotation.z = -t * 0.35 * (14 / 8) + 0.2;
    },
  });
}

function buildRobot(sh: SharedUniforms): BuiltItem {
  const b = new ItemBuilder(sh);
  b.part(cyl(0.05, 0.05, 0.4, 10), PAL.ink, { at: [0, 2.4, 0] });
  b.part(new THREE.SphereGeometry(0.14, 16, 12), PAL.signal, { at: [0, 2.66, 0] });
  b.part(box(1.5, 1.05, 1.1), PAL.g1, { at: [0, 1.7, 0] });
  b.part(cyl(0.15, 0.15, 0.06, 16), PAL.ink, { at: [-0.32, 1.78, 0.56], rot: [Math.PI / 2, 0, 0] });
  b.part(cyl(0.15, 0.15, 0.06, 16), PAL.ink, { at: [0.32, 1.78, 0.56], rot: [Math.PI / 2, 0, 0] });
  b.part(box(0.5, 0.06, 0.06), PAL.ink, { at: [0, 1.4, 0.56] });
  b.part(box(1.2, 1.3, 0.9), PAL.g2, { at: [0, 0.55, 0] });
  b.part(box(0.56, 0.4, 0.06), PAL.signal, { at: [0, 0.72, 0.47] });
  b.part(box(0.34, 1.0, 0.5), PAL.g1, { at: [-0.86, 0.6, 0] });
  b.part(box(0.34, 1.0, 0.5), PAL.g1, { at: [0.86, 0.6, 0] });
  b.part(box(0.42, 0.55, 0.5), PAL.g3, { at: [-0.3, -0.38, 0] });
  b.part(box(0.42, 0.55, 0.5), PAL.g3, { at: [0.3, -0.38, 0] });
  return b.finish({ spin: 'y' });
}

function buildKeychain(sh: SharedUniforms): BuiltItem {
  const b = new ItemBuilder(sh);
  const shape = roundedRect(1.9, 1.15, 0.3);
  const hole = new THREE.Path();
  hole.absarc(-0.64, 0, 0.14, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const tag = new THREE.ExtrudeGeometry(shape, {
    depth: 0.2,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    bevelSegments: 1,
    curveSegments: 14,
  });
  tag.translate(0, 0, -0.1);
  b.part(tag, PAL.signal, { layers: 18 });
  const star = new THREE.ExtrudeGeometry(starShape(5, 0.36, 0.16), { depth: 0.1, bevelEnabled: false });
  b.part(star, PAL.cream, { at: [0.3, 0, 0.12] });
  b.part(new THREE.TorusGeometry(0.32, 0.05, 10, 32), PAL.g2, { at: [-0.96, 0, 0], rot: [0.9, 0, 0] });
  return b.finish({ spin: 'wobble', targetH: 1.9 });
}

/* ============================ IMPRESORAS E INSUMOS ============================ */

function buildPrinter(sh: SharedUniforms): BuiltItem {
  const b = new ItemBuilder(sh, 0.045);
  b.pivot('gantry', [0, 1.35, 0]);
  b.pivot('head', [0, 1.35, 0]);
  b.pivot('print', [0.1, 0.37, 0.05]);
  b.pivot('spool', [0, 2.62, -0.25]);

  b.part(box(2.0, 0.25, 1.8), PAL.g3, { at: [0, 0.125, 0] });
  [
    [0.94, 0.84],
    [-0.94, 0.84],
    [0.94, -0.84],
    [-0.94, -0.84],
  ].forEach(([x, z]) => b.part(box(0.12, 1.9, 0.12), PAL.g1, { at: [x, 1.2, z] }));
  b.part(box(2.0, 0.14, 1.8), PAL.g2, { at: [0, 2.2, 0] });
  b.part(box(1.3, 0.06, 1.2), PAL.cream, { at: [0, 0.34, 0] });

  b.part(cyl(0.28, 0.28, 0.5, 24), PAL.signal, { at: [0.1, 0.62, 0.05], group: 'print', layers: 30 });
  b.part(box(1.8, 0.1, 0.1), PAL.g3, { at: [0, 1.35, 0], group: 'gantry' });
  b.part(box(0.34, 0.3, 0.3), PAL.signal, { at: [0, 1.2, 0], group: 'head' });
  b.part(new THREE.ConeGeometry(0.07, 0.2, 12), PAL.ink, { at: [0, 0.96, 0], rot: [Math.PI, 0, 0], group: 'head' });

  const R = 0.5;
  b.part(cyl(R, R, 0.08), PAL.g2, { at: [0.4, 2.62, -0.25], rot: [0, 0, Math.PI / 2], group: 'spool' });
  b.part(cyl(R, R, 0.08), PAL.g2, { at: [-0.4, 2.62, -0.25], rot: [0, 0, Math.PI / 2], group: 'spool' });
  b.part(cyl(R * 0.86, R * 0.86, 0.72), PAL.cream, {
    at: [0, 2.62, -0.25],
    rot: [0, 0, Math.PI / 2],
    group: 'spool',
    layers: 40,
  });

  return b.finish({
    spin: 'y',
    targetH: 2.7,
    tick: (t) => {
      const grow = 0.25 + 0.75 * ((Math.sin(t * 0.5) + 1) / 2);
      b.group('print').scale.y = grow;
      const h = grow * 0.12;
      b.group('gantry').position.y = 1.35 + h;
      const head = b.group('head');
      head.position.y = 1.35 + h;
      head.position.x = Math.sin(t * 1.4) * 0.42;
      b.group('spool').rotation.x = t * 0.8;
    },
  });
}

function buildFilaments(sh: SharedUniforms): BuiltItem {
  const b = new ItemBuilder(sh, 0.035);
  const spool = (color: string, at: V3, name: string, scale: number) => {
    b.pivot(name, at);
    const p = (dz: number) => ({
      at: [at[0], at[1], at[2] + dz * scale] as V3,
      rot: [Math.PI / 2, 0, 0] as V3,
      scale,
      group: name,
    });
    b.part(cyl(1, 1, 0.08), PAL.g1, p(0.42));
    b.part(cyl(1, 1, 0.08), PAL.g1, p(-0.42));
    b.part(box(0.14, 0.3, 0.05), PAL.ink, {
      at: [at[0], at[1] + 0.58 * scale, at[2] + 0.47 * scale],
      scale,
      group: name,
    });
    b.part(cyl(0.38, 0.38, 0.84), PAL.ink, p(0));
    b.part(cyl(0.86, 0.86, 0.76), color, { ...p(0), layers: 46 });
  };
  spool(PAL.signal, [0, 0.0, 0.5], 's1', 0.78);
  spool(PAL.cream, [-1.15, 0.5, -0.5], 's2', 0.68);
  spool(PAL.g3, [1.15, 0.5, -0.5], 's3', 0.68);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.6, -0.55, 0.95),
    new THREE.Vector3(1.0, -0.82, 1.15),
    new THREE.Vector3(0.45, -1.0, 1.35),
    new THREE.Vector3(-0.1, -0.92, 1.1),
  ]);
  b.part(new THREE.TubeGeometry(curve, 36, 0.05, 8), PAL.signal, {});
  return b.finish({
    spin: 'wobble',
    targetH: 2.5,
    tick: (t) => {
      b.group('s1').rotation.z = -t * 0.9;
      b.group('s2').rotation.z = t * 0.6;
      b.group('s3').rotation.z = -t * 0.75;
    },
  });
}

function buildNozzles(sh: SharedUniforms): BuiltItem {
  const b = new ItemBuilder(sh, 0.035);
  const nozzle = (at: V3, s: number) => {
    const P = (y: number): V3 => [at[0], at[1] + y * s, at[2]];
    b.part(cyl(0.55, 0.55, 0.35, 6), PAL.g1, { at: P(1.35), scale: s, flat: true });
    b.part(cyl(0.3, 0.3, 0.7), PAL.g2, { at: P(0.85), scale: s });
    b.part(new THREE.ConeGeometry(0.34, 0.55, 24), PAL.signal, { at: P(0.3), rot: [Math.PI, 0, 0], scale: s });
    b.part(cyl(0.07, 0.07, 0.12, 16), PAL.ink, { at: P(-0.03), scale: s });
    for (let i = 0; i < 5; i++) b.part(cyl(0.55, 0.55, 0.06), PAL.g1, { at: P(1.7 + i * 0.12), scale: s });
    b.part(cyl(0.22, 0.22, 0.4), PAL.g3, { at: P(2.4), scale: s });
  };
  nozzle([0, 0, 0], 1);
  nozzle([-1.3, -0.45, 0.2], 0.5);
  nozzle([1.3, -0.45, 0.2], 0.5);
  return b.finish({ spin: 'y', targetH: 2.4 });
}

function buildResin(sh: SharedUniforms): BuiltItem {
  const b = new ItemBuilder(sh, 0.035);
  const bottle = (at: V3, s: number) => {
    b.part(
      lathe([
        [0, 0],
        [0.7, 0],
        [0.75, 0.05],
        [0.75, 1.5],
        [0.6, 1.75],
        [0.3, 1.85],
        [0.3, 2.05],
        [0, 2.05],
      ]),
      PAL.g1,
      { at, scale: s, layers: 22 },
    );
    b.part(cyl(0.36, 0.36, 0.3, 28), PAL.ink, { at: [at[0], at[1] + 2.2 * s, at[2]], scale: s });
    b.part(
      lathe([
        [0.755, 0.4],
        [0.79, 0.4],
        [0.79, 1.2],
        [0.755, 1.2],
      ]),
      PAL.cream,
      { at, scale: s },
    );
    b.part(
      lathe([
        [0.78, 0.7],
        [0.81, 0.7],
        [0.81, 0.9],
        [0.78, 0.9],
      ]),
      PAL.signal,
      { at, scale: s },
    );
  };
  bottle([-0.45, 0, 0], 1);
  bottle([1.0, 0, 0.35], 0.62);
  return b.finish({ spin: 'y', targetH: 2.4 });
}

function buildSupplies(sh: SharedUniforms): BuiltItem {
  const b = new ItemBuilder(sh, 0.035);
  b.part(box(1.9, 0.8, 1.0), PAL.ink, { at: [0, 0.4, 0] });
  b.part(box(1.94, 0.18, 1.04), PAL.signal, { at: [0, 0.72, 0] });
  b.part(new THREE.TorusGeometry(0.36, 0.05, 10, 24, Math.PI), PAL.g2, { at: [0, 0.82, 0] });
  b.part(box(1.05, 1.05, 0.06), PAL.g1, { at: [0.2, 1.3, -0.15], rot: [0, 0.3, 0] });
  b.part(box(0.95, 0.04, 0.95), PAL.g3, { at: [0.2, 1.84, -0.15], rot: [0, 0.3, 0] });
  b.part(box(0.18, 1.3, 0.05), PAL.signal, { at: [-0.55, 1.2, 0.1], rot: [0, 0, -0.22] });
  b.part(box(0.34, 0.5, 0.06), PAL.g2, { at: [-0.78, 1.95, 0.1], rot: [0, 0, -0.22] });
  b.part(cyl(0.12, 0.12, 0.7, 16), PAL.cream, { at: [0.75, 1.15, 0.35], rot: [0, 0, 0.12] });
  return b.finish({ spin: 'y', targetH: 2.4 });
}

export type ItemKind =
  | 'trophy'
  | 'mug'
  | 'gears'
  | 'robot'
  | 'keychain'
  | 'printer'
  | 'filaments'
  | 'nozzles'
  | 'resin'
  | 'supplies';

export const ITEM_BUILDERS: Record<ItemKind, (shared: SharedUniforms) => BuiltItem> = {
  trophy: buildTrophy,
  mug: buildMug,
  gears: buildGears,
  robot: buildRobot,
  keychain: buildKeychain,
  printer: buildPrinter,
  filaments: buildFilaments,
  nozzles: buildNozzles,
  resin: buildResin,
  supplies: buildSupplies,
};
