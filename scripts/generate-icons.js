import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// Ensure public directory exists
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="crimson" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#dc2626" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  
  <!-- Base Background -->
  <rect width="512" height="512" rx="112" fill="url(#bg)" />
  
  <!-- Subtle Japanese Sun / Circle -->
  <circle cx="256" cy="230" r="145" fill="url(#crimson)" opacity="0.95" />
  
  <!-- Outer glow ring -->
  <circle cx="256" cy="230" r="152" fill="none" stroke="#f87171" stroke-width="3" opacity="0.4" />
  
  <!-- Center Japanese Kanji: 語 (Language) or 声 (Voice) -->
  <text x="256" y="275" font-family="-apple-system, BlinkMacSystemFont, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif" font-size="140" font-weight="900" fill="#ffffff" text-anchor="middle" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))">声</text>
  
  <!-- Subtitle badge: ES ⇄ JA -->
  <rect x="136" y="405" width="240" height="48" rx="24" fill="#1e293b" stroke="#334155" stroke-width="2" />
  <text x="256" y="437" font-family="-apple-system, BlinkMacSystemFont, system-ui, sans-serif" font-size="20" font-weight="800" fill="#f8fafc" letter-spacing="3" text-anchor="middle">ES ⇄ JA</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');

// Function to generate raw PNG with node built-ins
function createPNG(width, height, renderFn) {
  // RGBA buffer
  const stride = width * 4;
  const rawData = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// Table-based CRC32
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Render app icon raster
function renderIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background color #0f172a (15, 23, 42)
  let r = 15, g = 23, b = 42, a = 255;

  // Japanese sun circle
  const sunRadius = isMaskable ? w * 0.28 : w * 0.30;
  const sunCenterY = cy - (isMaskable ? 0 : h * 0.04);
  const sunDist = Math.sqrt(dx * dx + (y - sunCenterY) * (y - sunCenterY));

  if (sunDist <= sunRadius) {
    // Red crimson gradient
    const t = (y - (sunCenterY - sunRadius)) / (sunRadius * 2);
    r = Math.round(239 * (1 - t * 0.2));
    g = Math.round(68 * (1 - t * 0.2));
    b = Math.round(68 * (1 - t * 0.2));
  } else if (sunDist <= sunRadius + 3) {
    // Soft outer ring
    r = 248; g = 113; b = 113; a = 120;
  }

  // Draw a crisp white inner Kanji glyph or stylized icon cross:
  // Let's draw stylized Japanese sound waves / speech indicator inside the red circle
  const innerDy = y - sunCenterY;
  if (Math.abs(innerDy) < sunRadius * 0.65 && Math.abs(dx) < sunRadius * 0.65) {
    // Horizontal center cross stroke
    if (Math.abs(innerDy) < sunRadius * 0.08 && Math.abs(dx) < sunRadius * 0.5) {
      r = 255; g = 255; b = 255; a = 255;
    }
    // Upper horizontal stroke
    if (Math.abs(innerDy + sunRadius * 0.32) < sunRadius * 0.07 && Math.abs(dx) < sunRadius * 0.4) {
      r = 255; g = 255; b = 255; a = 255;
    }
    // Vertical center stroke
    if (Math.abs(dx) < sunRadius * 0.08 && innerDy >= -sunRadius * 0.35 && innerDy <= sunRadius * 0.4) {
      r = 255; g = 255; b = 255; a = 255;
    }
    // Lower pedestal stroke
    if (Math.abs(innerDy - sunRadius * 0.38) < sunRadius * 0.07 && Math.abs(dx) < sunRadius * 0.45) {
      r = 255; g = 255; b = 255; a = 255;
    }
  }

  return [r, g, b, a];
}

console.log('Generating PNG icons...');
const icon192 = createPNG(192, 192, (x, y, w, h) => renderIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);

const icon512 = createPNG(512, 512, (x, y, w, h) => renderIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);

const iconMaskable = createPNG(512, 512, (x, y, w, h) => renderIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);

const appleIcon = createPNG(180, 180, (x, y, w, h) => renderIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

console.log('Icons generated successfully in public/');
