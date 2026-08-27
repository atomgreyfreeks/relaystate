/**
 * RESCUE WORLD — the free camera.
 *
 * A person flies this world the way a person flies a strategy game: drag to orbit, wheel to
 * zoom toward whatever the pointer is over, right-drag or shift-drag to slide across the
 * ground, W A S D to fly, Q and E or R and F for height, and the pointer at the window edge to
 * scroll. Every movement eases in and eases out — nothing starts or stops at full speed — and
 * the camera can never pass below the ground, because the rig is lifted whenever the elevation
 * under it would come within a fixed clearance of the lens.
 *
 * The conventions are the ones named in `docs/rescueworld/UX-REFERENCES.md` section 4.5, taken
 * from thirty years of real-time-strategy interfaces: edge scroll that eases in, camera
 * bookmarks on the number keys, a home control stacked with zoom, and an oblique default view
 * rather than a plan view. The opening is Earth-2's move: one uninterrupted eased flight from
 * high above the whole terrain down to the first site the run touches.
 *
 * The camera is a viewpoint, not history. Nothing here writes to the replay, reads a random
 * source, or changes what the log says happened; a person gets freedom of viewpoint and
 * freedom of interrogation, never freedom of history.
 */
import * as THREE from "three";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const D2R = Math.PI / 180;

/** where the camera stands: what it looks at, which way round, and how far back */
export interface Pose {
  tx: number; ty: number; tz: number;
  yaw: number; pitch: number; dist: number;
}

export interface RigOptions {
  /** the height of the ground under one world position, in world units */
  groundY(x: number, z: number): number;
  /** the ground rectangle, so the camera cannot wander off the data */
  mapW: number;
  mapD: number;
  /** the pose the home control returns to */
  home: Pose;
  /** the world units the lens always keeps above the ground */
  clearance: number;
}

export interface Rig {
  cam: THREE.PerspectiveCamera;
  /** advance the camera by one frame of real time */
  update(dt: number): void;
  /** the pose right now, rounded for reading */
  pose(): Pose;
  setPose(p: Pose, instant?: boolean): void;
  goHome(): void;
  zoomBy(factor: number): void;
  /** one eased flight to a place on the ground, over `seconds` */
  flyTo(x: number, y: number, z: number, dist: number, seconds: number): void;
  /** one eased flight to a whole pose, over `seconds` — what the camera tour glides on */
  glideTo(to: Pose, seconds: number): void;
  /** the opening: start high, then fly down to the first site the log touches */
  openWith(from: Pose, to: Pose, seconds: number): void;
  saveBookmark(slot: number): void;
  recallBookmark(slot: number): boolean;
  bookmarks(): number[];
  /** true while the opening flight is still running */
  flying(): boolean;
  /** stop any flight, because the person took the controls */
  takeOver(): void;
  /** where a camera ray through this normalized point meets the ground, or null */
  groundHit(ndcX: number, ndcY: number): THREE.Vector3 | null;
  /** the direction that ray travels, for a corner of the view that meets no ground at all */
  rayDir(ndcX: number, ndcY: number): THREE.Vector3;
  /** attach the pointer, wheel and key handling to one canvas and the window */
  attach(canvas: HTMLCanvasElement): void;
  /** the pointer's last position in window pixels, and whether it is over the world */
  pointer: { x: number; y: number; overWorld: boolean };
  /** switched off while a text field or a button has the keyboard */
  keysEnabled: boolean;
}

export function makeRig(opts: RigOptions): Rig {
  const cam = new THREE.PerspectiveCamera(38, 1.6, 0.004, 60);
  const p: Pose = { ...opts.home };
  const vel = { x: 0, z: 0, y: 0 };          // eased ground and height velocity
  const orbitVel = { yaw: 0, pitch: 0 };
  let zoomVel = 0;
  let edgeRamp = 0;

  const keys = new Set<string>();
  const pointer = { x: -1e4, y: -1e4, overWorld: false };
  const marks = new Map<number, Pose>();

  let fly: { from: Pose; to: Pose; t: number; dur: number } | null = null;

  // A real building is about ten metres tall on a world sixty kilometres deep, so the closest
  // stand and the clearance are both small: a camera that could never get lower than a hundred
  // metres could never look at the city model at all.
  const MIN_DIST = 0.008, MAX_DIST = 7.0;
  const MIN_PITCH = 6 * D2R, MAX_PITCH = 86 * D2R;
  const EDGE = 26;                            // window pixels that count as the edge

  function place() {
    const cp = Math.cos(p.pitch), sp = Math.sin(p.pitch);
    let px = p.tx + p.dist * cp * Math.sin(p.yaw);
    let py = p.ty + p.dist * sp;
    let pz = p.tz + p.dist * cp * Math.cos(p.yaw);
    // the hard clamp: if the ground under the lens would come inside the clearance, the whole
    // rig floats up together, so the view direction never twists on its own
    const floor = opts.groundY(px, pz) + opts.clearance;
    if (py < floor) {
      const lift = floor - py;
      p.ty += lift; py += lift;
    }
    const tFloor = opts.groundY(p.tx, p.tz);
    if (p.ty < tFloor) p.ty = tFloor;
    cam.position.set(px, py, pz);
    cam.lookAt(p.tx, p.ty, p.tz);
  }

  function clampPose() {
    const mx = opts.mapW * 0.85, mz = opts.mapD * 0.85;
    p.tx = clamp(p.tx, -mx, mx);
    p.tz = clamp(p.tz, -mz, mz);
    p.pitch = clamp(p.pitch, MIN_PITCH, MAX_PITCH);
    p.dist = clamp(p.dist, MIN_DIST, MAX_DIST);
    p.ty = clamp(p.ty, -1, 3.2);
  }

  function groundHit(ndcX: number, ndcY: number) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), cam);
    const o = ray.ray.origin, d = ray.ray.direction;
    const far = Math.max(4, p.dist * 8);
    const at = (t: number) => o.y + d.y * t - opts.groundY(o.x + d.x * t, o.z + d.z * t);
    if (at(0) < 0) return null;
    const N = 96;
    let t0 = 0;
    for (let i = 1; i <= N; i++) {
      const t = (i / N) * far;
      if (at(t) <= 0) {
        let lo = t0, hi = t;
        for (let k = 0; k < 14; k++) {
          const mid = (lo + hi) / 2;
          if (at(mid) > 0) lo = mid; else hi = mid;
        }
        const t2 = (lo + hi) / 2;
        return new THREE.Vector3(o.x + d.x * t2, o.y + d.y * t2, o.z + d.z * t2);
      }
      t0 = t;
    }
    return null;
  }

  function takeOver() { fly = null; }

  function update(dt: number) {
    const step = Math.min(0.05, Math.max(0.001, dt));

    if (fly) {
      fly.t = Math.min(fly.dur, fly.t + step);
      const k = ease(clamp(fly.t / fly.dur, 0, 1));
      const a = fly.from, b = fly.to;
      p.tx = a.tx + (b.tx - a.tx) * k;
      p.ty = a.ty + (b.ty - a.ty) * k;
      p.tz = a.tz + (b.tz - a.tz) * k;
      let dyaw = b.yaw - a.yaw;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      p.yaw = a.yaw + dyaw * k;
      p.pitch = a.pitch + (b.pitch - a.pitch) * k;
      // distance moves on a logarithmic path, so a hundredfold descent reads as one motion
      p.dist = a.dist * Math.pow(b.dist / a.dist, k);
      if (fly.t >= fly.dur) fly = null;
      clampPose(); place();
      return;
    }

    // ---- what the keyboard is asking for, in the camera's own ground frame
    let wantF = 0, wantR = 0, wantU = 0;
    if (keysEnabledRef.on) {
      if (keys.has("w")) wantF += 1;
      if (keys.has("s")) wantF -= 1;
      if (keys.has("a")) wantR -= 1;
      if (keys.has("d")) wantR += 1;
      // r opens the real-decision surface, so height comes from q and e, and from f for down
      if (keys.has("q")) wantU += 1;
      if (keys.has("e") || keys.has("f")) wantU -= 1;
    }

    // ---- edge scroll: the pointer at the window edge pans, easing in rather than snapping
    let edgeX = 0, edgeZ = 0;
    if (pointer.overWorld) {
      if (pointer.x < EDGE) edgeX = -(1 - pointer.x / EDGE);
      else if (pointer.x > innerWidth - EDGE) edgeX = 1 - (innerWidth - pointer.x) / EDGE;
      if (pointer.y < EDGE) edgeZ = 1 - pointer.y / EDGE;
      else if (pointer.y > innerHeight - EDGE) edgeZ = -(1 - (innerHeight - pointer.y) / EDGE);
    }
    const edging = edgeX !== 0 || edgeZ !== 0;
    edgeRamp = clamp(edgeRamp + (edging ? step * 2.6 : -step * 5.0), 0, 1);
    wantF += edgeZ * edgeRamp;
    wantR += edgeX * edgeRamp;

    // one speed law for both: proportional to how far back the camera is standing
    const speed = clamp(p.dist, MIN_DIST, MAX_DIST) * 1.55;
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
    const tx = -fx * wantF + fz * wantR;
    const tz = -fz * wantF - fx * wantR;
    const accel = 9.0, damp = 7.0;
    vel.x += (tx * speed - vel.x) * Math.min(1, accel * step);
    vel.z += (tz * speed - vel.z) * Math.min(1, accel * step);
    vel.y += (wantU * speed * 0.55 - vel.y) * Math.min(1, accel * step);
    p.tx += vel.x * step;
    p.tz += vel.z * step;
    p.ty += vel.y * step;
    if (!wantF && !wantR) {
      vel.x -= vel.x * Math.min(1, damp * step);
      vel.z -= vel.z * Math.min(1, damp * step);
    }
    if (!wantU) vel.y -= vel.y * Math.min(1, damp * step);

    // ---- the orbit and the zoom both coast to a stop rather than stopping with the pointer
    p.yaw += orbitVel.yaw * step;
    p.pitch += orbitVel.pitch * step;
    orbitVel.yaw -= orbitVel.yaw * Math.min(1, 11 * step);
    orbitVel.pitch -= orbitVel.pitch * Math.min(1, 11 * step);
    if (zoomVel !== 0) {
      p.dist *= Math.exp(zoomVel * step);
      zoomVel -= zoomVel * Math.min(1, 9 * step);
      if (Math.abs(zoomVel) < 1e-4) zoomVel = 0;
    }

    clampPose();
    place();
  }

  const keysEnabledRef = { on: true };

  function attach(canvas: HTMLCanvasElement) {
    let dragging = 0;                 // 0 none, 1 orbit, 2 pan
    let lastX = 0, lastY = 0;

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("pointerdown", (e) => {
      takeOver();
      // a synthetic pointer event carries no live pointer to capture, and a verification
      // drill that dispatches one must not take the page down
      try { canvas.setPointerCapture(e.pointerId); } catch { /* nothing to capture */ }
      dragging = (e.button === 2 || e.shiftKey) ? 2 : 1;
      lastX = e.clientX; lastY = e.clientY;
    });
    addEventListener("pointerup", (e) => {
      dragging = 0;
      try {
        if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      } catch { /* it was never captured */ }
    });
    addEventListener("pointermove", (e) => {
      pointer.x = e.clientX; pointer.y = e.clientY;
      pointer.overWorld = e.target === canvas;
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      if (dragging === 1) {
        p.yaw -= dx * 0.0052;
        p.pitch = clamp(p.pitch + dy * 0.0042, MIN_PITCH, MAX_PITCH);
        orbitVel.yaw = -dx * 0.10;
        orbitVel.pitch = dy * 0.08;
      } else {
        const k = p.dist * 0.0016;
        const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
        p.tx += (fz * dx + fx * dy) * k;
        p.tz += (-fx * dx + fz * dy) * k;
      }
      clampPose(); place();
    });
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      takeOver();
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const before = groundHit(ndcX, ndcY);
      const k = clamp(e.deltaY, -220, 220) * 0.0016;
      p.dist = clamp(p.dist * Math.exp(k), MIN_DIST, MAX_DIST);
      zoomVel += k * 1.1;
      place();
      // zoom toward the pointer: whatever was under it stays under it
      const after = groundHit(ndcX, ndcY);
      if (before && after) {
        p.tx += before.x - after.x;
        p.tz += before.z - after.z;
        clampPose(); place();
      }
    }, { passive: false });

    addEventListener("keydown", (e) => {
      if (!keysEnabledRef.on) return;
      const k = e.key.toLowerCase();
      if ("wasdqef".includes(k) && k.length === 1 && !e.ctrlKey && !e.metaKey) {
        keys.add(k);
        takeOver();
      }
    });
    addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
    addEventListener("blur", () => keys.clear());
  }

  place();

  return {
    cam,
    update,
    pointer,
    get keysEnabled() { return keysEnabledRef.on; },
    set keysEnabled(v: boolean) { keysEnabledRef.on = v; if (!v) keys.clear(); },
    pose: () => ({
      tx: +p.tx.toFixed(5), ty: +p.ty.toFixed(5), tz: +p.tz.toFixed(5),
      yaw: +p.yaw.toFixed(5), pitch: +p.pitch.toFixed(5), dist: +p.dist.toFixed(5),
    }),
    setPose(q, instant = true) {
      if (instant) {
        Object.assign(p, q);
        fly = null;
        clampPose(); place();
      } else {
        fly = { from: { ...p }, to: { ...q }, t: 0, dur: 1.1 };
      }
    },
    goHome() { fly = { from: { ...p }, to: { ...opts.home }, t: 0, dur: 1.25 }; },
    zoomBy(factor) { takeOver(); p.dist = clamp(p.dist * factor, MIN_DIST, MAX_DIST); place(); },
    flyTo(x, y, z, dist, seconds) {
      fly = {
        from: { ...p },
        to: { tx: x, ty: y, tz: z, yaw: p.yaw, pitch: Math.max(p.pitch, 28 * D2R), dist },
        t: 0, dur: seconds,
      };
    },
    glideTo(to, seconds) {
      fly = { from: { ...p }, to: { ...to }, t: 0, dur: Math.max(0.05, seconds) };
    },
    openWith(from, to, seconds) {
      Object.assign(p, from);
      clampPose(); place();
      fly = { from: { ...from }, to: { ...to }, t: 0, dur: seconds };
    },
    saveBookmark(slot) { marks.set(slot, { ...p }); },
    recallBookmark(slot) {
      const m = marks.get(slot);
      if (!m) return false;
      fly = { from: { ...p }, to: { ...m }, t: 0, dur: 0.85 };
      return true;
    },
    bookmarks: () => [...marks.keys()].sort((a, b) => a - b),
    flying: () => fly !== null,
    takeOver,
    groundHit,
    rayDir(ndcX, ndcY) {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), cam);
      return ray.ray.direction.clone();
    },
    attach,
  };
}
