// Deterministic 2D value noise for procedural textures. Seeded so every load looks the same.

const hash = (x, y, seed) => {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  h = h ^ (h >>> 16)
  return ((h >>> 0) % 1000003) / 1000003
}

const smooth = (t) => t * t * (3 - 2 * t)

export function valueNoise(x, y, seed = 0) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = smooth(x - x0)
  const fy = smooth(y - y0)
  const a = hash(x0, y0, seed)
  const b = hash(x0 + 1, y0, seed)
  const c = hash(x0, y0 + 1, seed)
  const d = hash(x0 + 1, y0 + 1, seed)
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy
}

export function fbm(x, y, seed = 0, octaves = 4) {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise(x * frequency, y * frequency, seed + i * 31)
    amplitude *= 0.5
    frequency *= 2.03
  }
  return value
}
