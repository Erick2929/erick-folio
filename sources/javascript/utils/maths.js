export const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
export const lerp = (a, b, t) => a + (b - a) * t
export const remap = (value, inMin, inMax, outMin, outMax) =>
  outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
export const randFloat = (min, max) => min + Math.random() * (max - min)
export const randInt = (min, max) => Math.floor(randFloat(min, max + 1))
