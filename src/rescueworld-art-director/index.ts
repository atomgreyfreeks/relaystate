/**
 * RESCUE WORLD — live art direction.
 *
 * The image grade is the same thirteen-control pipeline used by Halo Forge. This panel exposes
 * those numbers without putting them into replay state: a viewer may change the photograph,
 * never the recorded history. One additional scene colour, `burnColor`, controls the marks that
 * mean damage, a spent resource, or an observed loss. PASS/FAIL interface states deliberately do
 * not follow it: art direction may turn the simulated burn blue without teaching the viewer that
 * blue has suddenly become the warning colour. The caller owns applying the scene colour because
 * those marks live in several WebGL buffers.
 *
 * The exchange format is deliberately small, versioned JSON. Copy Settings gives the owner one
 * complete block to send back as an approved default; Paste Settings accepts only the keys this
 * module knows, so a typo or an older block cannot add arbitrary state to the page.
 */
import {
  LOOKS, type GradeParams, type Look, type PostState,
} from "../rescueworld/post";

export interface ArtDirectorOptions {
  post: PostState;
  applyLook(name: string): Look;
  burnColor?: string;
  onBurnColor(rgb: readonly [number, number, number], hex: string): void;
  onOpenChange?(open: boolean): void;
}

export interface ArtDirectionSettings {
  format: "rescue-world-art-direction";
  version: 1;
  look: string;
  burnColor: string;
  grade: GradeParams;
}

export interface ArtDirector {
  open(): void;
  close(): void;
  toggle(): void;
  isOpen(): boolean;
  settings(): ArtDirectionSettings;
  syncFromState(): void;
}

type GradeKey = keyof GradeParams;
interface SliderSpec {
  key: GradeKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

/** Exact ranges and increments from Halo Forge's Grade panel. */
const SLIDERS: readonly SliderSpec[] = [
  { key: "postStrength", label: "Grade mix", min: 0, max: 1, step: 0.01 },
  { key: "halation", label: "Halation", min: 0, max: 3, step: 0.01 },
  { key: "haloThreshold", label: "Glow threshold", min: 0, max: 1, step: 0.01 },
  { key: "haloSpread", label: "Glow spread", min: 0.2, max: 6, step: 0.05 },
  { key: "exposure", label: "Exposure", min: 0.3, max: 2.5, step: 0.01 },
  { key: "contrast", label: "Contrast", min: 0.4, max: 2.4, step: 0.01 },
  { key: "lift", label: "Black lift", min: -0.05, max: 0.15, step: 0.002 },
  { key: "gamma", label: "Gamma", min: 0.5, max: 2, step: 0.01 },
  { key: "saturation", label: "Saturation", min: 0, max: 2, step: 0.01 },
  { key: "grain", label: "Film grain", min: 0, max: 0.3, step: 0.002 },
  { key: "grainSize", label: "Grain size", min: 0.5, max: 6, step: 0.1 },
  { key: "vignette", label: "Vignette", min: 0, max: 1, step: 0.01 },
  { key: "split", label: "Colour split", min: 0, max: 4, step: 0.02 },
  { key: "scan", label: "Scanlines", min: 0, max: 1, step: 0.01 },
] as const;

const DEFAULT_BURN = "#1f2eff";
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const title = (name: string) => name === "rescue-default" ? "Rescue default"
  : LOOKS[name]?.label ?? "Custom";

function normalizeHex(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const short = /^#([0-9a-f]{3})$/i.exec(input.trim());
  if (short) return `#${[...short[1]].map((c) => c + c).join("")}`.toLowerCase();
  const full = /^#([0-9a-f]{6})$/i.exec(input.trim());
  return full ? `#${full[1].toLowerCase()}` : null;
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function rgbToHex(rgb: readonly [number, number, number]): string {
  return `#${rgb.map((v) => Math.round(clamp(v, 0, 1) * 255)
    .toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(rgb: readonly [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const light = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, light * 100];
  const sat = d / (1 - Math.abs(2 * light - 1));
  let hue = max === r ? ((g - b) / d) % 6
    : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hue = (hue * 60 + 360) % 360;
  return [hue, sat * 100, light * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s / 100, 0, 1), light = clamp(l / 100, 0, 1);
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = light - c / 2;
  const p: [number, number, number] = hue < 60 ? [c, x, 0]
    : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x]
      : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return [p[0] + m, p[1] + m, p[2] + m];
}

function installStyle() {
  if (document.getElementById("rwArtStyle")) return;
  const style = document.createElement("style");
  style.id = "rwArtStyle";
  style.textContent = `
#rwArt{position:fixed;z-index:40;left:18px;top:18px;bottom:18px;width:min(390px,calc(100vw - 36px));
  display:none;background:#050607;color:#edfaff;border:1px solid rgba(125,249,255,.42);
  box-shadow:0 24px 90px rgba(0,0,0,.82);font-family:"Helvetica Neue",Arial,sans-serif;
  pointer-events:auto;overflow:hidden}
#rwArt.on{display:flex;flex-direction:column}
#rwArt *{box-sizing:border-box}
#rwArtHead{flex:0 0 auto;display:flex;align-items:start;justify-content:space-between;gap:18px;
  padding:16px 16px 14px;border-bottom:1px solid rgba(255,255,255,.16)}
#rwArtHead b{display:block;font-size:12px;letter-spacing:.17em;text-transform:uppercase}
#rwArtHead span{display:block;margin-top:5px;color:rgba(237,250,255,.55);font-size:10px;line-height:1.4}
#rwArtClose{border:1px solid rgba(255,255,255,.3);background:transparent;color:#edfaff;padding:5px 8px;
  font:10px/1 "Helvetica Neue",Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
#rwArtBody{overflow:auto;padding:14px 16px 20px;scrollbar-color:rgba(125,249,255,.42) transparent}
.rwArtSection{margin:0 0 19px}
.rwArtKicker{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 9px;
  color:rgba(237,250,255,.54);font-size:8px;letter-spacing:.19em;text-transform:uppercase}
#rwArtLook{color:#7df9ff}
#rwArtPresets{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
.rwArtButton{min-height:28px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.025);
  color:rgba(237,250,255,.76);font:9px/1.15 "Helvetica Neue",Arial,sans-serif;letter-spacing:.08em;
  text-transform:uppercase;cursor:pointer;padding:5px}
.rwArtButton:hover,.rwArtButton.on{color:#7df9ff;border-color:rgba(125,249,255,.65);background:rgba(125,249,255,.06)}
.rwArtRow{display:grid;grid-template-columns:104px 1fr 48px;align-items:center;gap:9px;min-height:27px}
.rwArtRow label{font-size:10px;color:rgba(237,250,255,.72)}
.rwArtRow output{text-align:right;font:9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:rgba(237,250,255,.55)}
.rwArtRow input[type=range]{appearance:none;width:100%;height:2px;background:rgba(255,255,255,.18);outline:none}
.rwArtRow input[type=range]::-webkit-slider-thumb{appearance:none;width:9px;height:13px;border:1px solid #7df9ff;
  background:#050607;cursor:ew-resize}
#rwBurnRow{display:grid;grid-template-columns:46px 1fr;gap:11px;align-items:center;margin:0 0 8px}
#rwBurnColor{appearance:none;width:46px;height:38px;border:1px solid rgba(255,255,255,.3);padding:3px;background:#050607;cursor:pointer}
#rwBurnColor::-webkit-color-swatch-wrapper{padding:0}#rwBurnColor::-webkit-color-swatch{border:0}
#rwBurnHex{font:12px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--burn,#1f2eff)}
#rwBurnNote{font-size:9px;line-height:1.4;color:rgba(237,250,255,.45);margin-top:3px}
#rwArtExchange{display:block;width:100%;min-height:132px;resize:vertical;background:#000;color:rgba(237,250,255,.78);
  border:1px solid rgba(255,255,255,.18);padding:9px;font:9px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
#rwArtActions{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:7px}
#rwArtStatus{min-height:16px;margin-top:7px;color:rgba(125,249,255,.74);font-size:9px;line-height:1.4}
/* Scene burn follows the art director. PASS/FAIL is information, not photography, so it keeps a
   stable warning colour even when Randy turns the damage field blue. */
.ember,.pl.hot b,#caption .k{color:var(--burn,#1f2eff)!important}
#caption{border-color:rgba(var(--burn-rgb,31,46,255),.42)!important}
.tbadge.fail,.tmessage,.rstamp.broke{color:#ff9d5c!important}
.tbadge.fail{border-color:rgba(255,157,92,.52)!important}
.tmessage{border-left-color:rgba(255,157,92,.46)!important}
.rverdict.failed{border-left-color:#ff9d5c!important}
.beat.loss{border-top-color:#ff9d5c!important}
#internal{border-bottom-color:rgba(var(--burn-rgb,31,46,255),.42)!important}
@media(max-width:620px){#rwArt{inset:8px;width:auto}.rwArtRow{grid-template-columns:96px 1fr 44px}}
`;
  document.head.append(style);
}

function button(label: string): HTMLButtonElement {
  const out = document.createElement("button");
  out.type = "button";
  out.className = "rwArtButton";
  out.textContent = label;
  return out;
}

/** Mount once, after the renderer and camera exist. */
export function mountArtDirector(options: ArtDirectorOptions): ArtDirector {
  installStyle();
  const initialGrade = { ...options.post.params };
  const initialLook = options.post.look;
  let activeLook: string | null = "rescue-default";
  let burnHex = normalizeHex(options.burnColor) ?? DEFAULT_BURN;
  let opened = false;

  const panel = document.createElement("aside");
  panel.id = "rwArt";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Rescue World art direction");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `<header id="rwArtHead"><div><b>Art direction</b><span>Live picture controls · G closes</span></div></header><div id="rwArtBody"></div>`;
  const head = panel.querySelector<HTMLElement>("#rwArtHead")!;
  const closeButton = document.createElement("button");
  closeButton.id = "rwArtClose";
  closeButton.type = "button";
  closeButton.textContent = "close · esc";
  head.append(closeButton);
  const body = panel.querySelector<HTMLElement>("#rwArtBody")!;
  document.body.append(panel);

  const presetSection = document.createElement("section");
  presetSection.className = "rwArtSection";
  presetSection.innerHTML = `<div class="rwArtKicker"><span>Halo Forge looks</span><b id="rwArtLook">${title(options.post.look)}</b></div><div id="rwArtPresets"></div>`;
  body.append(presetSection);
  const lookLabel = presetSection.querySelector<HTMLElement>("#rwArtLook")!;
  const presets = presetSection.querySelector<HTMLElement>("#rwArtPresets")!;

  const sliderSection = document.createElement("section");
  sliderSection.className = "rwArtSection";
  sliderSection.innerHTML = `<div class="rwArtKicker"><span>Picture and post-processing</span><span>live</span></div>`;
  body.append(sliderSection);
  const rangeInputs = new Map<GradeKey, HTMLInputElement>();
  const rangeOutputs = new Map<GradeKey, HTMLOutputElement>();

  const colorSection = document.createElement("section");
  colorSection.className = "rwArtSection";
  colorSection.innerHTML = `<div class="rwArtKicker"><span>Burn / damage colour</span><span>scene marks</span></div>
    <div id="rwBurnRow"><input id="rwBurnColor" type="color" aria-label="Burn colour"><div><div id="rwBurnHex"></div><div id="rwBurnNote">Damage, spent resources and ground residue. Rule failures stay orange.</div></div></div>`;
  body.append(colorSection);
  const colorInput = colorSection.querySelector<HTMLInputElement>("#rwBurnColor")!;
  const colorText = colorSection.querySelector<HTMLElement>("#rwBurnHex")!;
  const colorRanges: { label: string; min: number; max: number; step: number }[] = [
    { label: "Hue", min: 0, max: 360, step: 1 },
    { label: "Saturation", min: 0, max: 100, step: 1 },
    { label: "Lightness", min: 0, max: 100, step: 1 },
  ];
  const hslInputs: HTMLInputElement[] = [];
  const hslOutputs: HTMLOutputElement[] = [];

  const exchangeSection = document.createElement("section");
  exchangeSection.className = "rwArtSection";
  exchangeSection.innerHTML = `<div class="rwArtKicker"><span>Settings exchange</span><span>version 1 JSON</span></div>`;
  const exchange = document.createElement("textarea");
  exchange.id = "rwArtExchange";
  exchange.spellcheck = false;
  exchange.setAttribute("aria-label", "Art direction settings JSON");
  exchangeSection.append(exchange);
  const actions = document.createElement("div");
  actions.id = "rwArtActions";
  const copyButton = button("Copy settings");
  const pasteButton = button("Apply pasted JSON");
  const resetButton = button("Reset session");
  const selectButton = button("Select JSON");
  actions.append(copyButton, pasteButton, resetButton, selectButton);
  exchangeSection.append(actions);
  const status = document.createElement("div");
  status.id = "rwArtStatus";
  status.setAttribute("role", "status");
  exchangeSection.append(status);
  body.append(exchangeSection);

  function applyBurn(hex: string) {
    const valid = normalizeHex(hex);
    if (!valid) return false;
    burnHex = valid;
    const rgb = hexToRgb(valid);
    colorInput.value = valid;
    colorText.textContent = valid.toUpperCase();
    document.documentElement.style.setProperty("--burn", valid);
    document.documentElement.style.setProperty("--burn-rgb", rgb.map((v) => Math.round(v * 255)).join(","));
    const hsl = rgbToHsl(rgb);
    hslInputs.forEach((input, i) => { input.value = String(hsl[i]); });
    hslOutputs.forEach((out, i) => { out.value = `${Math.round(hsl[i])}${i ? "%" : "°"}`; });
    options.onBurnColor(rgb, valid);
    return true;
  }

  function refreshGrade() {
    for (const spec of SLIDERS) {
      const value = options.post.params[spec.key];
      const input = rangeInputs.get(spec.key);
      const output = rangeOutputs.get(spec.key);
      if (input) input.value = String(value);
      if (output) output.value = value.toFixed(spec.step < 0.01 ? 3 : spec.step < 0.1 ? 2 : 1);
    }
    lookLabel.textContent = activeLook ? title(activeLook) : "Custom";
    presets.querySelectorAll<HTMLButtonElement>("button").forEach((b) => {
      b.classList.toggle("on", Boolean(activeLook) && b.dataset.look === activeLook);
    });
  }

  function readSettings(): ArtDirectionSettings {
    return {
      format: "rescue-world-art-direction",
      version: 1,
      look: activeLook ?? "custom",
      burnColor: burnHex,
      grade: { ...options.post.params },
    };
  }

  function fillExchange() { exchange.value = JSON.stringify(readSettings(), null, 2); }
  function say(message: string) { status.textContent = message; }

  const rescueDefault = button("Rescue default");
  rescueDefault.dataset.look = "rescue-default";
  rescueDefault.addEventListener("click", () => {
    options.post.look = initialLook;
    activeLook = "rescue-default";
    Object.assign(options.post.params, initialGrade);
    refreshGrade();
    fillExchange();
    say("Rescue World's protected opening grade is restored.");
  });
  presets.append(rescueDefault);

  for (const [name, look] of Object.entries(LOOKS)) {
    const b = button(look.label);
    b.dataset.look = name;
    b.addEventListener("click", () => {
      options.applyLook(name);
      activeLook = name;
      refreshGrade();
      fillExchange();
      say(`${look.label} applied. Every slider remains live.`);
    });
    presets.append(b);
  }

  for (const spec of SLIDERS) {
    const row = document.createElement("div");
    row.className = "rwArtRow";
    const id = `rwArt-${spec.key}`;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = spec.label;
    const input = document.createElement("input");
    input.id = id;
    input.type = "range";
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    const output = document.createElement("output");
    output.htmlFor = id;
    input.addEventListener("input", () => {
      options.post.params[spec.key] = clamp(Number(input.value), spec.min, spec.max);
      activeLook = null;
      refreshGrade();
    });
    input.addEventListener("change", fillExchange);
    row.append(label, input, output);
    sliderSection.append(row);
    rangeInputs.set(spec.key, input);
    rangeOutputs.set(spec.key, output);
  }

  colorRanges.forEach((spec, index) => {
    const row = document.createElement("div");
    row.className = "rwArtRow";
    const id = `rwBurn-${spec.label.toLowerCase()}`;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = spec.label;
    const input = document.createElement("input");
    input.id = id;
    input.type = "range";
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    const output = document.createElement("output");
    output.htmlFor = id;
    input.addEventListener("input", () => {
      const values = hslInputs.map((item) => Number(item.value));
      values[index] = Number(input.value);
      applyBurn(rgbToHex(hslToRgb(values[0], values[1], values[2])));
    });
    input.addEventListener("change", fillExchange);
    row.append(label, input, output);
    colorSection.append(row);
    hslInputs.push(input);
    hslOutputs.push(output);
  });

  colorInput.addEventListener("input", () => applyBurn(colorInput.value));
  colorInput.addEventListener("change", fillExchange);

  function applyObject(raw: unknown): number {
    if (!raw || typeof raw !== "object") return 0;
    const value = raw as Record<string, unknown>;
    const grade = value.grade && typeof value.grade === "object"
      ? value.grade as Record<string, unknown> : value;
    let count = 0;
    const requestedLook = typeof value.look === "string" ? value.look : "";
    const named = LOOKS[requestedLook] ? requestedLook : null;
    if (requestedLook === "rescue-default") {
      options.post.look = initialLook;
      Object.assign(options.post.params, initialGrade);
      activeLook = "rescue-default";
      count++;
    } else if (named) {
      options.applyLook(named);
      activeLook = named;
      count++;
    }
    for (const spec of SLIDERS) {
      const next = grade[spec.key];
      if (typeof next !== "number" || !Number.isFinite(next)) continue;
      options.post.params[spec.key] = clamp(next, spec.min, spec.max);
      count++;
    }
    const nextBurn = normalizeHex(value.burnColor);
    if (nextBurn && applyBurn(nextBurn)) count++;
    if (!named && requestedLook !== "rescue-default") activeLook = null;
    refreshGrade();
    fillExchange();
    return count;
  }

  copyButton.addEventListener("click", async () => {
    fillExchange();
    exchange.select();
    try {
      await navigator.clipboard.writeText(exchange.value);
      say("Copied. Send this JSON block back as the defaults you want.");
    } catch {
      say("Clipboard permission was denied. The JSON is selected for manual copy.");
    }
  });
  pasteButton.addEventListener("click", () => {
    try {
      const count = applyObject(JSON.parse(exchange.value));
      say(count ? `Applied ${count} known setting${count === 1 ? "" : "s"}.` : "No known settings found.");
    } catch {
      say("That is not valid JSON. Nothing changed.");
    }
  });
  resetButton.addEventListener("click", () => {
    options.post.look = initialLook;
    activeLook = "rescue-default";
    Object.assign(options.post.params, initialGrade);
    applyBurn(normalizeHex(options.burnColor) ?? DEFAULT_BURN);
    refreshGrade();
    fillExchange();
    say("This session is back at the Rescue World defaults.");
  });
  selectButton.addEventListener("click", () => {
    fillExchange();
    exchange.focus();
    exchange.select();
    say("The complete settings block is selected.");
  });

  function setOpen(next: boolean) {
    if (opened === next) return;
    opened = next;
    panel.classList.toggle("on", next);
    panel.setAttribute("aria-hidden", String(!next));
    options.onOpenChange?.(next);
    if (next) {
      refreshGrade();
      fillExchange();
      closeButton.focus({ preventScroll: true });
    }
  }

  closeButton.addEventListener("click", () => setOpen(false));
  addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!opened && key === "g" && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(true);
      return;
    }
    if (!opened) return;
    if (event.key === "Escape" || key === "g") setOpen(false);
    // The panel owns the keyboard while it is open. This prevents typing JSON or using arrow
    // keys on a slider from moving the camera underneath it.
    event.stopImmediatePropagation();
  }, true);

  refreshGrade();
  applyBurn(burnHex);
  fillExchange();

  const api: ArtDirector = {
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!opened),
    isOpen: () => opened,
    settings: readSettings,
    syncFromState() { activeLook = options.post.look; refreshGrade(); fillExchange(); },
  };
  (window as unknown as { __RESCUE_WORLD_ART__?: ArtDirector }).__RESCUE_WORLD_ART__ = api;
  return api;
}
