// One-off generator: rasterizes src/app/icon.svg into apple-icon.png and a
// multi-size favicon.ico. Run with `node scripts/gen-favicon.mjs`.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(root, "src", "app");
const svg = await readFile(join(appDir, "icon.svg"));

// Apple touch icon: 180x180, opaque (no transparency on iOS home screens).
await sharp(svg)
  .resize(180, 180)
  .png()
  .toFile(join(appDir, "apple-icon.png"));

// Build favicon.ico embedding PNGs at 16/32/48 (PNG-in-ICO, supported widely).
const sizes = [16, 32, 48];
const pngs = await Promise.all(
  sizes.map((s) => sharp(svg).resize(s, s).png().toBuffer())
);

const count = pngs.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type 1 = icon
header.writeUInt16LE(count, 4);

const entries = Buffer.alloc(16 * count);
let offset = 6 + 16 * count;
pngs.forEach((png, i) => {
  const s = sizes[i];
  const e = entries.subarray(i * 16, i * 16 + 16);
  e.writeUInt8(s === 256 ? 0 : s, 0); // width
  e.writeUInt8(s === 256 ? 0 : s, 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(png.length, 8); // image size
  e.writeUInt32LE(offset, 12); // image offset
  offset += png.length;
});

const ico = Buffer.concat([header, entries, ...pngs]);
await writeFile(join(appDir, "favicon.ico"), ico);

console.log(`favicon.ico (${ico.length} bytes, sizes ${sizes.join("/")}) + apple-icon.png written`);
