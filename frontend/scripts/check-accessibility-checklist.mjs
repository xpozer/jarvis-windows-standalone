// frontend/scripts/check-accessibility-checklist.mjs
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const checklistPath = path.join(root, "ACCESSIBILITY.md");

const requiredTerms = [
  "Keyboard Navigation",
  "Focus",
  "Reduced Motion",
  "Screenreader",
  "Kontrast",
  "WCAG AA",
  "ARIA Combobox Pattern",
];

if (!fs.existsSync(checklistPath)) {
  console.error("ACCESSIBILITY.md fehlt.");
  process.exit(1);
}

const content = fs.readFileSync(checklistPath, "utf8");
const missing = requiredTerms.filter((term) => !content.toLowerCase().includes(term.toLowerCase()));

if (missing.length) {
  console.error("Accessibility Checkliste ist unvollstaendig:");
  for (const term of missing) console.error(`- ${term}`);
  process.exit(1);
}

console.log("OK Accessibility Checkliste enthaelt alle Pflichtpunkte.");
