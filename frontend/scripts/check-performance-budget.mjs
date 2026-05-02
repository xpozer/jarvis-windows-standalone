// frontend/scripts/check-performance-budget.mjs
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const budgetPath = path.join(root, "performance-budget.json");
const distPath = path.resolve(root, "../docs/stack-preview");

const budget = JSON.parse(fs.readFileSync(budgetPath, "utf8"));

if (!fs.existsSync(distPath)) {
  fail(`Build Ordner fehlt: ${distPath}. Fuehre zuerst npm run build:stack-preview aus.`);
}

const files = walk(distPath);
const jsFiles = files.filter((file) => file.endsWith(".js"));
const cssFiles = files.filter((file) => file.endsWith(".css"));
const totalKb = toKb(sum(files));
const jsKb = toKb(sum(jsFiles));
const cssKb = toKb(sum(cssFiles));

const checks = [
  ["initialJavaScriptKb", jsKb, budget.initialJavaScriptKb],
  ["initialCssKb", cssKb, budget.initialCssKb],
  ["totalAssetsKb", totalKb, budget.totalAssetsKb],
];

let failed = false;
for (const [name, actual, limit] of checks) {
  const ok = actual <= limit;
  const line = `${ok ? "OK" : "FAIL"} ${name}: ${actual.toFixed(1)} KB / ${limit} KB`;
  console.log(line);
  if (!ok) failed = true;
}

if (failed) {
  process.exitCode = 1;
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return fullPath;
  });
}

function sum(filePaths) {
  return filePaths.reduce((total, filePath) => total + fs.statSync(filePath).size, 0);
}

function toKb(bytes) {
  return bytes / 1024;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
