/**
 * RESCUE WORLD — the simulated damage.
 *
 * The whole world is a labelled exercise, so the damage in it is shown fully rather than
 * hinted at: burn-coloured scarring that stays on the ground, scattered collapse marks, and
 * slow dust standing over the worst of it. Two rules bound all of it and both are visible on
 * screen rather than only written down.
 *
 * First, every mark here comes from something the run recorded. A collapse mark exists because
 * a landslide polygon exists at that coordinate in the Geospatial Information Authority's
 * published layer, or because the log recorded an outcome there. Nothing is scattered for
 * effect where the record says nothing happened.
 *
 * Second, the simulated marks are drawn so that nobody can mistake them for the observed
 * layers. The observed landslide zones and road closures are cold hairlines. The simulated
 * damage is burn-coloured, diffuse and soft-edged, and it never draws a line. And no simulated
 * damage is ever put on the real building models: the exercise's sites sit far north of the
 * mapped city block, and the display never implies otherwise.
 *
 * Determinism: the scatter comes from an integer hash of the site's own index, and every
 * animation is a function of the playback tick alone. Two visits to the same tick draw the
 * same dust in the same places.
 */
import * as THREE from "three";

/** one deterministic number in 0..1 from two integers — no random source anywhere */
function hash01(a: number, b: number) {
  let n = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** a place the simulation damages, and the moment the log says it happened */
export interface DamageSite {
  x: number; y: number; z: number;
  /** the playback tick the damage appears at */
  tick: number;
  /** roughly how wide the damage is, in world units */
  spread: number;
  /** 0 for a mapped hazard zone, 1 for a recorded outcome — outcomes burn harder */
  weight: number;
}

export interface DamageOptions {
  sites: DamageSite[];
  burn: readonly [number, number, number];
  /** builds a point material in the page's own layered-light style */
  point(pow: number, sizeMul: number, gain: number, white: number, ring?: number):
    THREE.ShaderMaterial;
}

export interface DamageField {
  objects: THREE.Points[];
  /** place every mark for one playback tick */
  update(tick: number): void;
  /** how many points this field costs, for the frame-cost note */
  count: number;
}

const DUST_V = `
  attribute float aBirth; attribute float aPhase; attribute float aSize;
  attribute vec3 aDrift; attribute vec3 aColor;
  uniform float uTick; uniform float uPeriod; uniform float uPix; uniform float uGain;
  varying vec3 vCol; varying float vA;
  void main(){
    float age = uTick - aBirth;
    vCol = aColor;
    if (age < 0.0){
      vA = 0.0;
      gl_PointSize = 0.0;
      gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
      return;
    }
    float u = fract(age / uPeriod + aPhase);
    vec3 p = position + aDrift * u;
    float rise = smoothstep(0.0, 0.16, u) * (1.0 - smoothstep(0.45, 1.0, u));
    // the plume is thickest as it happens and thins to a haze that never quite leaves
    float settle = 0.34 + 0.66 * (1.0 - smoothstep(0.0, 110.0, age));
    vA = rise * settle * uGain;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(aSize * (0.5 + u * 1.9) * uPix / max(0.02, -mv.z), 1.0, 420.0);
    gl_Position = projectionMatrix * mv;
  }`;
const DUST_F = `
  precision highp float;
  varying vec3 vCol; varying float vA;
  void main(){
    float r = min(1.0, length(gl_PointCoord - 0.5) * 2.0);
    float a = pow(1.0 - r, 2.4) * vA;
    if (a <= 0.003) discard;
    gl_FragColor = vec4(vCol * a, a);
  }`;

export function buildDamage(opts: DamageOptions): DamageField {
  const { sites, burn } = opts;

  // ---- collapse marks: hard little embers scattered inside the damaged ground
  const perSite = 9;
  const debrisN = sites.length * perSite;
  const dPos = new Float32Array(debrisN * 3);
  const dSize = new Float32Array(debrisN);
  const dAlpha = new Float32Array(debrisN);
  const dCol = new Float32Array(debrisN * 3);
  const dBirth = new Float32Array(debrisN);
  sites.forEach((s, i) => {
    for (let k = 0; k < perSite; k++) {
      const j = i * perSite + k;
      const ang = hash01(i, k * 3 + 1) * Math.PI * 2;
      const rad = Math.sqrt(hash01(i, k * 3 + 2)) * s.spread * (0.9 + s.weight * 0.7);
      dPos[j * 3] = s.x + Math.cos(ang) * rad;
      dPos[j * 3 + 1] = s.y + 0.004 + hash01(i, k * 3 + 3) * 0.006;
      dPos[j * 3 + 2] = s.z + Math.sin(ang) * rad;
      dSize[j] = 0.020 + 0.030 * hash01(i, k * 7 + 4) * (0.7 + s.weight);
      dBirth[j] = s.tick;
      dCol[j * 3] = burn[0]; dCol[j * 3 + 1] = burn[1]; dCol[j * 3 + 2] = burn[2];
    }
  });
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute("aSize", new THREE.BufferAttribute(dSize, 1));
  dGeo.setAttribute("aAlpha", new THREE.BufferAttribute(dAlpha, 1));
  dGeo.setAttribute("aColor", new THREE.BufferAttribute(dCol, 3));
  const debris = new THREE.Points(dGeo, opts.point(2.6, 1.0, 1.0, 0.06));
  debris.frustumCulled = false;
  debris.renderOrder = 4;

  // ---- the dust: slow points climbing out of the damaged ground and thinning as they go
  const perDust = 18;
  const dustN = sites.length * perDust;
  const uPos = new Float32Array(dustN * 3);
  const uBirth = new Float32Array(dustN);
  const uPhase = new Float32Array(dustN);
  const uSize = new Float32Array(dustN);
  const uDrift = new Float32Array(dustN * 3);
  const uCol = new Float32Array(dustN * 3);
  sites.forEach((s, i) => {
    for (let k = 0; k < perDust; k++) {
      const j = i * perDust + k;
      const ang = hash01(i + 991, k * 5 + 1) * Math.PI * 2;
      const rad = Math.sqrt(hash01(i + 991, k * 5 + 2)) * s.spread * 0.8;
      uPos[j * 3] = s.x + Math.cos(ang) * rad;
      uPos[j * 3 + 1] = s.y + 0.002;
      uPos[j * 3 + 2] = s.z + Math.sin(ang) * rad;
      uPhase[j] = hash01(i + 991, k * 5 + 3);
      uBirth[j] = s.tick;
      uSize[j] = 0.05 + 0.09 * hash01(i + 991, k * 5 + 4) * (0.7 + s.weight);
      const lean = (hash01(i + 991, k * 5 + 5) - 0.5) * 0.6;
      uDrift[j * 3] = lean * s.spread * 1.4;
      uDrift[j * 3 + 1] = 0.030 + 0.055 * s.weight + 0.02 * hash01(i, k + 77);
      uDrift[j * 3 + 2] = (hash01(i + 13, k * 5 + 6) - 0.5) * s.spread * 1.4;
      // the dust carries a little of the burn colour and a lot of bone: smoke, not fire
      uCol[j * 3] = 0.55 + 0.45 * burn[0];
      uCol[j * 3 + 1] = 0.52 + 0.30 * burn[1];
      uCol[j * 3 + 2] = 0.56 + 0.16 * burn[2];
    }
  });
  const uGeo = new THREE.BufferGeometry();
  uGeo.setAttribute("position", new THREE.BufferAttribute(uPos, 3));
  uGeo.setAttribute("aBirth", new THREE.BufferAttribute(uBirth, 1));
  uGeo.setAttribute("aPhase", new THREE.BufferAttribute(uPhase, 1));
  uGeo.setAttribute("aSize", new THREE.BufferAttribute(uSize, 1));
  uGeo.setAttribute("aDrift", new THREE.BufferAttribute(uDrift, 3));
  uGeo.setAttribute("aColor", new THREE.BufferAttribute(uCol, 3));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: {
      uTick: { value: 0 }, uPeriod: { value: 96 }, uPix: { value: 400 }, uGain: { value: 0.5 },
    },
    vertexShader: DUST_V, fragmentShader: DUST_F,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
  });
  const dust = new THREE.Points(uGeo, dustMat);
  dust.frustumCulled = false;
  dust.renderOrder = 4;

  const debrisMat = debris.material as THREE.ShaderMaterial;

  return {
    objects: [debris, dust],
    count: debrisN + dustN,
    update(tick) {
      dustMat.uniforms.uTick.value = tick;
      dustMat.uniforms.uPix.value = debrisMat.uniforms.uPix.value;
      for (let i = 0; i < sites.length; i++) {
        const age = tick - sites[i].tick;
        // the embers land hot and cool to a dull mark that stays for the rest of the run
        const a = age < 0 ? 0
          : 0.26 + 0.62 * Math.exp(-age / 26) + 0.18 * sites[i].weight;
        for (let k = 0; k < perSite; k++) dAlpha[i * perSite + k] = a;
      }
      (dGeo.getAttribute("aAlpha") as THREE.BufferAttribute).needsUpdate = true;
    },
  };
}
