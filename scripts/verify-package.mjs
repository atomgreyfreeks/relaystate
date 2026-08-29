import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "README.md", "AGENTS.md", "NOTICE.md", "GLOSSARY.md", "index.html", "rescueworld.html",
  "public/rescueworld-log.json", "public/rescueworld-highlights.json",
  "public/real-response-summary.json", "public/docs/emergence-presentation.html",
  "public/docs/submission-presentation.html", "public/docs/rescueworld-guide.html",
  "public/impact-view.html", "public/decision-network.html", "public/decision-run-tree.html",
  "public/receipt-fork-data.json", "public/decision-network-data.json",
  "public/decision-network-growth-data.json", "public/decision-run-tree-data.json",
  "public/decision-run-tree-growth-data.json",
  "public/decision-run-tree-receipt-first-data.json",
  "public/decision-run-tree-receipt-122b-data.json",
  "public/media/vendor/three/three.core.min.js",
  "public/media/vendor/three/three.module.min.js",
  "docs/rescueworld/SPEC-2.md", "docs/rescueworld/STORY-TEMPLATE.md",
  "docs/rescueworld/README-YUKI.md", "docs/rescueworld/YUKI-HANDOFF-2026-08-28.md",
  "docs/rescueworld/YUKI-RESCUE-WORLD-ONE-SHEET.md",
  "docs/rescueworld/ORCHESTRATION-PROCESS-MAP.html",
  "docs/rescueworld/evidence/receipt-fork/acceptance-manifest.json",
  "product/disaster-replay/README.md", "product/disaster-replay/DATA-SOURCES.md",
  "experiment/PREREG.md", "experiment/PRODUCTION-RESULTS.md",
  "experiment/results/production-analysis.json",
];
for (const relative of required) {
  assert.ok(fs.existsSync(path.join(ROOT, relative)), `required handoff file is missing: ${relative}`);
}

assert.ok(!fs.existsSync(path.join(ROOT, "src/rescueworld-console")),
  "the private run-preparation console must not be in this package");
assert.ok(!fs.existsSync(path.join(ROOT, "product/disaster-replay/run-requests")),
  "local/private run requests must not be in this package");
assert.ok(!fs.existsSync(path.join(ROOT, "experiment/remote")),
  "remote launch scripts must not be in this package");

const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
for (const href of [
  "/rescueworld.html", "/docs/emergence-presentation.html",
  "/docs/submission-presentation.html", "/docs/rescueworld-guide.html",
]) assert.ok(index.includes(`href="${href}"`), `hub link is missing: ${href}`);
assert.match(index, /414/);
assert.match(index, /0\/32[\s\S]*Qwen3-32B[\s\S]*8\/8[\s\S]*Qwen3\.5-122B/);
assert.match(index, /does not measure real dispatches, people reached, or lives saved/i);
assert.match(index, /action card/i);

const guide = fs.readFileSync(path.join(ROOT, "public/docs/rescueworld-guide.html"), "utf8");
assert.equal((guide.match(/href="\/rescueworld\.html"/g) ?? []).length, 3,
  "all three guide actions must open the root viewer route");
assert.doesNotMatch(guide, /href="\.\/rescueworld\.html"/,
  "the guide must not resolve the viewer relative to /docs");
assert.doesNotMatch(guide, /192\.168\.|:5185/,
  "the guide must not publish a stale host-specific LAN address");

for (const relative of [
  "public/docs/submission-presentation.html",
  "docs/rescueworld/submission-presentation.html",
]) {
  const presentation = fs.readFileSync(path.join(ROOT, relative), "utf8");
  assert.doesNotMatch(presentation,
    /video\/plan\/SCRIPT-V3|experiments\/kumamoto-real-response|app\/scripts\/audit-plain-text|board messages?\s+\d|Disaster Simulation Clarification\.pdf/,
    `presentation cites an absent or obsolete source: ${relative}`);
}
for (const relative of [
  "public/docs/emergence-presentation.html",
  "docs/rescueworld/emergence-presentation.html",
]) {
  const presentation = fs.readFileSync(path.join(ROOT, relative), "utf8");
  assert.doesNotMatch(presentation, /same incomplete information/i,
    `presentation overstates the reconstructed information boundary: ${relative}`);
}

const textExtensions = new Set([
  ".css", ".geojson", ".html", ".js", ".json", ".jsonl", ".md", ".mjs", ".sh",
  ".toml", ".ts", ".txt", ".yml", ".yaml",
]);
const ignored = new Set([".git", "dist", "node_modules"]);
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const candidate = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) assert.fail(`symlinks are not permitted in the handoff: ${candidate}`);
    if (entry.isDirectory()) walk(candidate);
    else files.push(candidate);
  }
}
walk(ROOT);

const forbidden = [
  [/\b10(?:\.\d{1,3}){3}\b/, "private network address"],
  [/\b(?:server address|vpn server)\s*[:=]\s*(?:\d{1,3}\.){3}\d{1,3}\b/i,
    "labeled VPN/server address"],
  [/\b(?:pre[- ]shared key|shared secret|vpn (?:user(?:name)?|account|password))\s*[:=]/i,
    "labeled VPN credential"],
  [new RegExp(["L2TP", "\\/IPsec", "|IPsec ", "Shared Secret"].join(""), "i"),
    "VPN configuration"],
  [/\/home\/[a-z_][a-z0-9_-]{1,31}\//i, "private remote path"],
  [/BEGIN (?:RSA|OPENSSH|EC|DSA) PRIVATE KEY/, "private key"],
  [new RegExp(["github", "_pat_", "[A-Za-z0-9_]+"].join("")), "GitHub token"],
  [new RegExp(["gh", "o_", "[A-Za-z0-9]+"].join("")), "GitHub OAuth token"],
  [/\bsk-[A-Za-z0-9_-]{20,}/, "API key"],
  [new RegExp(["seven", "earths"].join("-"), "i"), "stale six-candidate work"],
  [new RegExp(["deep", "research", "report", "5"].join("-"), "i"), "stale July brief"],
];
for (const file of files) {
  assert.notEqual(path.basename(file), ".DS_Store", ".DS_Store must not ship");
  if (!textExtensions.has(path.extname(file).toLowerCase())) continue;
  const body = fs.readFileSync(file, "utf8");
  for (const [pattern, label] of forbidden) {
    assert.doesNotMatch(body, pattern, `${label} found in ${path.relative(ROOT, file)}`);
  }
}

console.log(`PASS: ${required.length} required handoff files are present.`);
console.log(`PASS: ${files.length} packaged files contain no known credentials, private infrastructure, or stale six-candidate brief.`);
console.log("PASS: the hub links the viewer, presentations, guide, decision views, accepted action-card result, and limitations.");
