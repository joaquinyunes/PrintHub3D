import * as THREE from 'three';
import { gsap } from 'gsap';
import { ITEM_BUILDERS, PAL, type BuiltItem, type ItemKind } from './objects';
import { BOARDS, FLOOR_Y, SHELF_FRONT, buildAisle, type HeroSlot } from './scenery';
import type { SharedUniforms } from './shaders';

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  kinds: ItemKind[];
  /** Cartel del pasillo, p. ej. "Pasillo 1" / "Productos 3D". */
  aisleLabel: string;
  aisleTitle: string;
  mobile: boolean;
  reduceMotion: boolean;
}

export interface FrameInfo {
  /** Progreso ya suavizado (0..1). */
  progress: number;
  /** -1 = entrada del pasillo, 0..N-1 = góndola activa, N = caja. */
  index: number;
}

export interface JourneyEngine {
  resize(w: number, h: number): void;
  frame(rawProgress: number, dt: number, pointer: { x: number; y: number }): FrameInfo;
  /** Entrada: la cámara llega desde atrás. */
  intro(): void;
  dispose(): void;
}

const S0 = 12; // distancia de la cámara a la primera góndola
const STEP = 13; // separación entre góndolas
const REST_SCALE = 0.36; // tamaño de la pieza cuando está en el estante
const REST_LEVEL = 1; // estante donde vive la pieza

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createJourney(opts: EngineOptions): JourneyEngine {
  const { canvas, kinds, mobile, reduceMotion } = opts;
  const N = kinds.length;
  const K = N + 1; // tramos: entrada → góndola 0 … góndola N-1 → caja

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    powerPreference: 'high-performance',
  });
  const maxDpr = mobile ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.setClearColor(PAL.paper, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 160);
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(o: T) => {
    disposables.push(o);
    return o;
  };

  const shared: SharedUniforms = {
    uBuildY: { value: 1e4 },
    uFogColor: { value: new THREE.Color(PAL.paper) },
    uFogNear: { value: 14 },
    uFogFar: { value: 64 },
  };

  /* ---------- pasillo ---------- */
  const rand = mulberry32(0x5eed3d);
  const itemZ = (i: number) => -(S0 + i * STEP);
  const counterZ = -(S0 + N * STEP + 3);
  const heroSlots: HeroSlot[] = kinds.map((_, i) => ({
    z: itemZ(i),
    side: i % 2 === 0 ? 1 : -1,
    level: REST_LEVEL,
  }));
  const fontFamily = getComputedStyle(document.body).fontFamily || 'Arial Black, sans-serif';
  const aisle = buildAisle({
    shared,
    length: -counterZ + 4,
    heroSlots,
    rand,
    fontFamily,
    aisleLabel: opts.aisleLabel,
    aisleTitle: opts.aisleTitle,
    counterZ,
  });
  scene.add(aisle.group);
  track({ dispose: aisle.dispose });

  /* ---------- piezas "de góndola" ---------- */
  const shadowGeo = track(new THREE.CircleGeometry(1, 28));
  const shadowMat = track(new THREE.MeshBasicMaterial({ color: '#c8c2b0', fog: false }));
  interface Placed {
    item: BuiltItem;
    z: number;
    side: 1 | -1;
    shadow: THREE.Mesh;
    restX: number;
    restY: number;
    restRot: number;
  }
  const placed: Placed[] = kinds.map((kind, i) => {
    const item = ITEM_BUILDERS[kind](shared);
    scene.add(item.root);
    track({ dispose: item.dispose });
    const side = heroSlots[i].side;
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.visible = false;
    scene.add(shadow);
    return {
      item,
      z: heroSlots[i].z,
      side,
      shadow,
      restX: side * (SHELF_FRONT + 0.7),
      restY: BOARDS[REST_LEVEL] + 0.05 + (item.height * REST_SCALE) / 2,
      restRot: side > 0 ? -Math.PI / 2 : Math.PI / 2,
    };
  });

  /* ---------- estado y layout ---------- */
  let tall = false;
  let stops: number[] = [];
  let pullX = 0.7;
  let stopDist = 6.4;
  const applyLayout = () => {
    stopDist = tall ? 8.6 : 6.4;
    pullX = tall ? 0.35 : 0.75;
    stops = [0, ...placed.map((p) => p.z + stopDist), counterZ + (tall ? 9.5 : 7.6)];
  };
  applyLayout();

  const state = { intro: reduceMotion ? 1 : 0 };
  let introTween: gsap.core.Tween | null = null;
  let p = 0;
  let lastP = 0;
  let speed = 0;
  let time = 0;
  const ptr = { x: 0, y: 0 };
  const look = new THREE.Vector3(0, 0, -20);
  const lookTarget = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let fov = 56;
  let viewW = 1;
  let viewH = 1;

  const setView = () => {
    const offX = tall ? 0 : -viewW * 0.2;
    const offY = tall ? -viewH * 0.27 : 0;
    camera.setViewOffset(viewW, viewH, offX, offY, viewW, viewH);
  };

  return {
    resize(w, h) {
      viewW = Math.max(1, w);
      viewH = Math.max(1, h);
      tall = viewH >= viewW; // mismo criterio que `portrait:` de CSS
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.setSize(viewW, viewH, false);
      camera.aspect = viewW / viewH;
      applyLayout();
      setView();
      camera.updateProjectionMatrix();
    },

    intro() {
      if (reduceMotion) {
        state.intro = 1;
        return;
      }
      introTween?.kill();
      state.intro = 0;
      introTween = gsap.to(state, { intro: 1, duration: 2.2, ease: 'power3.inOut' });
    },

    frame(rawProgress, dt, pointer) {
      dt = clamp(dt, 0.001, 0.1);
      time += dt;
      // inercia de la escena (no del scroll): el progreso persigue al objetivo
      p += (clamp(rawProgress) - p) * (1 - Math.exp(-dt * 6));
      speed += (Math.abs(p - lastP) / dt - speed) * (1 - Math.exp(-dt * 5));
      lastP = p;
      ptr.x += (pointer.x - ptr.x) * (1 - Math.exp(-dt * 3));
      ptr.y += (pointer.y - ptr.y) * (1 - Math.exp(-dt * 3));

      // posición a lo largo del pasillo: frena frente a cada góndola
      const x = p * K;
      const j = Math.min(K - 1, Math.max(0, Math.floor(x)));
      const e = smooth(0.12, 0.88, x - j);
      const camZ = lerp(stops[j], stops[j + 1], e);
      const cz = camZ + (1 - state.intro) * 8;

      camera.position.set(
        Math.sin(p * 7) * 0.12 + ptr.x * 0.25,
        0.15 + Math.sin(p * 26) * 0.025 + ptr.y * 0.1,
        cz,
      );

      lookTarget.set(camera.position.x * 0.4, 0, cz - 12);
      placed.forEach((pl, i) => {
        const { item } = pl;
        const d = cz - pl.z;
        const pull = smooth(15, 8.5, d) * smooth(2.2, 5.2, d); // sale del estante al acercarte, vuelve al pasar
        const near = d > -4 && d < 40;
        item.root.visible = near;
        pl.shadow.visible = near && pull > 0.02;
        if (!near) return;

        const bob = Math.sin(time * 1.1 + i) * 0.05 * pull;
        const px = lerp(pl.restX, pl.side * pullX, pull);
        const py = lerp(pl.restY, 0.05, pull) + Math.sin(pull * Math.PI) * 0.35 + bob;
        const pz = pl.z + 0.5 * pull;
        item.root.position.set(px, py, pz);
        item.root.scale.setScalar(item.fit * lerp(REST_SCALE, 1, pull));
        const free = item.spin === 'y' ? time * 0.5 : Math.sin(time * 0.7 + i) * 0.55;
        item.root.rotation.y = lerp(pl.restRot, free, pull);
        item.tick?.(time);

        pl.shadow.position.set(px, FLOOR_Y + 0.02, pz);
        pl.shadow.scale.set(lerp(0.5, 1.15, pull), lerp(0.35, 0.7, pull), 1);

        // la mirada se desvía hacia la pieza cuando la sacás
        const w = smooth(18, 7, d) * smooth(0.6, 3, d);
        if (w > 0) {
          tmp.set(px * 0.8, py * 0.8, pz);
          lookTarget.lerp(tmp, w * 0.7);
        }
      });

      const wp = smooth(26, 10, cz - counterZ);
      if (wp > 0) {
        tmp.set(0, 0.2, counterZ);
        lookTarget.lerp(tmp, wp * 0.8);
      }

      look.lerp(lookTarget, 1 - Math.exp(-dt * 4));
      camera.lookAt(look);

      const nextFov = 56 + Math.min(speed * 10, 6);
      if (Math.abs(nextFov - fov) > 0.05) {
        fov += (nextFov - fov) * 0.2;
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
      return { progress: p, index: Math.round(x) - 1 };
    },

    dispose() {
      introTween?.kill();
      disposables.forEach((d) => d.dispose());
      // Sin forceContextLoss: el <canvas> se reutiliza (StrictMode monta dos veces)
      renderer.dispose();
    },
  };
}
