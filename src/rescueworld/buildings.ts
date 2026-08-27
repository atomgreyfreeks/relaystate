/**
 * RESCUE WORLD — the real buildings, as pre-event context.
 *
 * Nine tiles of Japan's open 3D city model (Project PLATEAU, Uki City) are delivered beside the
 * baked run as a 3D Tiles tileset. Each tile is a `.b3dm` file: a 28-byte header, then a
 * feature table and a batch table whose four lengths the header gives, and then an ordinary
 * binary glTF. This module skips past those tables to the glTF and hands it to three.js.
 *
 * Two things in those files are not plain glTF and both are handled here rather than guessed
 * at. The meshes are compressed with Draco, so the decoder that ships with three.js is used;
 * its two files sit under `app/public/draco/` and are read from the page's own origin, never
 * from a remote host. And the vertices are earth-centred coordinates written relative to a
 * point the file carries under the `CESIUM_RTC` extension, so that point is read out of the
 * glTF's own JSON chunk and turned into one matrix that lands the tile on this world's ground:
 * earth-centred offsets become east, north and up at the tile's own latitude, and east, north
 * and up become the same world units the terrain uses.
 *
 * These buildings are context and nothing else. They stand where the city model says they
 * stand, which is around the epicentre and well south of the exercise's rescue sites. They are
 * never drawn damaged and are never marked as a rescue site, because the exercise's reports and
 * outcomes are invented and no invented outcome may be attached to a real, identified building
 * (`docs/rescueworld/SPEC.md`, section 6).
 *
 * A tile that cannot be read is reported and skipped. One unreadable tile costs its own
 * buildings and nothing else.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import type { Frame, Terrain } from "./terrain";

const D2R = Math.PI / 180;
const WGS84_A = 6378137.0;
const WGS84_F = 1 / 298.257223563;
const WGS84_E2 = WGS84_F * (2 - WGS84_F);
const METRES_PER_DEGREE_LAT = 110540;
const METRES_PER_DEGREE_LON_EQ = 111320;

export interface TileReport {
  uri: string;
  ok: boolean;
  buildings: number;
  vertices: number;
  note: string;
}

export interface BuildingSet {
  group: THREE.Group;
  tiles: TileReport[];
  /** every tile that loaded, added up */
  buildings: number;
  vertices: number;
  /** where the whole cut stands in the world, and how wide it is */
  centre: THREE.Vector3;
  spanM: number;
  /** the box the placed geometry actually occupies, for verification */
  box: { min: [number, number, number]; max: [number, number, number] };
  /** the tile cut's own coordinates, for the panel */
  lon: number;
  lat: number;
  setSelected(on: boolean): void;
}

/** earth-centred metres to longitude, latitude and height above the ellipsoid */
function toGeodetic(x: number, y: number, z: number) {
  const lon = Math.atan2(y, x);
  const p = Math.hypot(x, y);
  let lat = Math.atan2(z, p * (1 - WGS84_E2));
  let h = 0;
  for (let i = 0; i < 6; i++) {
    const s = Math.sin(lat);
    const N = WGS84_A / Math.sqrt(1 - WGS84_E2 * s * s);
    h = p / Math.cos(lat) - N;
    lat = Math.atan2(z, p * (1 - WGS84_E2 * N / (N + h)));
  }
  return { lon: lon / D2R, lat: lat / D2R, h };
}

/** the 28-byte b3dm header, and where the binary glTF starts behind it */
function openB3dm(buf: ArrayBuffer) {
  const dv = new DataView(buf);
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== "b3dm") throw new Error(`this is not a b3dm file: its first four bytes read ${magic}`);
  const byteLength = dv.getUint32(8, true);
  const ftJson = dv.getUint32(12, true);
  const ftBin = dv.getUint32(16, true);
  const btJson = dv.getUint32(20, true);
  const btBin = dv.getUint32(24, true);
  const start = 28 + ftJson + ftBin + btJson + btBin;
  if (start >= byteLength) throw new Error("the b3dm header leaves no room for a glTF payload");
  let buildings = 0;
  if (ftJson > 0) {
    try {
      const table = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 28, ftJson)));
      buildings = Number(table?.BATCH_LENGTH) || 0;
    } catch { buildings = 0; }
  }
  return { glb: buf.slice(start, byteLength), buildings };
}

/** the JSON chunk of a binary glTF, read without decoding the rest of it */
function glbJson(glb: ArrayBuffer): Record<string, unknown> | null {
  const dv = new DataView(glb);
  if (dv.byteLength < 20) return null;
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== "glTF") return null;
  const len = dv.getUint32(12, true);
  const type = dv.getUint32(16, true);
  if (type !== 0x4e4f534a) return null;      // 'JSON'
  try {
    return JSON.parse(new TextDecoder().decode(new Uint8Array(glb, 20, len)));
  } catch { return null; }
}

/**
 * The house look for a solid: an edge-lit volume, not a filled box.
 *
 * Three terms, in one colour at three brightnesses, because the palette has no second hue to
 * spend. The walls are barely lit, so a block reads as glass rather than as a white slab. The
 * flat top of each block catches a quiet fill, which is what tells a viewer these are roofs
 * seen from above. And where a surface turns away from the eye — which along the silhouette of
 * a box means its vertical corners and its roofline — the light climbs sharply, so the shape a
 * person actually sees is drawn by its own edges.
 *
 * The up direction is carried into the shader as the world's up seen from the camera, and both
 * it and the view term are read through an absolute value. The matrix that lands a tile on this
 * ground mirrors one axis, because the world's z axis points south while the tile's points
 * north, and a mirrored matrix flips the sign of every surface normal.
 */
const BUILDING_V = `
  varying vec3 vN; varying vec3 vV; varying vec3 vUp;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vUp = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const BUILDING_F = `
  precision highp float;
  uniform vec3 uColor; uniform float uGain;
  varying vec3 vN; varying vec3 vV; varying vec3 vUp;
  void main(){
    vec3 n = normalize(vN);
    float edge = pow(1.0 - abs(dot(n, normalize(vV))), 2.4);
    float roof = pow(abs(dot(n, normalize(vUp))), 2.0);
    float a = (0.075 + roof * 0.150 + edge * 0.45) * uGain;
    if (a <= 0.002) discard;
    gl_FragColor = vec4(uColor * a, a);
  }`;

export interface BuildingOptions {
  frame: Frame;
  terrain: Terrain;
  colour: readonly [number, number, number];
  /** where the decoder files sit under the page's own origin */
  dracoPath: string;
}

export async function loadBuildings(tilesetUrl: string,
  opts: BuildingOptions): Promise<BuildingSet> {
  const group = new THREE.Group();
  group.renderOrder = 1;
  const tiles: TileReport[] = [];
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Vector3(...opts.colour) },
      uGain: { value: 1.45 },
    },
    vertexShader: BUILDING_V, fragmentShader: BUILDING_F,
    transparent: true, blending: THREE.AdditiveBlending,
    // One shell of each block is drawn, not two. Drawing both sides of a closed box into an
    // additive buffer added the near wall's light to the far wall's, which is what turned six
    // hundred buildings into a field of flat white cages. The mirrored placing matrix reverses
    // which way a triangle faces, so the outward faces of these tiles are the back ones here.
    depthWrite: false, depthTest: true, side: THREE.BackSide,
  });

  const base = tilesetUrl.slice(0, tilesetUrl.lastIndexOf("/") + 1);
  let uris: string[] = [];
  let tileset: Record<string, unknown> | null = null;
  try {
    tileset = await (await fetch(tilesetUrl)).json();
    const found: string[] = [];
    const visit = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      const n = node as Record<string, unknown>;
      const content = n.content as { uri?: string } | undefined;
      if (content && typeof content.uri === "string") found.push(content.uri);
      const children = n.children;
      if (Array.isArray(children)) for (const c of children) visit(c);
    };
    visit((tileset as { root?: unknown }).root);
    uris = [...new Set(found)].sort();
  } catch (error) {
    tiles.push({
      uri: tilesetUrl, ok: false, buildings: 0, vertices: 0,
      note: `the tileset itself could not be read: ${(error as Error).message}`,
    });
  }

  const draco = new DRACOLoader().setDecoderPath(opts.dracoPath);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  // three.js does not know the earth-centred-offset extension, and this file applies it
  // itself; registering the name keeps the loader from warning about it on every tile.
  loader.register(() => ({ name: "CESIUM_RTC" } as unknown as never));

  let totalBuildings = 0, totalVertices = 0;
  let lon0 = 0, lat0 = 0, placed = 0;
  let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity;

  for (const uri of uris) {
    try {
      const response = await fetch(base + uri);
      if (!response.ok) throw new Error(`the server answered ${response.status}`);
      const { glb, buildings } = openB3dm(await response.arrayBuffer());
      const json = glbJson(glb);
      const rtc = ((json?.extensions as Record<string, unknown> | undefined)
        ?.CESIUM_RTC as { center?: number[] } | undefined)?.center;
      if (!rtc || rtc.length !== 3) {
        throw new Error("the tile carries no earth-centred offset, so it cannot be placed");
      }
      const gltf = await new Promise<{ scene: THREE.Object3D }>((resolve, reject) => {
        loader.parse(glb, "", (result) => resolve(result as unknown as { scene: THREE.Object3D }),
          (error) => reject(error instanceof Error ? error : new Error(String(error))));
      });

      // ---- the one matrix that lands this tile on this world's ground
      const g = toGeodetic(rtc[0], rtc[1], rtc[2]);
      const la = g.lat * D2R, lo = g.lon * D2R;
      const E = [-Math.sin(lo), Math.cos(lo), 0];
      const N = [-Math.sin(la) * Math.cos(lo), -Math.sin(la) * Math.sin(lo), Math.cos(la)];
      const U = [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
      // earth-centred offsets to east, up and north — the order this world's axes want
      const B = new THREE.Matrix4().set(
        E[0], E[1], E[2], 0,
        U[0], U[1], U[2], 0,
        N[0], N[1], N[2], 0,
        0, 0, 0, 1,
      );
      /**
       * Which way is up inside this tile's glTF, and how tall the buildings in it really are.
       *
       * A 3D Tiles payload may store its vertices already in the earth-centred frame, or in
       * the glTF convention where the y axis points up and the earth-centred z axis has been
       * swung into it. This tileset's manifest states neither, so both readings are measured
       * against the tile's own vertices and the one that gives a physically possible height
       * range wins: a city block is tens of metres tall and the wrong reading makes it
       * hundreds, which is not a close call.
       *
       * The measurement walks the vertices rather than the bounding box on purpose. An
       * axis-aligned box in the earth-centred frame is diagonal to the local vertical here, so
       * its corners overstate the height of what is inside it by a factor of three, and an
       * alignment built on that number lifts a whole city block into the air.
       */
      const upright = new THREE.Matrix4();                     // already earth-centred
      const swung = new THREE.Matrix4().set(                   // glTF y-up
        1, 0, 0, 0,
        0, 0, -1, 0,
        0, 1, 0, 0,
        0, 0, 0, 1,
      );
      const vertexHeights = (m: THREE.Matrix4) => {
        let lo2 = Infinity, hi2 = -Infinity;
        const v = new THREE.Vector3();
        gltf.scene.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          const attr = mesh.geometry.getAttribute("position");
          if (!attr) return;
          for (let i = 0; i < attr.count; i++) {
            v.fromBufferAttribute(attr as THREE.BufferAttribute, i)
              .applyMatrix4(m).applyMatrix4(B);
            if (v.y < lo2) lo2 = v.y;
            if (v.y > hi2) hi2 = v.y;
          }
        });
        return { lo: lo2, hi: hi2, span: hi2 - lo2 };
      };
      const uprightRange = vertexHeights(upright);
      const swungRange = vertexHeights(swung);
      const useUpright = uprightRange.span <= swungRange.span;
      const A = useUpright ? upright : swung;
      const range = useUpright ? uprightRange : swungRange;
      const upAxis = useUpright ? "earth-centred" : "glTF y-up";
      const sx = opts.frame.kx * opts.frame.scale
        / (METRES_PER_DEGREE_LON_EQ * Math.cos(g.lat * D2R));
      const sz = -opts.frame.scale / METRES_PER_DEGREE_LAT;
      const sy = opts.terrain.yFromMeters(1) - opts.terrain.yFromMeters(0);
      const S = new THREE.Matrix4().makeScale(sx, sy, sz);
      // The city model measures height from the ellipsoid and the elevation tiles measure
      // theirs from sea level; in Kyushu the two differ by about thirty-six metres. Each tile
      // is set down on the elevation surface under its own coordinates by subtracting the
      // lowest vertex it actually has, so no block floats and none is buried.
      const T = new THREE.Matrix4().makeTranslation(
        opts.frame.x(g.lon),
        opts.terrain.heightAtLonLat(g.lon, g.lat) - sy * range.lo,
        opts.frame.z(g.lat),
      );
      const M = new THREE.Matrix4().multiply(T).multiply(S).multiply(B).multiply(A);

      const holder = new THREE.Group();
      holder.matrixAutoUpdate = false;
      holder.matrix.copy(M);
      let vertices = 0;
      gltf.scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.material = material;
        mesh.frustumCulled = false;
        const attr = mesh.geometry.getAttribute("position");
        if (attr) vertices += attr.count;
        if (!mesh.geometry.getAttribute("normal")) mesh.geometry.computeVertexNormals();
      });
      holder.add(gltf.scene);
      group.add(holder);
      holder.updateMatrixWorld(true);

      lon0 += g.lon; lat0 += g.lat; placed++;
      west = Math.min(west, g.lon); east = Math.max(east, g.lon);
      south = Math.min(south, g.lat); north = Math.max(north, g.lat);
      totalBuildings += buildings;
      totalVertices += vertices;
      tiles.push({
        uri, ok: true, buildings, vertices,
        note: `placed at ${g.lon.toFixed(5)} east, ${g.lat.toFixed(5)} north,`
          + ` read as ${upAxis}; buildings span ${range.span.toFixed(1)} m of height`
          + ` (earth-centred reading ${uprightRange.span.toFixed(1)} m,`
          + ` y-up reading ${swungRange.span.toFixed(1)} m)`,
      });
    } catch (error) {
      const note = (error as Error).message;
      tiles.push({ uri, ok: false, buildings: 0, vertices: 0, note });
      console.warn(`rescueworld: the building tile ${uri} was skipped — ${note}`);
    }
  }
  draco.dispose();

  const lon = placed ? lon0 / placed : opts.frame.lonOf(0.5);
  const lat = placed ? lat0 / placed : opts.frame.latOf(0.5);
  const centre = new THREE.Vector3(
    opts.frame.x(lon), opts.terrain.heightAtLonLat(lon, lat), opts.frame.z(lat));

  // The box the placed buildings truly occupy, walked vertex by vertex. A box built from the
  // usual axis-aligned bounds would be three times too tall here, because the boxes inside the
  // tiles are aligned to the earth's own axes rather than to this world's vertical.
  group.updateMatrixWorld(true);
  const worldBox = new THREE.Box3();
  {
    const v = new THREE.Vector3();
    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const attr = mesh.geometry.getAttribute("position");
      if (!attr) return;
      for (let i = 0; i < attr.count; i++) {
        v.fromBufferAttribute(attr as THREE.BufferAttribute, i)
          .applyMatrix4(mesh.matrixWorld);
        worldBox.expandByPoint(v);
      }
    });
  }

  const spanM = placed
    ? Math.max((east - west) * METRES_PER_DEGREE_LON_EQ * Math.cos(lat * D2R),
      (north - south) * METRES_PER_DEGREE_LAT)
    : 0;

  if (placed && !worldBox.isEmpty()) {
    // the cut's own middle, taken from the geometry rather than from an average of centres
    worldBox.getCenter(centre);
    centre.y = worldBox.min.y;
  }

  return {
    group, tiles, buildings: totalBuildings, vertices: totalVertices,
    centre, spanM, lon, lat,
    box: {
      min: [worldBox.min.x, worldBox.min.y, worldBox.min.z],
      max: [worldBox.max.x, worldBox.max.y, worldBox.max.z],
    },
    setSelected(on) { material.uniforms.uGain.value = on ? 2.6 : 1.45; },
  };
}
