/**
 * Removes the floating halo above Ayah on every spritesheet frame:
 * 1) Keep largest 4-connected opaque blob (drops the detached halo mass when separate).
 * 2) Remove cream/white halo interior (merged frames): haloLike RGB in rows 0–34.
 * 3) Clear rows 0–6 entirely (leftover ring outline no longer touches mint fur there).
 * 4) Row 7: keep only bright mint pixels (ear tips); strip remaining ring cream/outline.
 * 5) Rows 8–34: strip beige/cream halo paint merged into the outline; second largest-blob pass
 *    removes the black halo stroke when it disconnects from the body.
 *
 * Run: bun scripts/remove-ayah-halo.mjs
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const input = join(root, "assets/pets/ayah/spritesheet.webp");

const FW = 192;
const FH = 208;
const COLS = 8;
const ATH = 64;

/** Near-white / cream halo fill (not mint-tinted fur). */
function haloLikeRgb(r, g, b) {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  const avg = (r + g + b) / 3;
  return spread <= 22 && avg >= 224 && Math.max(r, g, b) >= 245;
}

/** Row 7 only: keep bright mint ear pixels; strip halo/beige residue. */
function keepRow7Mint(r, g, b, a) {
  return a >= ATH && g >= 200 && g - r > 11;
}

/**
 * Beige / cream halo paint left merged into the outline (avg lower than haloLike).
 * Keeps bright mint fur (high G or mx) and wider-spread fur shadows.
 */
function creamHaloResidual(r, g, b, a) {
  if (a < ATH) return false;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const spread = mx - mn;
  const avg = (r + g + b) / 3;
  if (mx >= 222 || g >= 224) return false;
  if (avg < 125 || avg > 225) return false;
  if (spread > 38) return false;
  // Fur shadows with real chroma separation — keep
  if (avg >= 198 && spread > 24) return false;
  // Tight neutral cream (AA + ring interior)
  const tightNeutral =
    spread <= 22 &&
    avg <= 214 &&
    mx <= 218 &&
    Math.abs(g - r) <= 10 &&
    Math.max(Math.abs(g - b), Math.abs(r - b)) <= 24;
  if (tightNeutral) {
    if (g >= 208 && g - r >= 12) return false;
    return true;
  }
  // Broader muted beige ring
  if (spread <= 36 && avg <= 208 && mx <= 202 && avg >= 130) {
    if (g >= 208 && g - r >= 10 && g - b >= 6) return false;
    return true;
  }
  return false;
}

/** Bright neutral AA / silver ring between cream and mint fur (merged halo rim). */
function neutralHaloShimmer(r, g, b, a, localY) {
  if (a < ATH) return false;
  if (localY > 16) return false;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const spread = mx - mn;
  const avg = (r + g + b) / 3;
  if (mx >= 232 || g >= 232) return false;
  if (spread > 26) return false;
  if (avg < 192 || avg > 228) return false;
  if (spread > 22) return false;
  if (Math.abs(g - r) > 12 || Math.abs(g - b) > 14 || Math.abs(r - b) > 14) return false;
  if (g >= 218 && g - r >= 14) return false;
  return true;
}

function clearPixel(out, sw, sx, sy) {
  const i = (sy * sw + sx) * 4;
  out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
}

/** Label opaque components; optionally drop all but the largest. */
function keepLargestBlob(out, sw, ox, oy) {
  const w = FW;
  const h = FH;
  const alphaAt = (x, y) => out[((oy + y) * sw + (ox + x)) * 4 + 3];

  const labels = new Int32Array(w * h);
  labels.fill(-1);
  const areas = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (alphaAt(x, y) < ATH || labels[idx] !== -1) continue;

      const id = areas.length;
      const stack = [[x, y]];
      labels[idx] = id;
      let count = 0;

      while (stack.length) {
        const [cx, cy] = stack.pop();
        count++;
        const push = (nx, ny) => {
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) return;
          const nidx = ny * w + nx;
          if (labels[nidx] !== -1) return;
          if (alphaAt(nx, ny) < ATH) return;
          labels[nidx] = id;
          stack.push([nx, ny]);
        };
        push(cx - 1, cy);
        push(cx + 1, cy);
        push(cx, cy - 1);
        push(cx, cy + 1);
      }

      areas.push(count);
    }
  }

  if (areas.length <= 1) return;

  let keepId = 0;
  for (let i = 1; i < areas.length; i++) {
    if (areas[i] > areas[keepId]) keepId = i;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (labels[idx] !== -1 && labels[idx] !== keepId) {
        clearPixel(out, sw, ox + x, oy + y);
      }
    }
  }
}

function processCell(out, sw, ox, oy) {
  const w = FW;
  const h = FH;

  keepLargestBlob(out, sw, ox, oy);

  const topCutoff = 34;
  for (let y = 0; y <= topCutoff; y++) {
    for (let x = 0; x < w; x++) {
      const sx = ox + x;
      const sy = oy + y;
      const i = (sy * sw + sx) * 4;
      const a = out[i + 3];
      if (a < ATH) continue;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      if (haloLikeRgb(r, g, b)) {
        out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
      }
    }
  }

  const creamCutoff = 34;
  for (let y = 8; y <= creamCutoff; y++) {
    for (let x = 0; x < w; x++) {
      const sx = ox + x;
      const sy = oy + y;
      const i = (sy * sw + sx) * 4;
      const a = out[i + 3];
      if (a < ATH) continue;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      if (creamHaloResidual(r, g, b, a)) {
        out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
      }
    }
  }

  for (let y = 8; y <= 16; y++) {
    for (let x = 52; x <= 140; x++) {
      const sx = ox + x;
      const sy = oy + y;
      const i = (sy * sw + sx) * 4;
      const a = out[i + 3];
      if (a < ATH) continue;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      if (neutralHaloShimmer(r, g, b, a, y)) {
        out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
      }
    }
  }

  // Cream strips often disconnect the black halo stroke — drop it if separate.
  keepLargestBlob(out, sw, ox, oy);

  for (let y = 0; y <= 6; y++) {
    for (let x = 0; x < w; x++) {
      clearPixel(out, sw, ox + x, oy + y);
    }
  }

  const row7 = 7;
  for (let x = 0; x < w; x++) {
    const sx = ox + x;
    const sy = oy + row7;
    const i = (sy * sw + sx) * 4;
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const a = out[i + 3];
    if (a < ATH) continue;
    if (!keepRow7Mint(r, g, b, a)) {
      out[i] = out[i + 1] = out[i + 2] = out[i + 3] = 0;
    }
  }
}

async function main() {
  const before = readFileSync(input);
  const { data, info } = await sharp(before)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sw = info.width;
  const sh = info.height;
  const out = Buffer.from(data);

  const rows = sh / FH;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      const ox = cx * FW;
      const oy = cy * FH;
      let any = false;
      for (let y = 0; y < FH && !any; y++) {
        for (let x = 0; x < FW; x++) {
          if (out[((oy + y) * sw + (ox + x)) * 4 + 3] > 0) {
            any = true;
            break;
          }
        }
      }
      if (!any) continue;
      processCell(out, sw, ox, oy);
    }
  }

  await sharp(out, {
    raw: { width: sw, height: sh, channels: 4 },
  })
    .webp({ lossless: true, effort: 6 })
    .toFile(input);

  console.log("Updated", input);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
