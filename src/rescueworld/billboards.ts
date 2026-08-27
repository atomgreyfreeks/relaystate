/**
 * Rescue World — story billboards.
 *
 * As the scenario plays, a floating card hangs above the place in the world that is being
 * talked about. The card carries a short plain-English description of what happened there and
 * what the desk decided. A leader line runs from the centre of the place straight up a set
 * distance, then bends forty-five degrees over to the nearest corner of the card, the way a
 * trace runs on a circuit board: one straight run, one diagonal, a small square pad at the
 * point it starts from.
 *
 * The card opens with the house gesture. Four corner brackets start condensed together at the
 * middle of the card in a crosshair, spin, and ease out to its corners; only then does the
 * writing arrive. Closing reverses, faster. That is the same reveal `app/rescueworld.html`
 * gives the report cards, the decision rail and the selection panel, and this module carries
 * its own copy of the rules so it also works on a page that does not define them.
 *
 * This module writes no sentences of its own. Every word on a card is passed in by the caller
 * and comes from `docs/rescueworld/theater-copy.md` — round headlines, the worked cards of the
 * decision rail, and the consequence captions.
 *
 * It renders as positioned HTML and one SVG overlay above the canvas, the way the existing
 * floating labels in `main.ts` do. It imports no three.js: a world point is any object with
 * `x`, `y` and `z`, which a `THREE.Vector3` already is.
 *
 * The reveals run on real elapsed time since the interaction, not on the playback tick, so they
 * touch nothing in the replay. Pausing freezes the cards where they stand: `tick` stops taking
 * new screen positions until playback resumes.
 *
 * Movement is transform and opacity only, and the layout pass allocates nothing per frame
 * beyond the arrays it reuses.
 */

import { C, TYPE } from "../design/system";

// ---------------------------------------------------------------- what the caller passes in

/** Any point in the world. A `THREE.Vector3` satisfies this without being named. */
export interface BillboardWorldPoint {
  x: number;
  y: number;
  z: number;
}

/** One moment in the story, and the words the copy deck writes for it. */
export interface BillboardBeat {
  /** stable identity — showing the same id twice rewrites the card instead of opening a second */
  id: string;
  /** the place in the world the card is about; the leader line starts at its centre on screen */
  worldPos: BillboardWorldPoint;
  /** the round or place name, set in the house label voice */
  title?: string;
  /** what happened and what was decided, in one or two complete sentences */
  sentence: string;
  /** the quieter second line, if the copy deck writes one */
  detail?: string;
  /** clicking the card calls this with the beat's id */
  onClick?: (id: string) => void;
}

/** Where a world point landed on screen this frame, as the caller's own projector measured it. */
export interface BillboardScreenPoint {
  id: string;
  x: number;
  y: number;
  /** false when the point is behind the camera; the card and its leader are held back */
  infront?: boolean;
}

/** The caller's world-to-screen projection, used when `tick` is called without positions. */
export type BillboardProjector = (
  world: BillboardWorldPoint,
) => { x: number; y: number; infront: boolean };

/** A region of the screen a card must stay clear of — the frame-edge panels. */
export interface BillboardRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BillboardOptions {
  /** how far straight up the leader runs before it bends, in pixels */
  rise?: number;
  /** how far the diagonal runs at rest; the collision pass only ever lengthens it */
  run?: number;
  /** each nudge along the diagonal, in pixels */
  runStep?: number;
  /** the longest diagonal the collision pass will reach for */
  runMax?: number;
  /** clear space demanded between two cards */
  gap?: number;
  /** how close a card may come to the edge of the container */
  margin?: number;
  /** the card's fixed width in pixels; its height follows from the words */
  width?: number;
  /** how many cards may stand at once; the oldest retires when a further one opens */
  maxVisible?: number;
}

export interface Billboards {
  /** open a card for this beat, retiring the oldest if the board is full */
  show(beat: BillboardBeat): void;
  /** close one card with the reverse reveal */
  hide(id: string): void;
  /**
   * Lay the standing cards out for this frame. Pass the screen positions the caller's own
   * projector measured, or pass nothing and the projector handed to `createBillboards` is used.
   */
  tick(screen?: readonly BillboardScreenPoint[] | null): void;
  /** the frame-edge panels the cards must stay clear of */
  setAvoid(rects: readonly BillboardRect[]): void;
  /** while paused the cards hold the last place they were laid out */
  setPaused(paused: boolean): void;
  /** the ids standing right now, oldest first */
  visible(): string[];
  /** close everything at once, without the reveal */
  clear(): void;
  /** take the whole board off the page */
  destroy(): void;
}

// ---------------------------------------------------------------- the house reveal, in numbers

/**
 * These match `app/rescueworld.html`. The brackets travel for 440 ms and the writing arrives at
 * 300 ms; closing takes 190 ms, after which the card leaves the page.
 */
const OPEN_READY_MS = 300;
const CLOSE_MS = 190;
/** how far inside the card's corner a bracket comes to rest, matching CORNER_INSET in main.ts */
const CORNER_INSET = 7;

const DEFAULTS: Required<BillboardOptions> = {
  rise: 46,
  run: 34,
  runStep: 16,
  runMax: 168,
  gap: 10,
  margin: 12,
  width: 236,
  maxVisible: 3,
};

// ---------------------------------------------------------------- the stylesheet

const STYLE_ID = "rwbb-style";

/**
 * The card's own rules. `.rv` and `.rvbody` carry the same names and the same numbers the page
 * already gives every container that opens, so on `rescueworld.html` these simply agree with
 * what is there, and on a bare page they stand alone.
 */
const CSS = `
.rwbb-root{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:6}
.rwbb-leads{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;
  overflow:visible}
.rwbb-lead{opacity:0;transition:opacity .30s ease}
.rwbb-lead.on{opacity:1}
.rwbb-lead.off{opacity:0;transition:opacity .14s ease}
/* Two strokes on the same path. The wide black one is laid down first so the thin bright one
   has a dark edge to sit against; without it the line disappears wherever it crosses lit
   ground, which over a burning epicentre is most of its length. */
.rwbb-lead path{fill:none}
.rwbb-lead path.edge{stroke:#000;stroke-opacity:.72;stroke-width:3.5;stroke-linejoin:round}
.rwbb-lead path.line{stroke:${C.bone};stroke-opacity:.95;stroke-width:1.4;
  stroke-linejoin:round}
.rwbb-lead rect{fill:${C.bone};fill-opacity:.95;stroke:#000;stroke-opacity:.72;
  stroke-width:1.5}
.rwbb{position:absolute;left:0;top:0;box-sizing:border-box;
  background:rgba(0,0,0,.62);border:1px solid ${C.hair};padding:8px 11px 10px;
  font-family:${TYPE.family};color:${C.bone};pointer-events:auto;cursor:pointer;
  display:none;will-change:transform}
.rwbb.on{display:block}
.rwbb.off{opacity:0;pointer-events:none}
.rwbb:hover{background:rgba(255,255,255,.09)}
.rwbb .rv{position:absolute;inset:0;pointer-events:none;z-index:3}
.rwbb .rv i{position:absolute;width:6px;height:6px;border:0 solid rgba(125,249,255,.92);
  opacity:0;transform:translate(var(--dx,0),var(--dy,0)) rotate(-135deg) scale(.55)}
.rwbb .rv i.tl{left:-1px;top:-1px;border-left-width:1px;border-top-width:1px}
.rwbb .rv i.tr{right:-1px;top:-1px;border-right-width:1px;border-top-width:1px}
.rwbb .rv i.bl{left:-1px;bottom:-1px;border-left-width:1px;border-bottom-width:1px}
.rwbb .rv i.br{right:-1px;bottom:-1px;border-right-width:1px;border-bottom-width:1px}
.rwbb.opening>.rv i{opacity:1;transform:translate(0,0) rotate(0deg) scale(1);
  transition:transform .44s cubic-bezier(.16,1,.3,1),opacity .20s ease}
.rwbb.closing>.rv i{opacity:0;transition:transform .18s cubic-bezier(.65,0,.35,1),
  opacity .15s ease}
.rwbb .rvbody{opacity:0;transform:translateY(5px);
  transition:opacity .26s ease,transform .26s cubic-bezier(.16,1,.3,1)}
.rwbb.ready>.rvbody{opacity:1;transform:none}
.rwbb.closing>.rvbody{opacity:0;transition:opacity .12s ease}
.rwbb-title{font-size:7.5px;letter-spacing:${TYPE.tracking};text-transform:uppercase;
  opacity:.52;margin:0 0 5px}
.rwbb-sentence{font-size:10.5px;line-height:1.42;margin:0}
.rwbb-detail{font-size:9px;line-height:1.45;opacity:.46;margin:5px 0 0}
`;

function installStyle(doc: Document) {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.append(style);
}

// ---------------------------------------------------------------- one standing card

const SVG_NS = "http://www.w3.org/2000/svg";

interface Card {
  id: string;
  box: HTMLElement;
  body: HTMLElement;
  lead: SVGGElement;
  /** the wide black stroke under the leader, so it reads over lit ground */
  edge: SVGPathElement;
  path: SVGPathElement;
  pad: SVGRectElement;
  beat: BillboardBeat;
  /** the card's measured size, taken once at the moment it opens */
  w: number;
  h: number;
  /** where the world point landed this frame */
  sx: number;
  sy: number;
  /** the place is in front of the camera and inside the frame, as the projector last saw it */
  infront: boolean;
  /** the card is drawn this frame — false when its place is off frame, or the frame is too full */
  onscreen: boolean;
  /** true once this frame's layout pass has settled this card's place */
  laid: boolean;
  /** the last pass found nowhere for this card to stand, so it is held off the frame */
  dropped: boolean;
  /** the placement this frame: which way the diagonal leans, how far it runs, how far it rises */
  side: number;
  run: number;
  rise: number;
  /** 1 when the stem climbs from the place, -1 when it drops from it */
  lift: number;
  left: number;
  top: number;
  /** what was last written to the page, so an unchanged frame writes nothing */
  wroteLeft: number;
  wroteTop: number;
  wroteAx: number;
  wroteAy: number;
  wroteRun: number;
  wroteSide: number;
  wroteRise: number;
  wroteLift: number;
  wroteOff: boolean;
  closing: boolean;
  timer: number;
}

/**
 * Mount the board over a canvas.
 *
 * `container` must be a positioned element covering the canvas; a static one is made relative
 * so the cards can be placed inside it. `project` is the caller's world-to-screen function and
 * is only used when `tick` is called with no positions of its own.
 */
export function createBillboards(
  container: HTMLElement,
  project?: BillboardProjector | null,
  options?: BillboardOptions,
): Billboards {
  const doc = container.ownerDocument;
  const opt: Required<BillboardOptions> = { ...DEFAULTS, ...(options ?? {}) };
  installStyle(doc);
  if (getComputedStyle(container).position === "static") container.style.position = "relative";

  const root = doc.createElement("div");
  root.className = "rwbb-root";
  const leads = doc.createElementNS(SVG_NS, "svg");
  leads.setAttribute("class", "rwbb-leads");
  root.append(leads);
  container.append(root);

  const cards: Card[] = [];
  let avoid: readonly BillboardRect[] = [];
  let paused = false;
  // the frame the last layout pass ran against, so a placement can be scored against its edges
  let lastWidth = 0;
  let lastHeight = 0;
  /**
   * Whether the placements have to be worked out again. Dropping a card frees the room it was
   * asking for, so a pass that runs again on an unchanged frame can put that card back, take it
   * away again on the next frame, and leave the board flickering. The decision is made once and
   * held until something actually changes: a card opening or closing, a panel arriving or
   * leaving, or a place moving on screen.
   */
  let relayout = true;

  // ------------------------------------------------------------ the reveal
  /**
   * Measure how far each bracket has to travel from the middle of this card to its corner, and
   * write the two distances as custom properties. Everything after that is transform and
   * opacity, which the compositor does without touching layout.
   */
  function fitCorners(card: Card) {
    const dx = Math.max(0, card.w / 2 - CORNER_INSET);
    const dy = Math.max(0, card.h / 2 - CORNER_INSET);
    const place = (sel: string, x: number, y: number) => {
      const node = card.box.querySelector(sel);
      if (!(node instanceof HTMLElement)) return;
      node.style.setProperty("--dx", `${x.toFixed(1)}px`);
      node.style.setProperty("--dy", `${y.toFixed(1)}px`);
    };
    place(".tl", dx, dy);
    place(".tr", -dx, dy);
    place(".bl", dx, -dy);
    place(".br", -dx, -dy);
  }

  function openCard(card: Card) {
    if (card.timer) { clearTimeout(card.timer); card.timer = 0; }
    card.closing = false;
    card.box.classList.remove("closing", "opening", "ready");
    card.box.classList.add("on");
    // the card is on the page now, so its size can be read; the words settle the height
    card.w = card.box.offsetWidth;
    card.h = card.box.offsetHeight;
    fitCorners(card);
    // one frame with the brackets still condensed, so the eye sees them travel
    requestAnimationFrame(() => {
      if (card.closing) return;
      card.box.classList.add("opening");
      card.lead.classList.add("on");
      card.timer = setTimeout(() => {
        card.box.classList.add("ready");
        card.timer = 0;
      }, OPEN_READY_MS) as unknown as number;
    });
  }

  function closeCard(card: Card) {
    if (card.timer) { clearTimeout(card.timer); card.timer = 0; }
    if (card.closing) return;
    card.closing = true;
    card.box.classList.remove("opening", "ready");
    card.box.classList.add("closing");
    card.lead.classList.remove("on");
    card.lead.classList.add("off");
    card.timer = setTimeout(() => { removeCard(card); }, CLOSE_MS) as unknown as number;
  }

  function removeCard(card: Card) {
    if (card.timer) { clearTimeout(card.timer); card.timer = 0; }
    const i = cards.indexOf(card);
    if (i >= 0) cards.splice(i, 1);
    card.box.remove();
    card.lead.remove();
  }

  // ------------------------------------------------------------ building one card

  function writeWords(card: Card, beat: BillboardBeat) {
    card.beat = beat;
    const title = card.body.querySelector(".rwbb-title");
    if (title instanceof HTMLElement) {
      title.textContent = beat.title ?? "";
      title.style.display = beat.title ? "block" : "none";
    }
    const sentence = card.body.querySelector(".rwbb-sentence");
    if (sentence instanceof HTMLElement) sentence.textContent = beat.sentence;
    const detail = card.body.querySelector(".rwbb-detail");
    if (detail instanceof HTMLElement) {
      detail.textContent = beat.detail ?? "";
      detail.style.display = beat.detail ? "block" : "none";
    }
    // Several moments happen at one place, and a card standing there is rewritten rather than
    // opened again. New words are a new height, so the card is measured again and the pass that
    // keeps cards apart is asked to run. Without this the layout keeps testing a card against
    // the size it was two moments ago, and a card that has grown lands on its neighbour.
    if (card.box.classList.contains("on")) {
      const w = card.box.offsetWidth;
      const h = card.box.offsetHeight;
      if (w !== card.w || h !== card.h) {
        card.w = w;
        card.h = h;
        fitCorners(card);
        relayout = true;
      }
    }
  }

  function buildCard(beat: BillboardBeat): Card {
    const box = doc.createElement("div");
    box.className = "rwbb";
    box.style.width = `${opt.width}px`;
    const rv = doc.createElement("div");
    rv.className = "rv";
    for (const corner of ["tl", "tr", "bl", "br"]) {
      const mark = doc.createElement("i");
      mark.className = corner;
      rv.append(mark);
    }
    const body = doc.createElement("div");
    body.className = "rvbody";
    const title = doc.createElement("p");
    title.className = "rwbb-title";
    const sentence = doc.createElement("p");
    sentence.className = "rwbb-sentence";
    const detail = doc.createElement("p");
    detail.className = "rwbb-detail";
    body.append(title, sentence, detail);
    box.append(rv, body);

    const lead = doc.createElementNS(SVG_NS, "g");
    lead.setAttribute("class", "rwbb-lead");
    const edge = doc.createElementNS(SVG_NS, "path");
    edge.setAttribute("class", "edge");
    const path = doc.createElementNS(SVG_NS, "path");
    path.setAttribute("class", "line");
    const pad = doc.createElementNS(SVG_NS, "rect");
    pad.setAttribute("width", "5");
    pad.setAttribute("height", "5");
    lead.append(edge, path, pad);

    const card: Card = {
      id: beat.id, box, body, lead, edge, path, pad, beat,
      w: opt.width, h: 0, sx: 0, sy: 0, infront: false, onscreen: false, laid: false, dropped: false,
      side: 1, run: opt.run, rise: opt.rise, lift: 1, left: 0, top: 0,
      wroteLeft: NaN, wroteTop: NaN, wroteAx: NaN, wroteAy: NaN,
      wroteRun: NaN, wroteSide: NaN, wroteRise: NaN, wroteLift: NaN, wroteOff: false,
      closing: false, timer: 0,
    };
    box.addEventListener("click", () => { card.beat.onClick?.(card.id); });
    writeWords(card, beat);
    root.append(box);
    leads.append(lead);
    return card;
  }

  // ------------------------------------------------------------ laying the cards out

  /**
   * Where a card sits is worked out from its anchor, never chosen freely: the leader rises
   * `rise` pixels, then runs `run` pixels diagonally, and the card's nearest corner is hung on
   * the end of that run. Because the diagonal moves the same distance across as it does up, the
   * bend is exactly forty-five degrees whatever `run` becomes, so the collision pass can nudge a
   * card by lengthening the run and the angle never changes.
   */
  function placeAt(card: Card, side: number, run: number, rise: number, lift: number) {
    const bendX = card.sx;
    const bendY = card.sy - lift * rise;
    const cornerX = bendX + side * run;
    const cornerY = bendY - lift * run;
    card.side = side;
    card.run = run;
    card.rise = rise;
    card.lift = lift;
    card.left = side > 0 ? cornerX : cornerX - card.w;
    card.top = lift > 0 ? cornerY - card.h : cornerY;
  }

  function insideFrame(card: Card, width: number, height: number): boolean {
    return card.left >= opt.margin
      && card.left + card.w <= width - opt.margin
      && card.top >= opt.margin
      && card.top + card.h <= height - opt.margin;
  }

  function overlaps(card: Card, pad: number): boolean {
    for (let i = 0; i < cards.length; i++) {
      const other = cards[i];
      if (other === card || !other.onscreen || !other.laid) continue;
      if (card.left < other.left + other.w + pad
        && other.left < card.left + card.w + pad
        && card.top < other.top + other.h + pad
        && other.top < card.top + card.h + pad) return true;
    }
    for (let i = 0; i < avoid.length; i++) {
      const r = avoid[i];
      if (card.left < r.x + r.w + pad
        && r.x < card.left + card.w + pad
        && card.top < r.y + r.h + pad
        && r.y < card.top + card.h + pad) return true;
    }
    return false;
  }

  /** does the line from (x0,y0) to (x1,y1) cross the rectangle? */
  function segmentHitsBox(x0: number, y0: number, x1: number, y1: number,
    bx: number, by: number, bw: number, bh: number): boolean {
    // the cheap rejection first: the segment's own box has to touch the rectangle at all
    if (Math.max(x0, x1) < bx || Math.min(x0, x1) > bx + bw) return false;
    if (Math.max(y0, y1) < by || Math.min(y0, y1) > by + bh) return false;
    const dx = x1 - x0, dy = y1 - y0;
    // a corner on each side of the line means the line passes between them
    let above = false, below = false;
    for (const [cx, cy] of [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]]) {
      const side = dx * (cy - y0) - dy * (cx - x0);
      if (side > 0) above = true;
      else if (side < 0) below = true;
      else return true;
    }
    return above && below;
  }

  /**
   * Would this card's leader run across something already standing — a card placed before it,
   * or a panel at the edge of the frame? A leader that disappears under a panel and comes out
   * the other side reads as two unrelated marks, so a run that does that is passed over for the
   * next one out.
   */
  function leaderCrosses(card: Card, panels: boolean): boolean {
    const ax = card.sx, ay = card.sy;
    const bendY = ay - card.lift * card.rise;
    const endX = ax + card.side * card.run, endY = bendY - card.lift * card.run;
    const hits = (x: number, y: number, w: number, h: number) =>
      segmentHitsBox(ax, ay, ax, bendY, x, y, w, h)
      || segmentHitsBox(ax, bendY, endX, endY, x, y, w, h);
    for (let i = 0; i < cards.length; i++) {
      const other = cards[i];
      if (other === card || !other.onscreen || !other.laid) continue;
      if (hits(other.left, other.top, other.w, other.h)) return true;
    }
    if (panels) {
      for (let i = 0; i < avoid.length; i++) {
        if (hits(avoid[i].x, avoid[i].y, avoid[i].w, avoid[i].h)) return true;
      }
    }
    return false;
  }

  /** how much of this card's box a rectangle covers, in pixels */
  function coveredBy(card: Card, x: number, y: number, w: number, h: number): number {
    const ox = Math.min(card.left + card.w, x + w) - Math.max(card.left, x);
    const oy = Math.min(card.top + card.h, y + h) - Math.max(card.top, y);
    return ox > 0 && oy > 0 ? ox * oy : 0;
  }

  /** how much of this card's box another card covers — the writing this card would lose */
  function buriedByCards(card: Card): number {
    let worst = 0;
    for (let i = 0; i < cards.length; i++) {
      const other = cards[i];
      if (other === card || !other.onscreen || !other.laid) continue;
      worst += coveredBy(card, other.left, other.top, other.w, other.h);
    }
    return worst;
  }

  /** how much of this card's box the frame's own panels cover */
  function buriedByPanels(card: Card): number {
    let worst = 0;
    for (let i = 0; i < avoid.length; i++) {
      worst += coveredBy(card, avoid[i].x, avoid[i].y, avoid[i].w, avoid[i].h);
    }
    return worst;
  }

  /** how much of this card's box is under anything already standing, cards and panels both */
  function buriedArea(card: Card): number {
    let worst = buriedByCards(card);
    // a panel counts for more than another card: a card can be read over the frame's own
    // gradient, but a panel carrying writing of its own cannot be read through
    for (let i = 0; i < avoid.length; i++) {
      worst += coveredBy(card, avoid[i].x, avoid[i].y, avoid[i].w, avoid[i].h) * 3;
    }
    return worst;
  }

  /**
   * What a candidate placement costs. It is the buried area plus a heavy charge for every pixel
   * the card would hang outside the frame, so when nothing is clear the pass still prefers a
   * card that stands whole over one cut off by the window edge.
   */
  function placementCost(card: Card): number {
    const off = Math.max(0, opt.margin - card.left) + Math.max(0, opt.margin - card.top)
      + Math.max(0, card.left + card.w - (lastWidth - opt.margin))
      + Math.max(0, card.top + card.h - (lastHeight - opt.margin));
    return buriedArea(card) + off * 400;
  }

  /**
   * Cards are placed oldest first, and each one is placed against the ones already down. The
   * order never depends on where anything happens to be, so the same frame always lays out the
   * same way.
   *
   * A card that cannot be given a clear place at all steps off the frame for that moment rather
   * than standing on top of its neighbour. One card covering another truncates a sentence
   * mid-line, and half a sentence a reader cannot finish is worse than one fewer card.
   */
  const BURIED = 0.04;        // how much of itself a card may lose under another card
  const BURIED_PANEL = 0.18;  // and how much it may lose under a panel of the frame's own
  function layout(width: number, height: number) {
    lastWidth = width;
    lastHeight = height;
    if (!relayout) {
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        card.onscreen = card.infront && !card.dropped;
        if (card.onscreen) placeAt(card, card.side, card.run, card.rise, card.lift);
      }
      return;
    }
    relayout = false;
    for (let i = 0; i < cards.length; i++) {
      cards[i].laid = false;
      cards[i].dropped = false;
      cards[i].onscreen = cards[i].infront;
    }
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card.onscreen) continue;
      // lean away from the nearer edge, so the card opens into the room the frame has
      const first = card.sx < width / 2 ? 1 : -1;
      let bestSide = first;
      let bestRun = opt.run;
      let bestRise = opt.rise;
      let bestLift = 1;
      let bestCost = Infinity;
      let found = false;
      // The stem is tried at its resting height first and then at three greater heights, so a
      // card with no room beside its neighbour can climb the frame instead of landing on it.
      // The order never depends on where anything happens to be, so the same frame lays out the
      // same way every time it is drawn.
      const rises = [opt.rise, opt.rise * 1.5, opt.rise * 2.1, opt.rise * 2.9,
        opt.rise * 3.9, opt.rise * 5.1, opt.rise * 6.5, opt.rise * 8];
      // The whole ladder is walked twice. The first walk asks for the resting clearance between
      // two cards and a leader that crosses nothing at all. If the frame has no such place, the
      // second walk asks only that the card touch nothing and that its leader cross no other
      // card, which is the least this page will accept and still much better than dropping the
      // moment off the screen.
      for (let round = 0; round < 2 && !found; round++) {
        const pad = round === 0 ? opt.gap : 0;
        for (let l = 0; l < 2 && !found; l++) {
          // the stem climbs from the place first, and drops from it only when the frame above
          // is full; the gesture is the same either way, one straight run and one diagonal
          const lift = l === 0 ? 1 : -1;
          for (let r = 0; r < rises.length && !found; r++) {
            for (let pass = 0; pass < 2 && !found; pass++) {
              const side = pass === 0 ? first : -first;
              for (let run = opt.run; run <= opt.runMax; run += opt.runStep) {
                placeAt(card, side, run, rises[r], lift);
                const clear = insideFrame(card, width, height) && !overlaps(card, pad)
                  // the leader is drawn as well as the card, so a run that would send the leader
                  // straight across something standing is passed over for the next one out
                  && !leaderCrosses(card, round === 0);
                if (clear) {
                  bestSide = side;
                  bestRun = run;
                  bestRise = rises[r];
                  bestLift = lift;
                  found = true;
                  break;
                }
                const cost = placementCost(card);
                if (cost < bestCost) {
                  bestCost = cost; bestSide = side; bestRun = run;
                  bestRise = rises[r]; bestLift = lift;
                }
              }
            }
          }
        }
      }
      placeAt(card, bestSide, bestRun, bestRise, bestLift);
      card.laid = true;
      // The safety net, for a frame so full that even the fallback buries a card: a card that
      // would lose this much of itself under another card steps off instead, because half a
      // sentence a reader cannot finish is worse than one fewer card.
      const room = card.w * card.h;
      if (buriedByCards(card) > room * BURIED
        || buriedByPanels(card) > room * BURIED_PANEL) {
        card.laid = false;
        card.dropped = true;
        card.onscreen = false;
      }
    }
  }

  // ------------------------------------------------------------ writing the frame

  function drawCard(card: Card) {
    const left = Math.round(card.left);
    const top = Math.round(card.top);
    if (left !== card.wroteLeft || top !== card.wroteTop) {
      card.box.style.transform = `translate3d(${left}px,${top}px,0)`;
      card.wroteLeft = left;
      card.wroteTop = top;
    }
    // half-pixel offsets put a one-pixel stroke inside one column of pixels rather than across
    // two, so the vertical run stays a hairline and the diagonal keeps its exact slope
    const ax = Math.round(card.sx) + 0.5;
    const ay = Math.round(card.sy) + 0.5;
    const run = Math.round(card.run);
    const rise = Math.round(card.rise);
    if (ax !== card.wroteAx || ay !== card.wroteAy || run !== card.wroteRun
      || card.side !== card.wroteSide || rise !== card.wroteRise
      || card.lift !== card.wroteLift) {
      const bendY = ay - card.lift * rise;
      const endX = ax + card.side * run;
      const endY = bendY - card.lift * run;
      const d = `M${ax} ${ay}L${ax} ${bendY}L${endX} ${endY}`;
      card.edge.setAttribute("d", d);
      card.path.setAttribute("d", d);
      card.pad.setAttribute("x", `${ax - 2.5}`);
      card.pad.setAttribute("y", `${ay - 2.5}`);
      card.wroteAx = ax;
      card.wroteAy = ay;
      card.wroteRun = run;
      card.wroteSide = card.side;
      card.wroteRise = rise;
      card.wroteLift = card.lift;
    }
  }

  function setOffstage(card: Card, off: boolean) {
    if (off === card.wroteOff) return;
    card.wroteOff = off;
    card.box.classList.toggle("off", off);
    card.lead.style.display = off ? "none" : "";
  }

  // ------------------------------------------------------------ the board

  function findScreen(screen: readonly BillboardScreenPoint[], id: string) {
    for (let i = 0; i < screen.length; i++) if (screen[i].id === id) return screen[i];
    return null;
  }

  return {
    show(beat: BillboardBeat) {
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].id !== beat.id || cards[i].closing) continue;
        writeWords(cards[i], beat);
        return;
      }
      let standing = 0;
      for (let i = 0; i < cards.length; i++) if (!cards[i].closing) standing++;
      if (standing >= opt.maxVisible) {
        for (let i = 0; i < cards.length; i++) {
          if (cards[i].closing) continue;
          closeCard(cards[i]);
          break;
        }
      }
      const card = buildCard(beat);
      cards.push(card);
      relayout = true;
      openCard(card);
    },

    hide(id: string) {
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].id === id) { relayout = true; closeCard(cards[i]); return; }
      }
    },

    tick(screen?: readonly BillboardScreenPoint[] | null) {
      if (cards.length === 0) return;
      const width = root.clientWidth;
      const height = root.clientHeight;
      // While the run is held the cards keep the place on screen they were last given, so a
      // leader never points at ground the camera has already left. The layout pass still runs:
      // a panel rising over a held frame has to move the cards out from under it, and a frozen
      // layout is how a card ends up buried under a title nobody asked it to stand behind.
      for (let i = 0; !paused && i < cards.length; i++) {
        const card = cards[i];
        let x = card.sx;
        let y = card.sy;
        let infront = card.onscreen;
        if (screen) {
          const point = findScreen(screen, card.id);
          if (point) { x = point.x; y = point.y; infront = point.infront !== false; }
          else infront = false;
        } else if (project) {
          const point = project(card.beat.worldPos);
          x = point.x; y = point.y; infront = point.infront;
        }
        if (Math.abs(x - card.sx) >= 1 || Math.abs(y - card.sy) >= 1) relayout = true;
        card.sx = x;
        card.sy = y;
        // a card whose place has gone behind the camera or off the frame is held back rather
        // than dragged to the edge, which is the declutter rule the reference notes record
        const infrontNow = infront && x > -opt.width && x < width + opt.width
          && y > -opt.rise && y < height + opt.rise;
        if (infrontNow !== card.infront) relayout = true;
        card.infront = infrontNow;
        if (card.h === 0 && card.box.classList.contains("on")) {
          card.w = card.box.offsetWidth;
          card.h = card.box.offsetHeight;
          // a card only knows its own height once it is on the page, and a height that arrives
          // after the pass ran is a pass that has to run again
          if (card.h > 0) relayout = true;
        }
      }
      layout(width, height);
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        setOffstage(card, !card.onscreen);
        if (card.onscreen) drawCard(card);
      }
    },

    setAvoid(rects: readonly BillboardRect[]) { avoid = rects; relayout = true; },

    setPaused(next: boolean) { paused = next; },

    visible(): string[] {
      const out: string[] = [];
      for (let i = 0; i < cards.length; i++) if (!cards[i].closing) out.push(cards[i].id);
      return out;
    },

    clear() {
      for (let i = cards.length - 1; i >= 0; i--) removeCard(cards[i]);
    },

    destroy() {
      for (let i = cards.length - 1; i >= 0; i--) removeCard(cards[i]);
      root.remove();
    },
  };
}
