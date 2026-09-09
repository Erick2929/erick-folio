/**
 * Turns keyboard, pointer-drag and touch input into flight intent.
 *
 * Consumers read `yaw`, `pitch` (-1..1), `thrust` (-0.35, 0, 1), `boost` (Shift or Space)
 * and poll `consumePulse()` for the scanner pulse edge (R). One-shot keys (Escape, M, F, Enter)
 * are exposed through `onKey`. Touch controls feed `touch` directly.
 */
export default class Input {
  constructor(canvas) {
    this.keys = {}
    this.touch = { yaw: 0, pitch: 0, thrust: 0, boost: false, pulse: false, fire: false }
    this.pointerFire = false
    this.drag = { active: false, x0: 0, y0: 0, x: 0, y: 0 }
    this.enabled = true
    this._pulseQueued = false
    this._keyHandlers = {}

    window.addEventListener('keydown', (e) => this._onKeyDown(e))
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false })
    window.addEventListener('blur', () => { this.keys = {} })

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return
      if (e.button === 0) this.pointerFire = true
      this.drag.active = true
      this.drag.x0 = this.drag.x = e.clientX
      this.drag.y0 = this.drag.y = e.clientY
      canvas.setPointerCapture?.(e.pointerId)
    })
    canvas.addEventListener('pointermove', (e) => {
      if (!this.drag.active) return
      this.drag.x = e.clientX
      this.drag.y = e.clientY
    })
    const endDrag = () => { this.drag.active = false; this.pointerFire = false }
    canvas.addEventListener('pointerup', endDrag)
    canvas.addEventListener('pointercancel', endDrag)
  }

  _onKeyDown(e) {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyF'].includes(e.code)) e.preventDefault()
    const handlers = this._keyHandlers[e.code]
    if (handlers) handlers.forEach(h => h(e))
    if (!e.repeat && e.code === 'KeyR') this._pulseQueued = true
    this.keys[e.code] = true
  }

  /** Registers a one-shot handler for a key code (fires on every keydown, including repeats). */
  onKey(code, handler) {
    if (!this._keyHandlers[code]) this._keyHandlers[code] = []
    this._keyHandlers[code].push(handler)
  }

  _down(...codes) { return codes.some(c => this.keys[c]) }

  get yaw() {
    if (!this.enabled) return 0
    let v = 0
    if (this._down('KeyA', 'ArrowLeft')) v += 1
    if (this._down('KeyD', 'ArrowRight')) v -= 1
    if (this.drag.active) v -= clamp((this.drag.x - this.drag.x0) / 120, -1, 1)
    v += this.touch.yaw
    return clamp(v, -1, 1)
  }

  get pitch() {
    if (!this.enabled) return 0
    let v = 0
    if (this._down('ArrowUp', 'KeyQ')) v += 1
    if (this._down('ArrowDown', 'KeyE')) v -= 1
    if (this.drag.active) v -= clamp((this.drag.y - this.drag.y0) / 120, -1, 1)
    v += this.touch.pitch
    return clamp(v, -1, 1)
  }

  get thrust() {
    if (!this.enabled) return 0
    if (this._down('KeyW')) return 1
    if (this._down('KeyS')) return -0.35
    return this.touch.thrust
  }

  get boost() {
    if (!this.enabled) return false
    return this._down('ShiftLeft', 'ShiftRight', 'Space') || this.touch.boost
  }

  /** Blaster trigger: F, the left mouse button, or the touch FIRE button. */
  get fire() {
    if (!this.enabled) return false
    return this._down('KeyF') || this.pointerFire || this.touch.fire
  }

  /** True once per R press (or touch pulse button). */
  consumePulse() {
    const fired = this._pulseQueued || this.touch.pulse
    this._pulseQueued = false
    this.touch.pulse = false
    return this.enabled && fired
  }
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

/** Resolves the touch buttons into a thrust value: brake wins, then held thrust or cruise. */
export function touchThrust({ thrust = false, brake = false, cruise = false } = {}) {
  if (brake) return -0.35
  if (thrust || cruise) return 1
  return 0
}
