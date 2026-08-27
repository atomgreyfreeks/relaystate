/**
 * The route ribbon — how a dispatch is drawn on the ground.
 *
 * The recorded events carry where a team was sent and never how it got there, so every route this
 * file draws is illustrative and says so on the card beside it. What it draws is the shape the
 * visual directives ask for in `docs/rescueworld/DEATH-STRANDING-REFERENCE.md`, directive 8: a
 * chain of tapered ribbon segments lying on the ground with gaps between them, each segment
 * pinched to nothing at both ends and widest in the middle, so the path reads as a direction
 * without an arrowhead and the ground it crosses reads through the gaps.
 *
 * The ribbon lies on the terrain rather than facing the camera. A route is a thing on the ground,
 * and a billboarded strip over a tilted landscape reads as a banner instead of a path.
 *
 * The module is geometry only: it holds no clock, no randomness and no state beyond the fade its
 * owner sets. The same points always build the same vertices.
 */
import * as THREE from "three";

export interface RouteOptions {
  /** the path, in world units, already sitting at the height it should be drawn at */
  points: THREE.Vector3[];
  /** the widest half-width of a segment, in world units */
  width?: number;
  /** how much of each segment's length is left as a gap before the next one */
  gap?: number;
  /** how many segments the path is cut into */
  segments?: number;
  colour: [number, number, number];
}

export interface Route {
  object: THREE.Object3D;
  /** 0 hides the route, 1 draws it at full strength */
  setFade(fade: number): void;
  vertexCount: number;
}

const V = `
  attribute float aSide;
  varying float vSide;
  void main(){
    vSide = aSide;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

/**
 * The alpha falls off across the ribbon's width as the square of the distance from its middle, so
 * the core is bright and the edge is soft — the same falloff the dust already uses.
 */
const F = `
  precision highp float;
  uniform vec3 uColour; uniform float uFade;
  varying float vSide;
  void main(){
    float a = pow(1.0 - abs(vSide), 2.0) * uFade;
    if (a <= 0.004) discard;
    gl_FragColor = vec4(uColour * a, a);
  }`;

/** One point along the path at distance `t` through it, walking the recorded positions in order. */
function walk(points: readonly THREE.Vector3[], lengths: readonly number[], total: number,
  t: number, out: THREE.Vector3): THREE.Vector3 {
  const want = Math.max(0, Math.min(1, t)) * total;
  let run = 0;
  for (let i = 0; i < lengths.length; i++) {
    if (run + lengths[i] >= want || i === lengths.length - 1) {
      const k = lengths[i] > 0 ? (want - run) / lengths[i] : 0;
      return out.copy(points[i]).lerp(points[i + 1], Math.max(0, Math.min(1, k)));
    }
    run += lengths[i];
  }
  return out.copy(points[points.length - 1]);
}

export function buildRoute(opts: RouteOptions): Route {
  const points = opts.points;
  const width = opts.width ?? 0.006;
  const gap = opts.gap ?? 0.40;
  const segments = Math.max(1, opts.segments ?? 9);

  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i + 1 < points.length; i++) {
    const d = points[i].distanceTo(points[i + 1]);
    lengths.push(d);
    total += d;
  }

  // Each segment is a strip of quads: four samples along it, pinched at both ends.
  const ALONG = 4;
  const quads = segments * (ALONG - 1);
  const pos = new Float32Array(quads * 6 * 3);
  const side = new Float32Array(quads * 6);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), dir = new THREE.Vector3();
  const perp = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const left = new THREE.Vector3(), right = new THREE.Vector3();
  const store = (v: number, x: number, y: number, z: number, s: number) => {
    pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
    side[v] = s;
  };

  let v = 0;
  const span = 1 / segments;
  const drawn = span * (1 - gap);
  const edge: THREE.Vector3[] = [];
  const halfWidth: number[] = [];
  for (let s = 0; s < segments; s++) {
    edge.length = 0;
    halfWidth.length = 0;
    for (let i = 0; i < ALONG; i++) {
      const k = i / (ALONG - 1);
      const t = s * span + k * drawn;
      edge.push(walk(points, lengths, total, t, new THREE.Vector3()));
      // pinched to nothing at both ends of the segment, widest in its middle
      halfWidth.push(Math.sin(k * Math.PI) * width);
    }
    for (let i = 0; i + 1 < ALONG; i++) {
      a.copy(edge[i]); b.copy(edge[i + 1]);
      dir.copy(b).sub(a);
      if (dir.lengthSq() < 1e-12) continue;
      perp.copy(dir).normalize().cross(up).normalize();
      left.copy(perp).multiplyScalar(halfWidth[i]);
      right.copy(perp).multiplyScalar(halfWidth[i + 1]);
      store(v++, a.x - left.x, a.y - left.y, a.z - left.z, -1);
      store(v++, a.x + left.x, a.y + left.y, a.z + left.z, 1);
      store(v++, b.x + right.x, b.y + right.y, b.z + right.z, 1);
      store(v++, a.x - left.x, a.y - left.y, a.z - left.z, -1);
      store(v++, b.x + right.x, b.y + right.y, b.z + right.z, 1);
      store(v++, b.x - right.x, b.y - right.y, b.z - right.z, -1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
  geo.setDrawRange(0, v);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColour: { value: new THREE.Vector3(...opts.colour) },
      uFade: { value: 0 },
    },
    vertexShader: V, fragmentShader: F,
    transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, depthTest: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;
  mesh.visible = false;

  return {
    object: mesh,
    vertexCount: v,
    setFade(fade: number) {
      const f = Math.max(0, Math.min(1, fade));
      mat.uniforms.uFade.value = f;
      mesh.visible = f > 0.004;
    },
  };
}
