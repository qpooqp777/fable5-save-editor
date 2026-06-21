// Generates simple PNG icons for the extension
const fs = require('fs');
const path = require('path');

function createPNG(size, drawFn) {
  // Minimal PNG creator using raw data
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeData), 0);
    return Buffer.concat([len, typeData, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type (RGBA)
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Image data
  const raw = [];
  for (let y = 0; y < size; y++) {
    raw.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = drawFn(x, y, size);
      raw.push(r, g, b, a);
    }
  }

  // Simple DEFLATE (uncompressed block)
  const rawBuf = Buffer.from(raw);
  const maxBlock = 65535;
  const blocks = [];
  for (let i = 0; i < rawBuf.length; i += maxBlock) {
    const chunk2 = rawBuf.slice(i, Math.min(i + maxBlock, rawBuf.length));
    const isLast = (i + maxBlock >= rawBuf.length) ? 1 : 0;
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16LE(chunk2.length, 0);
    const notLenBuf = Buffer.alloc(2);
    notLenBuf.writeUInt16LE(~chunk2.length & 0xFFFF, 0);
    blocks.push(Buffer.concat([Buffer.from([isLast]), lenBuf, notLenBuf, chunk2]));
  }

  // zlib header + data + adler32
  const zlibData = Buffer.concat([Buffer.from([0x78, 0x01]), ...blocks]);
  const adler = (() => {
    let a = 1, b = 0;
    for (let i = 0; i < rawBuf.length; i++) { a = (a + rawBuf[i]) % 65521; b = (b + a) % 65521; }
    return ((b << 16) | a) >>> 0;
  })();
  const adlerBuf = Buffer.alloc(4);
  adlerBuf.writeUInt32BE(adler, 0);
  const idat = Buffer.concat([zlibData, adlerBuf]);

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function drawIcon(x, y, size) {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 1;
  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

  if (dist <= r) {
    // Blue circle
    return [31, 111, 235, 255];
  } else {
    return [0, 0, 0, 0];
  }
}

const iconsDir = path.join(__dirname, 'icons');
const sizes = [
  { name: 'icon16.png', size: 16 },
  { name: 'icon48.png', size: 48 },
  { name: 'icon128.png', size: 128 },
];

sizes.forEach(({ name, size }) => {
  const buf = createPNG(size, (x, y, s) => {
    const cx = s / 2, cy = s / 2;
    const r = s / 2 - 1;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (dist <= r) {
      return [31, 111, 235, 255]; // Blue circle
    }
    return [0, 0, 0, 0];
  });
  fs.writeFileSync(path.join(iconsDir, name), buf);
  console.log(`Created ${name} (${size}x${size})`);
});

console.log('Done!');
