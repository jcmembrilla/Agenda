/**
 * Genera los íconos PWA sin dependencias externas.
 *
 * Escribe PNG RGBA a mano (IHDR/IDAT/IEND) y rasteriza con supersampling 4×4,
 * así el resultado tiene bordes suaves y no hace falta sharp/canvas en el
 * toolchain. Uso: `pnpm icons`.
 */
import { crc32, deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const BACKGROUND = [13, 148, 136]; // #0d9488
const FOREGROUND = [250, 249, 247]; // #faf9f7
const SAMPLES = 4;

const CHECK_POINTS = [
  [0.29, 0.51],
  [0.43, 0.65],
  [0.71, 0.37],
];
const CHECK_STROKE = 0.085;

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])) >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);

  for (let row = 0; row < height; row += 1) {
    raw[row * (stride + 1)] = 0; // filtro "none"
    pixels.copy(raw, row * (stride + 1) + 1, row * stride, (row + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function insideRoundedSquare(x, y, size, radius) {
  const half = size / 2;
  const dx = Math.abs(x - half) - (half - radius);
  const dy = Math.abs(y - half) - (half - radius);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const inside = Math.min(Math.max(dx, dy), 0);
  return outside + inside - radius <= 0;
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function makeRasterizer(size, { rounded, scale }) {
  const radius = rounded ? size * 0.235 : 0;
  const half = size / 2;
  const points = CHECK_POINTS.map(([x, y]) => [half + (x - 0.5) * size * scale, half + (y - 0.5) * size * scale]);
  const strokeRadius = (CHECK_STROKE * size * scale) / 2;

  return (x, y) => {
    if (!insideRoundedSquare(x, y, size, radius)) {
      return null;
    }

    for (let index = 0; index < points.length - 1; index += 1) {
      const [ax, ay] = points[index];
      const [bx, by] = points[index + 1];
      if (distanceToSegment(x, y, ax, ay, bx, by) <= strokeRadius) {
        return FOREGROUND;
      }
    }

    return BACKGROUND;
  };
}

function renderIcon(size, options) {
  const rasterize = makeRasterizer(size, options);
  const pixels = Buffer.alloc(size * size * 4);
  const step = 1 / SAMPLES;
  const total = SAMPLES * SAMPLES;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const color = rasterize(x + (sx + 0.5) * step, y + (sy + 0.5) * step);

          if (color) {
            r += color[0];
            g += color[1];
            b += color[2];
            a += 255;
          } else {
            r += BACKGROUND[0];
            g += BACKGROUND[1];
            b += BACKGROUND[2];
          }
        }
      }

      const offset = (y * size + x) * 4;
      pixels[offset] = Math.round(r / total);
      pixels[offset + 1] = Math.round(g / total);
      pixels[offset + 2] = Math.round(b / total);
      pixels[offset + 3] = Math.round(a / total);
    }
  }

  return encodePng(size, size, pixels);
}

const TARGETS = [
  { file: 'icon-192.png', size: 192, rounded: true, scale: 1 },
  { file: 'icon-512.png', size: 512, rounded: true, scale: 1 },
  { file: 'icon-512-maskable.png', size: 512, rounded: false, scale: 0.82 },
  { file: 'apple-touch-icon.png', size: 180, rounded: false, scale: 1 },
];

mkdirSync(OUTPUT_DIR, { recursive: true });

for (const { file, size, rounded, scale } of TARGETS) {
  const png = renderIcon(size, { rounded, scale });
  writeFileSync(join(OUTPUT_DIR, file), png);
  console.log(`ok  ${file}  ${size}x${size}  ${(png.length / 1024).toFixed(1)} KB`);
}
