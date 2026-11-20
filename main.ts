// Vice Poster Studio — make.fun entry point for gta6-cover-art-01.
//
// The deliverable is the static web app in app/ (plain HTML/CSS/ES modules,
// no build step, no network requests). This program hands it in: it copies
// app/ and screenshots/ into the output directory and writes dossier.json
// there with the vendored make.fun library, so the judge can read a summary
// of exactly what was submitted.
//
// Run locally:  node serve.ts          (then open http://localhost:8080)
// Hand in:      mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// MAKEFUN_OUTPUT_DIR stands in for /output outside the grader's container;
// when it is unset the program writes to /output, the grader's mount point.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps, mirrored so an oversized entry is refused here rather
// than after submission: at most 4 screenshots of 256 KiB each, at most 993
// files and 48 MiB under app/, no app/ path longer than 1000 bytes.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsOut = join(outputDir, 'screenshots');
mkdirSync(shotsOut, { recursive: true });
const shotsIn = join(repoRoot, 'screenshots');
if (existsSync(shotsIn)) cpSync(shotsIn, shotsOut, { recursive: true });

const dossier = buildDossier(outputDir, DOSSIER_LIMITS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`Vice Poster Studio handed in at ${outputDir} (dossier ${dossier.length} bytes)`);
