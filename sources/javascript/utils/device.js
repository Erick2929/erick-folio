/**
 * Whether the touch UI should drive the game. `?touch=1` / `?touch=0` in the URL force it either
 * way, which is handy for trying the mobile layout on a desktop browser.
 */
export function isTouchDevice() {
  const forced = new URLSearchParams(window.location.search).get('touch')
  if (forced === '1') return true
  if (forced === '0') return false
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  return coarse || (navigator.maxTouchPoints ?? 0) > 1
}

/** Small haptic tick where the platform supports it (Android). Silent elsewhere. */
export function buzz(ms = 12) {
  try { navigator.vibrate?.(ms) } catch { /* unsupported */ }
}
