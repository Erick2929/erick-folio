// Pure volume math shared by the audio engine, the sliders and the tests.

export const DEFAULT_VOLUMES = { master: 0.55, music: 1, sfx: 1 }
const DUCK = 0.35

export const clampVolume = (v) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0))

/**
 * Final output levels. `music` is the media element volume (0..1); `sfx` is the gain of the
 * Web Audio bus. Muting zeroes both; ducking (a dialog is open) only pulls the music down.
 */
export function mixLevels({ master, music, sfx, muted = false, ducked = false }, musicBase = 0.3) {
  if (muted) return { music: 0, sfx: 0 }
  const m = clampVolume(master)
  return {
    music: musicBase * m * clampVolume(music) * (ducked ? DUCK : 1),
    sfx: m * clampVolume(sfx),
  }
}

/** Keyboard nudges: tenths, rounded, clamped. */
export function stepVolume(v, delta) {
  return clampVolume(Math.round((clampVolume(v) + delta) * 10) / 10)
}
