/**
 * RESCUE WORLD — the real ground.
 *
 * The landscape is no longer invented. It is the Geospatial Information Authority of Japan's
 * published elevation tiles, cut to one rectangle around Kumamoto Prefecture and delivered
 * beside the baked run as `gsi-dem10b-z11-kumamoto.png` with a metadata file next to it. This
 * module reads that image, decodes it with the exact rule the metadata states, and turns it
 * into the two things the page needs: the height of the ground at any coordinate, and one
 * packed texture the contour shader reads.
 *
 * The decode rule is quoted from the delivered metadata and is not guessed:
 *   u = 65536*R + 256*G + B
 *   u  < 8388608  ->  elevation in metres = u * 0.01
 *   u == 8388608  ->  no data (the sea, and ground outside the survey)
 *   u  > 8388608  ->  elevation in metres = (u - 16777216) * 0.01
 *
 * The image's own `pixel_edge_bounds_wgs84` gives the longitude and latitude of the outer
 * edges of its corner pixels, and every coordinate in the run is placed through those bounds,
 * so a report recorded at 130.664 east, 32.802 north lands on the ground that image says is
 * there. The world's ground rectangle IS that image's footprint: nothing is drawn past the
 * edge of the data.
 *
 * The packed texture keeps one channel for each of the four things the ground shader reads:
 *   red   — elevation, stretched to fill the channel
 *   green — ground a team can cross; the real road restrictions burn it down along their lines
 *   blue  — people; a soft glow at the designated shelters and at the exercise's sites
 *   alpha — 1 where the elevation tiles carry data, 0 where they record none
 *
 * Determinism: no random source and no clock. The same image and the same layers pack the same
 * bytes, and `hash` is the checksum of those bytes, so two loads that disagree are visible.
 */
import * as THREE from "three";

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** the longest side of the ground rectangle, in world units */
export const GROUND = 3.90;
/** world units from the lowest ground in the cut to the highest */
export const HGT = 0.46;
/**
 * Subdivisions of the ground mesh along its longer side.
 *
 * The delivered elevation image is 612 by 917 picture elements and its longer side is the
 * north-south one, so 916 puts one mesh quad on each recorded elevation along that side and
 * the drawn ground carries every height the survey published. At 224 the mesh sampled about
 * one height in four and the hills came out as visible facets.
 */
const SEG_LONG = 916;

/** the elevation image's own description of itself, as the bake delivered it */
export interface DemMeta {
  pixel_edge_bounds_wgs84: [[number, number], [number, number]];
  output_pixels: [number, number];
  approximate_ground_sample_m_at_latitude_32_6?: number;
  encoding?: { decode?: string; nodata_rgb?: [number, number, number] };
  source?: { provider?: string; attribution?: string; tile_template?: string };
  processing?: { frozen_on?: string };
  xyz_zoom?: number;
  xyz_tiles?: unknown[];
}

/**
 * The map projection this world uses, in one object. Longitude degrees are shorter than
 * latitude degrees this far north, so they are scaled by the cosine of the middle latitude
 * before anything is drawn; every other file asks this object rather than repeating that.
 */
export interface Frame {
  west: number; south: number; east: number; north: number;
  kx: number; scale: number;        // world units per degree of latitude
  mapW: number; mapD: number;       // the ground rectangle, in world units
  x(lon: number): number;
  z(lat: number): number;
  u(lon: number): number;           // 0 at the west edge, 1 at the east edge
  v(lat: number): number;           // 0 at the south edge, 1 at the north edge
  lonOf(u: number): number;
  latOf(v: number): number;
  inside(lon: number, lat: number): boolean;
}

export function makeFrame(bounds: [[number, number], [number, number]]): Frame {
  const west = bounds[0][0], south = bounds[0][1], east = bounds[1][0], north = bounds[1][1];
  const kx = Math.cos(((south + north) / 2) * Math.PI / 180);
  const spanLon = Math.max(1e-9, (east - west) * kx), spanLat = Math.max(1e-9, north - south);
  const scale = GROUND / Math.max(spanLon, spanLat);
  const mapW = spanLon * scale, mapD = spanLat * scale;
  return {
    west, south, east, north, kx, scale, mapW, mapD,
    x: (lon) => (lon - (west + east) / 2) * kx * scale,
    z: (lat) => -(lat - (south + north) / 2) * scale,
    u: (lon) => (lon - west) / (east - west),
    v: (lat) => (lat - south) / (north - south),
    lonOf: (u) => west + u * (east - west),
    latOf: (v) => south + v * (north - south),
    inside: (lon, lat) => lon >= west && lon <= east && lat >= south && lat <= north,
  };
}

/** one soft radial deposit into a channel field, in texel coordinates */
function stampField(f: Float32Array, w: number, h: number,
  cx: number, cy: number, amt: number, rad: number) {
  const r = Math.ceil(rad), s2 = 2 * (rad * 0.55) * (rad * 0.55);
  const xa = Math.max(0, Math.floor(cx - r)), xb = Math.min(w - 1, Math.ceil(cx + r));
  const ya = Math.max(0, Math.floor(cy - r)), yb = Math.min(h - 1, Math.ceil(cy + r));
  for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
    const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
    if (d2 > r * r) continue;
    f[y * w + x] += amt * Math.exp(-d2 / s2);
  }
}

/** the world's ground: the elevation image, decoded, packed, and standing in three.js */
export interface Terrain {
  frame: Frame;
  tex: THREE.DataTexture;
  geo: THREE.BufferGeometry;
  hash: string;
  demW: number; demH: number;
  minM: number; maxM: number; meanM: number; noData: number;
  /** the middle of the ground that actually has data, so the home view frames land not sea */
  landCentre: { u: number; v: number };
  /** world height for a height in metres above sea level */
  yFromMeters(m: number): number;
  /** metres above sea level under one unit-rectangle point */
  metersAt(u: number, v: number): number;
  /** world height under one unit-rectangle point */
  heightAt(u: number, v: number): number;
  heightAtLonLat(lon: number, lat: number): number;
  /**
   * The share of ground around one unit-rectangle point that the elevation tiles record,
   * between none and all. Anything choosing a camera destination asks this first, so the view
   * is never sent to sea or to ground outside the survey, both of which are drawn dark.
   */
  landAround(u: number, v: number, radius?: number): number;
  /** a small greyscale picture of the same ground, for the mini-map */
  thumb: { w: number; h: number; data: Uint8ClampedArray };
}

export interface TerrainLayers {
  /** every road restriction, as lines of [longitude, latitude] */
  roads: [number, number][][];
  /** the designated shelters */
  shelters: [number, number][];
  /** the exercise's sites */
  sites: [number, number][];
}

/**
 * Read the elevation image and build the ground from it.
 *
 * The image is drawn once into a canvas with colour management switched off, so the bytes
 * that come back are the bytes the Geospatial Information Authority published; a browser that
 * silently converted them would move every hill.
 */
export async function loadTerrain(demUrl: string, meta: DemMeta,
  layers: TerrainLayers): Promise<Terrain> {
  const blob = await (await fetch(demUrl)).blob();
  const bmp = await createImageBitmap(blob, {
    colorSpaceConversion: "none", premultiplyAlpha: "none",
  });
  const W = bmp.width, H = bmp.height;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const px = ctx.getImageData(0, 0, W, H).data;

  // ---- decode, by the metadata's own rule
  const elev = new Float32Array(W * H);      // metres above sea level, 0 where there is none
  const have = new Uint8Array(W * H);        // 1 where the tiles carry data
  let minM = Infinity, maxM = -Infinity, sum = 0, seen = 0, noData = 0;
  let landX = 0, landY = 0;
  for (let i = 0, j = 0; i < W * H; i++, j += 4) {
    const u = 65536 * px[j] + 256 * px[j + 1] + px[j + 2];
    if (u === 8388608) { noData++; continue; }
    const m = u < 8388608 ? u * 0.01 : (u - 16777216) * 0.01;
    elev[i] = m; have[i] = 1;
    if (m < minM) minM = m;
    if (m > maxM) maxM = m;
    sum += m; seen++;
    landX += i % W; landY += (i / W) | 0;
  }
  if (!seen) throw new Error("the elevation image carries no data at all");
  const landCentre = { u: (landX / seen + 0.5) / W, v: 1 - (landY / seen + 0.5) / H };
  const meanM = sum / seen;
  const spanM = Math.max(1, maxM - minM);

  const frame = makeFrame(meta.pixel_edge_bounds_wgs84);

  // ---- the three channels the contour shader reads, plus the data mask
  const block = new Float32Array(W * H);     // how impassable the ground is
  const pop = new Float32Array(W * H);       // how many people are there

  // Row 0 of the image is the northernmost row; the texture's row 0 is the southern edge,
  // so every write flips the row. Keeping that in one place is the whole of the mapping.
  const texRow = (imgRow: number) => H - 1 - imgRow;
  const pixOf = (lon: number, lat: number) => ({
    x: frame.u(lon) * W - 0.5,
    y: (1 - frame.v(lat)) * H - 0.5,      // in image rows, north first
  });

  // the road restrictions burn a narrow impassable band along their own lines
  for (const line of layers.roads) {
    for (let i = 1; i < line.length; i++) {
      const a = pixOf(line[i - 1][0], line[i - 1][1]);
      const b = pixOf(line[i][0], line[i][1]);
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = lerp(a.x, b.x, t), y = lerp(a.y, b.y, t);
        if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
        stampField(block, W, H, x, y, 0.55, 1.9);
      }
    }
  }
  // the crowd's own light: a wide low halo at every designated shelter, a brighter one at
  // each of the exercise's sites, because those are the places the reports are about
  for (const [lon, lat] of layers.shelters) {
    const p = pixOf(lon, lat);
    stampField(pop, W, H, p.x, p.y, 0.30, 7);
  }
  for (const [lon, lat] of layers.sites) {
    const p = pixOf(lon, lat);
    stampField(pop, W, H, p.x, p.y, 0.34, 11);
  }

  /**
   * The four channels keep their roles and their order. What changes is how many values each
   * one can hold: they are written as half-precision floating point rather than as one of 256
   * steps. The contour shader reads the elevation channel directly, and at eight bits one step
   * of that channel is five metres of ground — about a twelfth of a contour interval — so every
   * contour line climbed the hill in visible stairs. Half precision costs one extra byte per
   * texel and the stairs are gone.
   */
  const data = new Uint16Array(W * H * 4);
  const half = THREE.DataUtils.toHalfFloat;
  const ONE = half(1);
  for (let y = 0; y < H; y++) {
    const dst = texRow(y) * W;
    for (let x = 0; x < W; x++) {
      const s = y * W + x, d = (dst + x) * 4;
      const e = have[s] ? 0.04 + 0.96 * (elev[s] - minM) / spanM : 0;
      data[d] = half(clamp(e));
      data[d + 1] = half(clamp(1 - block[s]));
      data[d + 2] = half(clamp(pop[s]));
      data[d + 3] = have[s] ? ONE : 0;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  const bytes = new Uint8Array(data.buffer);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 16777619) >>> 0;
  }
  const hash = h.toString(16).padStart(8, "0");

  // ---- reading the ground back
  const yFromMeters = (m: number) => HGT * (0.04 + 0.96 * (m - minM) / spanM);
  /** bilinear, in image rows, so the mesh and the shader agree about where a hill is */
  function metersAt(u: number, v: number) {
    const x = clamp(u) * W - 0.5, y = (1 - clamp(v)) * H - 0.5;
    const x0 = Math.min(W - 1, Math.max(0, Math.floor(x)));
    const y0 = Math.min(H - 1, Math.max(0, Math.floor(y)));
    const x1 = Math.min(W - 1, x0 + 1), y1 = Math.min(H - 1, y0 + 1);
    const fx = clamp(x - x0), fy = clamp(y - y0);
    const a = elev[y0 * W + x0], b = elev[y0 * W + x1];
    const c = elev[y1 * W + x0], d = elev[y1 * W + x1];
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
  }
  const heightAt = (u: number, v: number) => yFromMeters(metersAt(u, v));
  const heightAtLonLat = (lon: number, lat: number) => heightAt(frame.u(lon), frame.v(lat));

  /**
   * How much of the ground around one point the elevation tiles actually record. A third of
   * this cut is sea and some of it lies outside the survey, and both are drawn dark. A camera
   * aimed at such a place shows a black frame with the instruments still running, so anything
   * choosing a camera destination asks this first.
   *
   * `radius` is a fraction of the whole cut in each direction. The answer is the share of the
   * sampled picture elements that carry an elevation, between none and all.
   */
  function landAround(u: number, v: number, radius = 0.02): number {
    const STEPS = 4;                       // 9 by 9 samples, which is cheap and stable
    let found = 0, total = 0;
    for (let sy = -STEPS; sy <= STEPS; sy++) {
      for (let sx = -STEPS; sx <= STEPS; sx++) {
        const su = clamp(u + radius * sx / STEPS);
        const sv = clamp(v + radius * sy / STEPS);
        const x = Math.min(W - 1, Math.max(0, Math.round(su * W - 0.5)));
        const y = Math.min(H - 1, Math.max(0, Math.round((1 - sv) * H - 0.5)));
        total++;
        if (have[y * W + x]) found++;
      }
    }
    return total === 0 ? 0 : found / total;
  }

  // ---- the mesh, pushed up on the processor so the ground a camera stands on and the ground
  //      the shader shades are the same numbers
  const long = Math.max(frame.mapW, frame.mapD);
  const segX = Math.max(24, Math.round(SEG_LONG * frame.mapW / long));
  const segZ = Math.max(24, Math.round(SEG_LONG * frame.mapD / long));
  const geo = new THREE.PlaneGeometry(frame.mapW, frame.mapD, segX, segZ);
  {
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const uvs = geo.getAttribute("uv") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, heightAt(uvs.getX(i), uvs.getY(i)));
    pos.needsUpdate = true;
    // The ground shader lights nothing by a surface normal — it reads the packed texture and
    // nothing else — so the normal attribute is dropped rather than computed. At this density
    // it would cost about seven megabytes of memory and change no pixel on screen.
    geo.deleteAttribute("normal");
    geo.computeBoundingSphere();
  }

  // ---- the same ground, small, for the mini-map in the corner
  const TW = 132, TH = Math.max(16, Math.round(TW * H / W));
  const thumbData = new Uint8ClampedArray(TW * TH * 4);
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    const u = (x + 0.5) / TW, v = 1 - (y + 0.5) / TH;
    const m = metersAt(u, v);
    const t = clamp((m - minM) / spanM);
    // the mini-map is chrome at the frame edge and must never compete with the world, so it
    // is drawn quieter than the ground it stands for, and only its relief is kept
    const shade = (0.07 + Math.pow(t, 1.6) * 0.66) * 2.05;
    const j = (y * TW + x) * 4;
    thumbData[j] = 0.17 * shade * 255;
    thumbData[j + 1] = 0.42 * shade * 255;
    thumbData[j + 2] = 0.55 * shade * 255;
    thumbData[j + 3] = 255;
  }

  return {
    frame, tex, geo, hash, demW: W, demH: H,
    minM, maxM, meanM, noData, landCentre,
    yFromMeters, metersAt, heightAt, heightAtLonLat, landAround,
    thumb: { w: TW, h: TH, data: thumbData },
  };
}
