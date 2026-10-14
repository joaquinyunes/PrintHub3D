import * as THREE from 'three';

/**
 * Materiales planos de la escena "supermercado": sombreado en 3 bandas, contorno de
 * tinta y niebla de color papel para que el fondo se disuelva en el fondo de la web.
 * El color pasa por <colorspace_fragment> para respetar los hex de la paleta.
 */

export interface FogUniforms {
  uFogColor: { value: THREE.Color };
  uFogNear: { value: number };
  uFogFar: { value: number };
}

export interface SharedUniforms extends FogUniforms {
  uBuildY: { value: number };
}

const FLAT_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying float vWY;
varying vec3 vLocal;
varying vec3 vCol;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWY = wp.y;
  vLocal = position;
  vec4 mv = viewMatrix * wp;
  vV = mv.xyz;
  vN = normalize(normalMatrix * normal);
  vCol = vec3(1.0);
  #ifdef USE_COLOR
    vCol = color;
  #endif
  gl_Position = projectionMatrix * mv;
}`;

const FLAT_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uBuildY;
uniform float uFlat;
uniform float uLayers;
varying vec3 vN;
varying vec3 vV;
varying float vWY;
varying vec3 vLocal;
varying vec3 vCol;
void main() {
  if (vWY > uBuildY) discard;
  vec3 n = uFlat > 0.5 ? normalize(cross(dFdx(vV), dFdy(vV))) : normalize(vN);
  vec3 L = normalize(vec3(-0.35, 0.8, 0.6));
  float ndl = dot(n, L);
  float band = ndl > 0.4 ? 1.0 : (ndl > -0.15 ? 0.86 : 0.72);
  float f = fract(vLocal.y * uLayers);
  float layer = uLayers < 0.5 ? 1.0 : 0.93 + 0.07 * smoothstep(0.0, 0.45, f);
  vec3 base = uColor * vCol;
  vec3 col = base * band * layer;
  if (!gl_FrontFacing) col = base * 0.55;
  float fog = smoothstep(uFogNear, uFogFar, length(vV));
  col = mix(col, uFogColor, fog);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

const OUTLINE_VERT = /* glsl */ `
attribute float aW;
uniform float uOutline;
varying float vWY;
varying float vDist;
void main() {
  float w = uOutline + aW;
  vec3 p = position + normal * w;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWY = wp.y;
  vec4 mv = viewMatrix * wp;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

const OUTLINE_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
uniform float uBuildY;
varying float vWY;
varying float vDist;
void main() {
  if (vWY > uBuildY) discard;
  float fog = smoothstep(uFogNear, uFogFar, vDist);
  gl_FragColor = vec4(mix(uColor, uFogColor, fog), 1.0);
  #include <colorspace_fragment>
}`;

export function createFlatMaterial(
  shared: SharedUniforms,
  o: { color?: string; vertexColors?: boolean; flat?: boolean; layers?: number },
) {
  return new THREE.ShaderMaterial({
    vertexShader: FLAT_VERT,
    fragmentShader: FLAT_FRAG,
    side: THREE.DoubleSide,
    vertexColors: !!o.vertexColors,
    uniforms: {
      uColor: { value: new THREE.Color(o.color ?? '#ffffff') },
      uBuildY: shared.uBuildY,
      uFogColor: shared.uFogColor,
      uFogNear: shared.uFogNear,
      uFogFar: shared.uFogFar,
      uFlat: { value: o.flat ? 1 : 0 },
      uLayers: { value: o.layers ?? 0 },
    },
  });
}

/** `width` se suma a la extrusión por vértice (atributo aW) y se mide en unidades del objeto. */
export function createOutlineMaterial(shared: SharedUniforms, color: string, width = 0) {
  return new THREE.ShaderMaterial({
    vertexShader: OUTLINE_VERT,
    fragmentShader: OUTLINE_FRAG,
    side: THREE.BackSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uBuildY: shared.uBuildY,
      uFogColor: shared.uFogColor,
      uFogNear: shared.uFogNear,
      uFogFar: shared.uFogFar,
      uOutline: { value: width },
    },
  });
}

/* ---------- Piso: baldosas, guía amarilla central y niebla ---------- */
const FLOOR_VERT = /* glsl */ `
varying vec3 vWP;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FLOOR_FRAG = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uInk;
uniform vec3 uSignal;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
varying vec3 vWP;
void main() {
  vec2 g = vWP.xz / 2.5;
  vec2 d = abs(fract(g - 0.5) - 0.5) / fwidth(g);
  float line = 1.0 - min(min(d.x, d.y), 1.0);
  vec3 col = mix(uBase, uInk, line * 0.2);
  float stripe = step(abs(vWP.x), 0.09) * step(fract(vWP.z / 1.4), 0.55);
  col = mix(col, uSignal, stripe);
  float dist = length(cameraPosition - vWP);
  col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, dist));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export function createFloorMaterial(fog: FogUniforms, base: string, ink: string, signal: string) {
  return new THREE.ShaderMaterial({
    vertexShader: FLOOR_VERT,
    fragmentShader: FLOOR_FRAG,
    uniforms: {
      uBase: { value: new THREE.Color(base) },
      uInk: { value: new THREE.Color(ink) },
      uSignal: { value: new THREE.Color(signal) },
      uFogColor: fog.uFogColor,
      uFogNear: fog.uFogNear,
      uFogFar: fog.uFogFar,
    },
  });
}
