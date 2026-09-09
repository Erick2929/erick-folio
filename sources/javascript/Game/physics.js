// Pure flight-physics helpers shared by the ship, the HUD and the tests.
// Nothing in here touches three.js or the DOM so it can run under node --test.

/** Upper bound for time dilation near the horizon. Keeps the Earth clock dramatic but finite. */
export const DILATION_CAP = 3.0e6

/**
 * Gravitational pull (units/s²) at distance `r` from the singularity.
 * Inverse-square law, saturated at `cap` inside the horizon so the ship never gets an
 * uncontrollable kick when it clips the event horizon.
 */
export function gravityStrength(r, { mu, rs, cap }) {
  const d = Math.max(r, rs)
  return Math.min(cap, mu / (d * d))
}

/**
 * How much faster Earth clocks run than the ship clock at distance `r` from the horizon `rs`.
 * Story-scaled, not Schwarzschild: 1 far away, rising steeply inside ~4 horizon radii and
 * capped so ten seconds at the horizon costs about a year on Earth.
 */
export function timeDilation(r, rs) {
  const proximity = 1 - (r - rs) / (4 * rs)
  const t = Math.min(1, Math.max(0, proximity))
  return Math.min(DILATION_CAP, 1 + DILATION_CAP * t * t * t * t)
}

/**
 * Advances a scan. Progress fills at 1/duration per second while the target is in range and
 * drains twice as fast when it is not, always staying within [0, 1].
 */
export function scannerProgress(current, inRange, dt, duration) {
  const rate = inRange ? dt / duration : -2 * dt / duration
  return Math.min(1, Math.max(0, current + rate))
}

/**
 * Heat factor (0..1) for a position expressed in the accretion disk's local frame
 * (disk lies on the XZ plane, Y is its normal). One deep inside the plasma, fading to
 * zero across the disk's half-thickness and outside its radial band.
 */
export function diskHeat(localPos, { inner, outer, halfThickness }) {
  const radial = Math.hypot(localPos.x, localPos.z)
  if (radial < inner || radial > outer) return 0
  const vertical = Math.abs(localPos.y)
  if (vertical >= halfThickness) return 0
  return 1 - vertical / halfThickness
}
