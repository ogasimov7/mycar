#!/usr/bin/env node
/**
 * Downloads the Sketchfab models listed in scripts/3d-models.json, optimizes
 * them for mobile and registers them in src/lib/data/models3d.generated.json.
 *
 *   SKETCHFAB_TOKEN=xxxx node scripts/fetch-3d-models.mjs            # all
 *   SKETCHFAB_TOKEN=xxxx node scripts/fetch-3d-models.mjs bmw-5-f10  # one model (+ its generations)
 *   SKETCHFAB_TOKEN=xxxx node scripts/fetch-3d-models.mjs --force    # re-download everything
 *
 * The token is your personal API token: sketchfab.com → Settings → Password & API.
 * It is read from the environment only and never written anywhere.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PICKS = JSON.parse(readFileSync(join(ROOT, "scripts/3d-models.json"), "utf8"));
const OUT_DIR = join(ROOT, "public/models");
const RAW_DIR = join(ROOT, ".models-raw");
const REGISTRY = join(ROOT, "src/lib/data/models3d.generated.json");
const TOKEN = process.env.SKETCHFAB_TOKEN;
const API = "https://api.sketchfab.com/v3";

if (!TOKEN) {
  console.error("SKETCHFAB_TOKEN is not set. Get it at sketchfab.com → Settings → Password & API.");
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));
const registry = existsSync(REGISTRY) ? JSON.parse(readFileSync(REGISTRY, "utf8")) : {};
const slug = (g) => g.toLowerCase().replace(/[^a-z0-9]+/g, "-");

// One job per default model and per generation variant
const jobs = [];
for (const [id, pick] of Object.entries(PICKS)) {
  if (id.startsWith("_")) continue;
  jobs.push({ key: id, id, uid: pick.uid, generation: pick.generation, years: pick.years, file: `${id}.glb` });
  for (const [gen, v] of Object.entries(pick.variants ?? {})) {
    jobs.push({ key: `${id}@${gen}`, id, uid: v.uid, generation: gen, years: v.years, file: `${id}--${slug(gen)}.glb` });
  }
}
// keep generation/year metadata in sync even for files that are already downloaded
for (const j of jobs) if (registry[j.key]) Object.assign(registry[j.key], { generation: j.generation, years: j.years });
writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n");

const todo = jobs.filter((j) =>
  only.length
    ? only.includes(j.id) || only.includes(j.key)
    : force || !(registry[j.key] && registry[j.key].uid === j.uid && existsSync(join(OUT_DIR, j.file))),
);
console.log(`${todo.length} model yüklənəcək${todo.length ? ": " + todo.map((j) => j.key).join(", ") : ""}`);
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(RAW_DIR, { recursive: true });

const api = async (path) => {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Token ${TOKEN}` } });
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status} ${await r.text().catch(() => "")}`.slice(0, 300));
  return r.json();
};

const findFile = (dir, ext) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      const hit = findFile(p, ext);
      if (hit) return hit;
    } else if (f.toLowerCase().endsWith(ext)) return p;
  }
  return null;
};

const run = (cmd, a) => execFileSync(cmd, a, { stdio: ["ignore", "ignore", "inherit"] });
const gt = (...a) => run("npx", ["--yes", "@gltf-transform/cli@4", ...a]);

for (const job of todo) {
  process.stdout.write(`\n▶ ${job.key} (${job.uid})\n`);
  try {
    const info = await api(`/models/${job.uid}`);
    const license = info.license?.label ?? "unknown";
    if (!/^CC Attribution$|CC0|Public Domain/i.test(license)) {
      console.warn(`  ⚠ license is "${license}" — skipped (need CC BY / CC0 for commercial use)`);
      continue;
    }
    const dl = await api(`/models/${job.uid}/download`);
    const work = join(RAW_DIR, job.key.replace("@", "--"));
    rmSync(work, { recursive: true, force: true });
    mkdirSync(work, { recursive: true });

    let input;
    if (dl.glb?.url) {
      input = join(work, "model.glb");
      writeFileSync(input, Buffer.from(await (await fetch(dl.glb.url)).arrayBuffer()));
    } else if (dl.gltf?.url) {
      const zip = join(work, "model.zip");
      writeFileSync(zip, Buffer.from(await (await fetch(dl.gltf.url)).arrayBuffer()));
      execFileSync("unzip", ["-q", "-o", zip, "-d", work]);
      input = findFile(work, ".gltf");
    }
    if (!input) throw new Error("no glb/gltf in download response");

    // 1) legacy spec-gloss → metal-rough (three.js no longer reads spec-gloss)
    // 2) textures → 1024px WebP   3) gltfpack: simplify dense meshes + meshopt, keeping node/material names
    // Order matters: never re-encode an already quantized/meshopt file (it collapses geometry).
    const faces = info.faceCount ?? 0;
    const ratio = Math.max(0.1, Math.min(1, 150000 / Math.max(1, faces))).toFixed(2);
    const m = join(work, "m.glb");
    try {
      gt("metalrough", input, m);
    } catch {
      gt("copy", input, m);
    }
    gt("resize", m, join(work, "r.glb"), "--width", "1024", "--height", "1024");
    gt("webp", join(work, "r.glb"), join(work, "w.glb"), "--quality", "80");
    const out = join(OUT_DIR, job.file);
    run("npx", ["--yes", "gltfpack@0.25.0", "-i", join(work, "w.glb"), "-o", out, "-si", ratio, "-sa", "-kn", "-km", "-ke", "-cc"]);

    registry[job.key] = {
      url: `/models/${job.file}`,
      uid: job.uid,
      title: info.name,
      author: info.user?.displayName ?? info.user?.username ?? "unknown",
      license: license === "CC Attribution" ? "CC BY 4.0" : license,
      sourceUrl: info.viewerUrl,
      generation: job.generation,
      years: job.years,
    };
    writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n");
    console.log(`  ✔ ${(statSync(out).size / 1e6).toFixed(2)} MB · ${info.name} by ${registry[job.key].author}`);
  } catch (e) {
    console.error(`  ✖ ${e.message}`);
  }
}
console.log(`\nRegistry: ${REGISTRY}`);
