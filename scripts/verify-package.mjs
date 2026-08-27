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
  "docs/rescueworld/SPEC-2.md", "docs/rescueworld/STORY-TEMPLATE.md",
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
assert.match(index, /0\/40[\s\S]*17\/40[\s\S]*34\/40/);
assert.match(index, /does not prove better real-world judgment or lives saved/i);

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

const literal = (parts) => new RegExp(parts.join(""));
const forbidden = [
  [literal(["152\\.165", "\\.117\\.187"]), "VPN server address"],
  [literal(["10\\.10", "\\.0\\.109"]), "private GPU address"],
  [literal(["Meta#", "data#laB"]), "VPN shared key"],
  [literal(["#\\.\\)8=", "tP_UiSG"]), "VPN password"],
  [literal(["vpn-", "009"]), "VPN account"],
  [literal(["\\/home\\/", "rndyrbrts\\/"]), "private remote path"],
  [/BEGIN (?:RSA|OPENSSH|EC|DSA) PRIVATE KEY/, "private key"],
  [literal(["github_", "pat_[A-Za-z0-9_]+"]), "GitHub token"],
  [literal(["gh", "o_[A-Za-z0-9]+"]), "GitHub OAuth token"],
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
console.log("PASS: the hub links the current viewer, both presentations, guide, result, and limitations.");
