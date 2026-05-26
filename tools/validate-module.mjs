import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const fail = (message) => {
  console.error(message);
  process.exitCode = 1;
};

const manifest = readJson("module.json");
const language = readJson("lang/en.json");
const expectedReleaseBase = `https://github.com/SpencerZPoole/d35e-spell-save-dc/releases/download/v${manifest.version}`;

if (manifest.id !== "d35e-spell-save-dc") fail("module.json id must be d35e-spell-save-dc");
if (manifest.title !== "D35E Spell Save DC") fail("module.json title mismatch");
if (!manifest.relationships?.systems?.some((system) => system.id === "D35E" && system.type === "system")) {
  fail("module.json must restrict activation through a D35E system relationship");
}
if (manifest.manifest !== "https://github.com/SpencerZPoole/d35e-spell-save-dc/releases/latest/download/module.json") {
  fail("module.json manifest must point to the stable latest-release manifest asset");
}
if (manifest.download !== `${expectedReleaseBase}/d35e-spell-save-dc-v${manifest.version}.zip`) {
  fail("module.json download must point to the versioned release zip asset");
}
if (!manifest.readme?.startsWith?.("https://raw.githubusercontent.com/")) fail("module.json readme should use a raw public URL");
if (!manifest.changelog?.startsWith?.("https://raw.githubusercontent.com/")) fail("module.json changelog should use a raw public URL");

for (const script of manifest.scripts ?? []) {
  if (!fs.existsSync(path.join(root, script))) fail(`Missing script listed in module.json: ${script}`);
}

for (const style of manifest.styles ?? []) {
  if (!fs.existsSync(path.join(root, style))) fail(`Missing style listed in module.json: ${style}`);
}

for (const lang of manifest.languages ?? []) {
  if (!fs.existsSync(path.join(root, lang.path))) fail(`Missing language file listed in module.json: ${lang.path}`);
}

for (const key of [
  "D35ESpellSaveDC.Settings.Debug.Name",
  "D35ESpellSaveDC.Settings.Debug.Hint",
  "D35ESpellSaveDC.Chat.Label",
  "D35ESpellSaveDC.Sheet.Label",
  "D35ESpellSaveDC.Sheet.Formula"
]) {
  if (!language[key]) fail(`Missing localization key: ${key}`);
}

if (!process.exitCode) console.log("Module manifest validation passed.");
