/**
 * RESCUE WORLD — the grade.
 *
 * This file is a port, as code, of the post-processing chain in the Halo Forge
 * engine (`liveref/media/components/halo-forge.html`, lines 2439 to 2712 of the
 * 2026-08-23 revision): the bright-pass and blur shader, the grade shader, the
 * framebuffer helpers, the three-pass composite, and the seven named looks. It
 * draws the whole frame twice more before the screen sees it — a bright pass and
 * a two-direction blur into quarter-size buffers, which is the halation, then one
 * grade pass that reads the frame and the halation together and applies, in this
 * order: a lens-style chromatic split that grows toward the edge, the halation
 * add, exposure, contrast, lift, gamma, saturation, scanlines, mid-tone-weighted
 * film grain, and a vignette, mixed back against the raw frame by one strength
 * value. Rescue World runs it as its final pass so that Rescue World is graded by
 * the same program that grades the owner's globe. The numbers in the LOOKS table
 * are the owner's approved values and must not drift from the Halo Forge source
 * without his sign-off; a change here is a change to an approved look, not a
 * tuning detail. Two things are adapted for the module boundary and nothing else:
 * the context may be WebGL 1 or WebGL 2, and the scene arrives either as a
 * wrapped render pass (`beginScene` / `endSceneAndCompose`) or as a texture the
 * caller already rendered (`postCompose` with a texture). The grade uniform map
 * is named `gr` rather than the source's `gl`, so it cannot be confused with the
 * context.
 */

/** Either WebGL version. The shaders are GLSL ES 1.00, which WebGL 2 accepts. */
export type GLContext = WebGLRenderingContext | WebGL2RenderingContext;

/** One off-screen buffer: its texture, its framebuffer, its optional depth. */
export interface RenderTarget {
  tex: WebGLTexture | null;
  fb: WebGLFramebuffer | null;
  rb: WebGLRenderbuffer | null;
  w: number;
  h: number;
}

/** The thirteen numbers a look sets. */
export interface LookValues {
  halation: number;
  haloThreshold: number;
  haloSpread: number;
  exposure: number;
  contrast: number;
  lift: number;
  gamma: number;
  saturation: number;
  grain: number;
  grainSize: number;
  vignette: number;
  split: number;
  scan: number;
}

/** A named look: the thirteen numbers plus the name shown on screen. */
export interface Look extends LookValues {
  label: string;
}

/** What the grade pass reads: a look's values plus the whole-grade mix. */
export interface GradeParams extends LookValues {
  /** the whole grade, mixed against the raw frame; 0 passes the frame through */
  postStrength: number;
}

/** Everything the chain owns. `initPost` builds it, `resizePost` sizes it. */
export interface PostState {
  gl: GLContext;
  quad: WebGLBuffer | null;
  blur: WebGLProgram;
  grade: WebGLProgram;
  bl: Record<string, WebGLUniformLocation | null>;
  gr: Record<string, WebGLUniformLocation | null>;
  scene: RenderTarget | null;
  h1: RenderTarget | null;
  h2: RenderTarget | null;
  w: number;
  h: number;
  look: string;
  params: GradeParams;
}

const QUAD_VERT = `
precision highp float;
attribute vec2 aPos;
varying vec2 vUV;
void main(){ vUV = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const BLUR_FRAG = `
precision highp float;
uniform sampler2D uSrc;
uniform vec2  uStep;        /* one texel along the direction being blurred */
uniform float uThreshold;   /* below this the pixel contributes no halation */
uniform float uBright;      /* 1 on the first pass, 0 on the second */
varying vec2 vUV;

void main(){
  float w[5];
  w[0] = 0.227027; w[1] = 0.194594; w[2] = 0.121621;
  w[3] = 0.054054; w[4] = 0.016216;
  vec3 sum = texture2D(uSrc, vUV).rgb * w[0];
  for (int i = 1; i < 5; i++){
    float f = float(i);
    sum += texture2D(uSrc, vUV + uStep * f).rgb * w[i];
    sum += texture2D(uSrc, vUV - uStep * f).rgb * w[i];
  }
  if (uBright > 0.5){
    float l = dot(sum, vec3(0.299, 0.587, 0.114));
    sum *= smoothstep(uThreshold, uThreshold + 0.25, l);
  }
  gl_FragColor = vec4(sum, 1.0);
}`;

const GRADE_FRAG = `
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uHalo;
uniform vec2  uRes;
uniform float uTime;

uniform float uHalation;
uniform float uExposure;
uniform float uContrast;
uniform float uLift;
uniform float uGamma;
uniform float uSaturation;
uniform float uGrain;
uniform float uGrainSize;
uniform float uVignette;
uniform float uSplit;       /* channel separation, in pixels at the edge */
uniform float uScan;
uniform float uStrength;    /* the whole grade, mixed against the raw frame */

varying vec2 vUV;

float hash(vec2 p){
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main(){
  vec2 c = vUV - 0.5;
  float r2 = dot(c, c);

  /* channel separation grows toward the edge of the frame, the way a real
     lens shows it, rather than sitting flat across the whole image */
  vec3 raw;
  if (uSplit > 0.001){
    vec2 off = c * uSplit * r2 * 0.028;
    raw.r = texture2D(uScene, vUV + off).r;
    raw.g = texture2D(uScene, vUV).g;
    raw.b = texture2D(uScene, vUV - off).b;
  } else {
    raw = texture2D(uScene, vUV).rgb;
  }

  vec3 col = raw + texture2D(uHalo, vUV).rgb * uHalation;

  col *= uExposure;
  col = (col - 0.5) * uContrast + 0.5;
  col += uLift;
  col = pow(max(col, 0.0), vec3(1.0 / max(uGamma, 0.05)));

  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, uSaturation);

  if (uScan > 0.001){
    float s = sin(vUV.y * uRes.y * 1.5708);
    col *= 1.0 - uScan * 0.5 * (0.5 + 0.5 * s);
  }

  if (uGrain > 0.001){
    vec2 gp = floor(gl_FragCoord.xy / max(uGrainSize, 0.5));
    float g = hash(gp + fract(uTime) * 91.7) - 0.5;
    /* grain sits mostly in the mid tones, the way film does, so the blacks
       stay clean and the highlights do not fizz */
    float weight = 1.0 - abs(l * 2.0 - 1.0);
    col += g * uGrain * (0.35 + 0.65 * weight);
  }

  col *= 1.0 - uVignette * r2 * 1.6;

  gl_FragColor = vec4(mix(raw, max(col, 0.0), uStrength), 1.0);
}`;

function compile(gl: GLContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type) as WebGLShader;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s) || "shader compile failed");
  return s;
}

function makeTarget(gl: GLContext, w: number, h: number, wantDepth: boolean): RenderTarget {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  let rb: WebGLRenderbuffer | null = null;
  if (wantDepth){
    rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                               gl.RENDERBUFFER, rb);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fb, rb, w, h };
}

function dropTarget(gl: GLContext, t: RenderTarget | null){
  if (!t) return;
  gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb);
  if (t.rb) gl.deleteRenderbuffer(t.rb);
}

function linkQuad(gl: GLContext, frag: string): WebGLProgram {
  const p = gl.createProgram() as WebGLProgram;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, QUAD_VERT));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(p) || "program link failed");
  return p;
}

/* ---- looks -------------------------------------------------------
   Each look is a full set of grade values. In the Halo Forge engine the number
   keys jump between them, which is the only way to judge a grade — by flicking
   between two versions of the same frame, not by dragging one slider and
   remembering. These numbers are transcribed from that engine unchanged. */

export const LOOKS: Record<string, Look> = {
  clean:    { label:'Clean',    halation:.35, haloThreshold:.42, haloSpread:1.6,
              exposure:1, contrast:1.05, lift:0, gamma:1, saturation:1,
              grain:0, grainSize:1.5, vignette:.12, split:0, scan:0 },
  halation: { label:'Halation', halation:1.15, haloThreshold:.3, haloSpread:2.6,
              exposure:1.04, contrast:1.08, lift:.006, gamma:1, saturation:1,
              grain:.02, grainSize:1.5, vignette:.2, split:.3, scan:0 },
  filmic:   { label:'Filmic',   halation:.6, haloThreshold:.38, haloSpread:2,
              exposure:1, contrast:1.22, lift:.022, gamma:1.06, saturation:.92,
              grain:.055, grainSize:1.6, vignette:.34, split:.5, scan:0 },
  print:    { label:'Print',    halation:.28, haloThreshold:.5, haloSpread:1.2,
              exposure:1.06, contrast:1.42, lift:.004, gamma:.94, saturation:.7,
              grain:.085, grainSize:2.4, vignette:.42, split:0, scan:0 },
  monitor:  { label:'Monitor',  halation:.8, haloThreshold:.34, haloSpread:2.2,
              exposure:1, contrast:1.1, lift:.03, gamma:1, saturation:1,
              grain:.045, grainSize:1, vignette:.3, split:.9, scan:.35 },
  overdrive:{ label:'Overdrive',halation:2.1, haloThreshold:.18, haloSpread:3.4,
              exposure:1.15, contrast:1.18, lift:.01, gamma:1, saturation:1.1,
              grain:.03, grainSize:1.4, vignette:.24, split:1.4, scan:0 },
  raw:      { label:'Raw',      halation:0, haloThreshold:.5, haloSpread:1,
              exposure:1, contrast:1, lift:0, gamma:1, saturation:1,
              grain:0, grainSize:1.5, vignette:0, split:0, scan:0 },
};

export const LOOK_KEYS: string[] = Object.keys(LOOKS);

/**
 * Copy one look's values into the state. An unknown name falls back to `clean`,
 * as in the source. The whole-grade mix `postStrength` is a separate control and
 * is deliberately left where the caller put it.
 */
export function applyLook(state: PostState, name: string): Look {
  const k = LOOKS[name] ? name : 'clean';
  const L = LOOKS[k];
  const into = state.params as unknown as Record<string, number>;
  const from = L as unknown as Record<string, number>;
  for (const f in L) if (f !== 'label') into[f] = from[f];
  state.look = k;
  return L;
}

/**
 * Build the chain: the full-screen triangle, the two programs, the uniform maps.
 * Call `resizePost` before the first frame. The state starts on the `clean` look
 * at full strength; the Halo Forge engine starts on a saved slider position
 * instead, which is a session value rather than an approved look.
 */
export function initPost(gl: GLContext): PostState {
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);

  const blur = linkQuad(gl, BLUR_FRAG);
  const grade = linkQuad(gl, GRADE_FRAG);
  const bl: Record<string, WebGLUniformLocation | null> = {};
  const gr: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ['uSrc','uStep','uThreshold','uBright'])
    bl[n] = gl.getUniformLocation(blur, n);
  for (const n of ['uScene','uHalo','uRes','uTime','uHalation','uExposure',
                   'uContrast','uLift','uGamma','uSaturation','uGrain',
                   'uGrainSize','uVignette','uSplit','uScan','uStrength'])
    gr[n] = gl.getUniformLocation(grade, n);

  const { label: _label, ...clean } = LOOKS.clean;
  return {
    gl, quad, blur, grade, bl, gr, scene: null, h1: null, h2: null,
    w: 0, h: 0, look: 'clean',
    params: { ...clean, postStrength: 1 },
  };
}

/**
 * Size the three buffers to the drawing buffer. The two halation buffers are a
 * quarter of the frame in each direction, which is where the blur gets cheap.
 * Re-sizing to the size it already has does nothing.
 */
export function resizePost(state: PostState, w: number, h: number){
  if (state.w === w && state.h === h) return;
  const gl = state.gl;
  dropTarget(gl, state.scene); dropTarget(gl, state.h1); dropTarget(gl, state.h2);
  const qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2);
  state.scene = makeTarget(gl, w, h, true);
  state.h1 = makeTarget(gl, qw, qh, false);
  state.h2 = makeTarget(gl, qw, qh, false);
  state.w = w; state.h = h;
}

/**
 * Point drawing at the scene buffer and clear it. The caller renders its frame
 * between this and `endSceneAndCompose`. Depth writing is opened before the
 * clear, because clearing depth does nothing while the depth mask is off.
 */
export function beginScene(state: PostState){
  const gl = state.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, state.scene ? state.scene.fb : null);
  gl.viewport(0, 0, state.w, state.h);
  gl.depthMask(true);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * The three-pass composite: bright pass and horizontal blur into the first
 * quarter-size buffer, vertical blur into the second, then the grade to the
 * screen. `time` drives the grain and is the only per-frame value; pass the
 * playback clock, not a wall clock, so a replay grades identically. Pass
 * `sceneTexture` to grade a frame the caller rendered somewhere else; leave it
 * out to grade what `beginScene` captured.
 */
export function postCompose(state: PostState, time: number, sceneTexture?: WebGLTexture | null){
  const gl = state.gl, P = state, S = state.params;
  if (!P.scene || !P.h1 || !P.h2) return;
  const w = P.w, h = P.h;
  const src = sceneTexture || P.scene.tex;

  gl.disable(gl.DEPTH_TEST);
  gl.depthMask(false);
  gl.disable(gl.BLEND);
  gl.bindBuffer(gl.ARRAY_BUFFER, P.quad);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const qw = P.h1.w, qh = P.h1.h;
  const spread = Math.max(0.1, S.haloSpread);

  /* bright pass and horizontal blur */
  gl.useProgram(P.blur);
  gl.bindFramebuffer(gl.FRAMEBUFFER, P.h1.fb);
  gl.viewport(0, 0, qw, qh);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, src);
  gl.uniform1i(P.bl.uSrc, 0);
  gl.uniform2f(P.bl.uStep, spread / qw, 0);
  gl.uniform1f(P.bl.uThreshold, S.haloThreshold);
  gl.uniform1f(P.bl.uBright, 1);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  /* vertical blur */
  gl.bindFramebuffer(gl.FRAMEBUFFER, P.h2.fb);
  gl.bindTexture(gl.TEXTURE_2D, P.h1.tex);
  gl.uniform2f(P.bl.uStep, 0, spread / qh);
  gl.uniform1f(P.bl.uBright, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  /* the grade, to the screen */
  gl.useProgram(P.grade);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, w, h);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, src);
  gl.uniform1i(P.gr.uScene, 0);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, P.h2.tex);
  gl.uniform1i(P.gr.uHalo, 1);
  gl.uniform2f(P.gr.uRes, w, h);
  gl.uniform1f(P.gr.uTime, time);
  gl.uniform1f(P.gr.uHalation, S.halation);
  gl.uniform1f(P.gr.uExposure, S.exposure);
  gl.uniform1f(P.gr.uContrast, S.contrast);
  gl.uniform1f(P.gr.uLift, S.lift);
  gl.uniform1f(P.gr.uGamma, S.gamma);
  gl.uniform1f(P.gr.uSaturation, S.saturation);
  gl.uniform1f(P.gr.uGrain, S.grain);
  gl.uniform1f(P.gr.uGrainSize, S.grainSize);
  gl.uniform1f(P.gr.uVignette, S.vignette);
  gl.uniform1f(P.gr.uSplit, S.split);
  gl.uniform1f(P.gr.uScan, S.scan);
  gl.uniform1f(P.gr.uStrength, S.postStrength);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.activeTexture(gl.TEXTURE0);
  gl.enable(gl.BLEND);
}

/**
 * Close the wrapped render pass: grade what was drawn since `beginScene` and put
 * it on the screen. The pair `beginScene` / `endSceneAndCompose` is how the Halo
 * Forge engine itself uses this chain.
 */
export function endSceneAndCompose(state: PostState, time: number){
  postCompose(state, time);
}
