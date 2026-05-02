// frontend/scripts/check-migration-gate.mjs
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checklistPath = path.join(root, "migration-checklist.json");

if (!fs.existsSync(checklistPath)) {
  console.error("migration-checklist.json fehlt.");
  process.exit(1);
}

const checklist = JSON.parse(fs.readFileSync(checklistPath, "utf8"));
const phase4 = checklist.phase4_replace_legacy_html ?? {};
const approved = Boolean(phase4.docs_index_replacement_approved);

if (approved) {
  const required = [
    "fallback_commit_documented",
    "ci_green",
    "manual_signoff",
  ];
  const missing = required.filter((key) => phase4[key] !== true);
  if (missing.length) {
    console.error("docs/index.html darf noch nicht ersetzt werden. Fehlende Freigaben:");
    for (const key of missing) console.error(`- ${key}`);
    process.exit(1);
  }
}

console.log("OK Migration Gate: docs/index.html bleibt geschuetzt oder ist voll freigegeben.");
