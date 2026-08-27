import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 5198;
const base = `http://127.0.0.1:${port}`;
const candidates = [
  process.env.RESCUE_CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium",
].filter(Boolean);
const executablePath = candidates.find((candidate) => fs.existsSync(candidate));
assert.ok(executablePath,
  "Chrome was not found. Set RESCUE_CHROME to the browser executable and run this command again.");

const vite = path.join(ROOT, "node_modules/.bin/vite");
const server = spawn(vite, ["--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
  cwd: ROOT, stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += chunk; });
server.stderr.on("data", (chunk) => { serverOutput += chunk; });

async function ready() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(base)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`the local server did not start\n${serverOutput}`);
}

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "rescue-world-partner-"));
let browser;
try {
  await ready();
  browser = await puppeteer.launch({
    executablePath, headless: true, userDataDir: profile,
    args: ["--password-store=basic", "--use-mock-keychain", "--no-first-run"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const noise = [];
  page.on("pageerror", (error) => noise.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (["error", "warn"].includes(message.type())) noise.push(`${message.type()}: ${message.text()}`);
  });

  await page.goto(base, { waitUntil: "load", timeout: 30_000 });
  assert.equal(await page.$eval("h1", (node) => node.textContent.trim()),
    "See what happened, what the agents knew, and why a decision passed.");
  assert.equal(await page.$$eval(".card", (nodes) => nodes.length), 4);
  assert.ok(await page.$eval('a[href="/rescueworld.html"]', (node) => node instanceof HTMLAnchorElement));
  await page.screenshot({ path: "/tmp/rescue-world-partner-hub.png", fullPage: true });

  await page.goto(`${base}/rescueworld.html`, { waitUntil: "load", timeout: 30_000 });
  await page.waitForSelector("#briefGo", { visible: true, timeout: 30_000 });
  await page.waitForFunction(() => {
    const text = document.querySelector("#briefText")?.textContent?.trim();
    return Boolean(text && text !== "—");
  }, { timeout: 30_000 });
  const opening = await page.$eval("#briefText", (node) => node.textContent.replace(/\s+/g, " ").trim());
  assert.match(opening, /magnitude 7\.1 earthquake struck Kumamoto/i);
  assert.ok(await page.$eval("#gl", (canvas) => canvas instanceof HTMLCanvasElement
    && canvas.getBoundingClientRect().width > 1000));
  await page.click("#briefGo");
  await page.waitForFunction(() => document.querySelector("#brief")?.classList.contains("gone"));

  // The decision map must remain an action overview: eleven real decision moments, test evidence
  // on exactly five, and exactly 5 × 3 × 8 = 120 scored AI proposals. The six contextual moments
  // may never grow invented result branches.
  await page.keyboard.press("b");
  await page.waitForFunction(() => document.querySelector("#tree")?.classList.contains("on"));
  await page.waitForFunction(() => Number.parseFloat(
    getComputedStyle(document.querySelector("#tree .tsel .rvbody")).opacity) > 0.95);
  // A selected beacon can redraw its panel one frame after the tree becomes visible. Wait past
  // that second reveal so the screenshot judges the settled reading surface, not its fade-in.
  await new Promise((resolve) => setTimeout(resolve, 900));
  const tree = await page.evaluate(() => window.__HERO.treeState());
  assert.equal(tree.junctions, 11);
  assert.equal(tree.graded, 5);
  assert.equal(tree.marks.reduce((sum, mark) => sum
    + mark.methods.reduce((methodSum, method) => methodSum + method.seeds.length, 0), 0), 120);
  assert.equal(tree.marks.filter((mark) => !mark.registered
    && mark.methods.length !== 0).length, 0, "an unscored moment grew an invented result branch");
  assert.match(await page.$eval("#tree .tsel .tsay", (node) => node.textContent),
    /eight emergency-response groups.*four command teams.*three fire brigades.*one helicopter crew/i);
  assert.deepEqual(await page.$$eval("#tree .tbranch .tbact", (nodes) =>
    nodes.map((node) => node.textContent)),
  ["four command teams", "three fire brigades", "one helicopter crew"]);
  await page.screenshot({ path: "/tmp/rescue-world-partner-viewer.png" });

  // The same surface must fit a typical laptop without dropping a decision or hiding its action.
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await new Promise((resolve) => setTimeout(resolve, 900));
  assert.equal(await page.$$eval("#tree .tnode", (nodes) => nodes.length), 11);
  assert.ok(await page.$eval("#tree .tsel", (node) => {
    const box = node.getBoundingClientRect();
    return box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight;
  }), "the decision detail panel leaves the laptop viewport");
  await page.screenshot({ path: "/tmp/rescue-world-partner-viewer-laptop.png" });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("#tree")?.classList.contains("on"));

  // The list repeats the same decisions. Its default order is proposal, public response, then an
  // optional testing disclosure; the frozen mixed result remains 0/40 → 17/40 → 34/40.
  await page.keyboard.press("l");
  await page.waitForFunction(() => document.querySelector("#ledger")?.classList.contains("on"));
  await page.waitForFunction(() => {
    const body = document.querySelector("#ledger .rvbody");
    return body && Number.parseFloat(getComputedStyle(body).opacity) > 0.95;
  });
  assert.match(await page.$eval("#ledgerTitle", (node) => node.textContent),
    /AI agents proposed rescue actions/i);
  const ledger = await page.evaluate(() => {
    const row = document.querySelector("#ledgerRows .ledrow");
    const chose = row?.querySelector(".lchose");
    const publicLine = row?.querySelector(".lsaid");
    const testing = row?.querySelector("button.traceopen");
    const follows = (first, second) => !!first && !!second
      && !!(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
    return {
      totals: window.__HERO.ledgerState().totals.map((entry) => [entry.passes, entry.tries]),
      rows: document.querySelectorAll("#ledgerRows .ledrow").length,
      action: chose?.textContent ?? "",
      order: follows(chose, publicLine) && follows(publicLine, testing),
      visibleStrips: [...document.querySelectorAll("#ledgerRows .strip")]
        .filter((node) => node.getBoundingClientRect().height > 0).length,
    };
  });
  assert.equal(ledger.rows, 11);
  assert.deepEqual(ledger.totals, [[0, 40], [17, 40], [34, 40]]);
  assert.match(ledger.action, /^The AI proposed/i);
  assert.equal(ledger.order, true, "ledger test evidence appears before the public-response line");
  assert.equal(ledger.visibleStrips, 0, "ledger exposes repeated-run scores before they are requested");

  // Walk the flagship water decision through all six semantic cards. This is the partner's
  // shortest proof that the action, evidence, public context, check and testing details remain
  // separate rather than collapsing back into one research wall.
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector("#ledger")?.classList.contains("on"));
  const traceCards = await page.evaluate(() => {
    const moment = "slot-09-push-water-planning";
    const opened = window.__HERO.openTrace(moment, 0);
    if (!opened) return [];
    const cards = [window.__HERO.traceState().cardId];
    for (let i = 1; i < 6; i++) cards.push(window.__HERO.stepTrace(1).cardId);
    return cards;
  });
  assert.equal(traceCards.length, 6);
  assert.deepEqual(traceCards.map((id) => id?.split(":").at(-1)),
    ["situation", "final", "known", "real", "check", "testing"]);
  assert.match(await page.$eval("#traceHeading", (node) => node.textContent), /tested/i);
  assert.deepEqual(noise, [], `browser warnings or errors: ${noise.join(" | ")}`);

  console.log("PASS: the partner hub loads, exposes four current review paths, and fits at 1440×900.");
  console.log("PASS: the viewer opens 11 action-first decisions, exactly 120 scored proposals, and no invented branches.");
  console.log("PASS: the ledger preserves 0/40 → 17/40 → 34/40 and the flagship keeps six semantic cards.");
  console.log("Screenshots: /tmp/rescue-world-partner-hub.png, /tmp/rescue-world-partner-viewer.png and /tmp/rescue-world-partner-viewer-laptop.png");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
  fs.rmSync(profile, { recursive: true, force: true });
}
