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
  await page.keyboard.press("l");
  await page.waitForFunction(() => document.querySelector("#ledger")?.classList.contains("on"));
  await page.waitForFunction(() => {
    const body = document.querySelector("#ledger .rvbody");
    return body && Number.parseFloat(getComputedStyle(body).opacity) > 0.95;
  });
  assert.match(await page.$eval("#ledgerTitle", (node) => node.textContent), /decision/i);
  await page.screenshot({ path: "/tmp/rescue-world-partner-viewer.png" });
  assert.deepEqual(noise, [], `browser warnings or errors: ${noise.join(" | ")}`);

  console.log("PASS: the partner hub loads, exposes four current review paths, and fits at 1440×900.");
  console.log("PASS: the live viewer loads its 7.1 opening, begins, and opens the decision ledger.");
  console.log("Screenshots: /tmp/rescue-world-partner-hub.png and /tmp/rescue-world-partner-viewer.png");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
  fs.rmSync(profile, { recursive: true, force: true });
}
