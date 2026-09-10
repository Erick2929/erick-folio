// Generates the site icon from a 16×16 pixel-art grid: a black hole with the initials E S.
// Writes static/favicon.svg, favicon-32.png, favicon.ico and apple-touch-icon.png.
// Run: node scripts/make-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const PALETTE = {
  '.': null,                    // transparent
  '#': [10, 12, 18, 255],       // tile background
  'k': [0, 0, 0, 255],          // the shadow
  'r': [242, 165, 65, 255],     // accretion ring
  'h': [255, 224, 170, 255],    // ring, beamed side (hot)
  'd': [170, 92, 26, 255],      // ring, receding side (dim)
  'w': [236, 228, 211, 255],    // letters
}

const SIZE = 16
const CENTER = (SIZE - 1) / 2

// Ring + shadow from geometry, letters stamped on top.
function buildGrid() {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill('#'))
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - CENTER
      const dy = y - CENTER
      const dist = Math.hypot(dx, dy)
      if (dist < 5.4) grid[y][x] = 'k'
      else if (dist < 6.6) grid[y][x] = dx - dy > 2.5 ? 'h' : dx - dy < -2.5 ? 'd' : 'r'
    }
  }
  // Rounded tile: drop the four corner pixels.
  for (const [x, y] of [[0, 0], [SIZE - 1, 0], [0, SIZE - 1], [SIZE - 1, SIZE - 1]]) grid[y][x] = '.'

  const E = ['www', 'w..', 'www', 'w..', 'www']
  const S = ['www', 'w..', 'www', '..w', 'www']
  const stamp = (glyph, ox, oy) => glyph.forEach((row, j) => [...row].forEach((c, i) => { if (c === 'w') grid[oy + j][ox + i] = 'w' }))
  stamp(E, 4, 5)
  stamp(S, 9, 5)
  return grid
}

// ---------- PNG ----------
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** Renders the grid scaled by `scale` (nearest neighbour). `opaque` fills the corners too. */
function png(grid, scale, { opaque = false } = {}) {
  const w = SIZE * scale
  const rows = []
  for (let y = 0; y < w; y++) {
    const row = Buffer.alloc(1 + w * 4)
    for (let x = 0; x < w; x++) {
      let px = PALETTE[grid[Math.floor(y / scale)][Math.floor(x / scale)]]
      if (!px && opaque) px = PALETTE['#']
      const [r, g, b, a] = px || [0, 0, 0, 0]
      row.set([r, g, b, a], 1 + x * 4)
    }
    rows.push(row)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(w, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** ICO container holding one PNG image (supported since Windows Vista and by every browser). */
function ico(pngBuffer, size) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4)
  const entry = Buffer.alloc(16)
  entry[0] = size === 256 ? 0 : size; entry[1] = size === 256 ? 0 : size
  entry[2] = 0; entry[3] = 0
  entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(pngBuffer.length, 8); entry.writeUInt32LE(22, 12)
  return Buffer.concat([header, entry, pngBuffer])
}

function svg(grid) {
  const rgb = (px) => `rgb(${px[0]},${px[1]},${px[2]})`
  const rects = []
  grid.forEach((row, y) => row.forEach((c, x) => { if (PALETTE[c]) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${rgb(PALETTE[c])}"/>`) }))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges">\n${rects.join('\n')}\n</svg>\n`
}

const grid = buildGrid()
mkdirSync('static', { recursive: true })
writeFileSync('static/favicon.svg', svg(grid))
writeFileSync('static/favicon-32.png', png(grid, 2))
writeFileSync('static/favicon.ico', ico(png(grid, 2), 32))
writeFileSync('static/apple-touch-icon.png', png(grid, 11, { opaque: true }))   // 176px, iOS scales it
console.log(grid.map(r => r.join('')).join('\n'))
console.log('icons written to static/')
