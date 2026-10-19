// Regenerates public/icons/*.png and public/favicon.png from an inline SVG (no external assets needed).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(`${root}/icons`, { recursive: true });

function svg(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#ec4899"/></linearGradient></defs>` +
      `<rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#g)"/>` +
      `<text x="50%" y="58%" font-family="sans-serif" font-size="${size * 0.5}" font-weight="700" fill="white" text-anchor="middle">L</text></svg>`,
  );
}

for (const size of [16, 32, 192, 512]) {
  await sharp(svg(size)).png().toFile(`${root}/icons/icon-${size}x${size}.png`);
  console.log(`icon-${size}x${size}.png written`);
}
await sharp(svg(192)).png().toFile(`${root}/favicon.png`);
console.log('done');
