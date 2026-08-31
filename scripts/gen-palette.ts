/**
 * scripts/gen-palette.ts — regenerate the CSS colour-token surface from the
 * single canonical source in lib/palette.ts.
 *
 *   npm run gen:palette     write the generated region into app/globals.css
 *   npm run palette:check   run with --check: regenerate in memory and exit
 *                           nonzero if any target would change (drift guard).
 *                           Works whether or not the targets are git-tracked.
 *
 * Only the text between each region's `/* @palette:<id> start *​/` and
 * `/* @palette:<id> end *​/` markers is rewritten. Anything else in those files
 * is hand-authored and left alone. See lib/palette.ts for the source of truth.
 * (Pattern ported from PapiUI.)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGIONS } from '../lib/palette';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

/** Replace the body between `@palette:<id> start` and `@palette:<id> end`. */
function spliceRegion(src: string, id: string, body: string): string {
  const startTag = `@palette:${id} start`;
  const endTag = `@palette:${id} end`;
  const startIdx = src.indexOf(startTag);
  const endIdx = src.indexOf(endTag);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`gen-palette: markers for "${id}" not found (start=${startIdx}, end=${endIdx})`);
  }
  const afterStartLine = src.indexOf('\n', startIdx) + 1; // first char of the line after the start marker
  const endLineStart = src.lastIndexOf('\n', endIdx) + 1; // first char of the end-marker line
  return src.slice(0, afterStartLine) + body + src.slice(endLineStart);
}

let changed = 0;
for (const [relPath, regions] of Object.entries(REGIONS)) {
  const absPath = join(ROOT, relPath);
  const original = readFileSync(absPath, 'utf8');
  let next = original;
  for (const [id, render] of Object.entries(regions)) {
    next = spliceRegion(next, id, render());
  }
  if (next !== original) {
    changed++;
    if (CHECK) {
      console.error(`gen-palette: DRIFT — ${relPath} is out of date with lib/palette.ts`);
    } else {
      writeFileSync(absPath, next);
      console.log(`gen-palette: wrote ${relPath}`);
    }
  } else {
    console.log(`gen-palette: ${relPath} already up to date`);
  }
}

if (CHECK) {
  if (changed > 0) {
    console.error(
      `gen-palette: drift detected in ${changed} file${changed === 1 ? '' : 's'}. ` +
        `Run \`npm run gen:palette\` and commit the result.`,
    );
    process.exit(1);
  }
  console.log('gen-palette: no drift — tokens match lib/palette.ts');
} else {
  console.log(`gen-palette: done (${changed} file${changed === 1 ? '' : 's'} changed)`);
}
