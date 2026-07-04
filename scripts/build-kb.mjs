/**
 * Generate public/kb.json from the frontend data (the source of truth).
 *
 * Bundles src/data/kb.source.ts with esbuild (already a Vite dependency),
 * imports the result, and writes the flat KB the traveler backend reads. Runs
 * automatically before every `npm run build` (via the `prebuild` script); run
 * it directly with `npm run build:kb`.
 */
import { build } from "esbuild";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tmp = resolve(root, "public", ".kb.bundle.mjs");
const out = resolve(root, "public", "kb.json");

await mkdir(resolve(root, "public"), { recursive: true });

await build({
  entryPoints: [resolve(root, "src/data/kb.source.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2020",
  outfile: tmp,
  logLevel: "warning",
});

const mod = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);
const kb = mod.buildKb();
await writeFile(out, JSON.stringify(kb, null, 2) + "\n", "utf-8");
await rm(tmp, { force: true });

console.log(
  `kb.json  ·  ${kb.projects.length} projects, ${kb.accomplishments.length} honours, ` +
    `${kb.guilds.length} guilds, ${kb.skills.length} skills  ->  public/kb.json`,
);
