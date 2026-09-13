const MOUSELOOK_KEY = 'event-horizon:mouselook'
const SENSITIVITY_KEY = 'event-horizon:sensitivity'
const UI_SELECTOR = 'button, a, input, select, textarea, label, .dialog, .portfolio-panel, .sound-panel, #pause, #finale, #title, #rotate-overlay'
const CLICKABLE_SELECTOR = 'button, a, input, select, textarea, label, [role="button"]'

const LOOK_SENSITIVITY = 0.0015   // radians per pixel of mouse travel while the pointer is locked
const LOOK_FRAME_CAP = 0.35       // radians per frame; a mouse jump can never flip the ship

/**
 * Turns keyboard, mouse and touch input into flight intent.
 *
 * On desktop the mouse steers FPS-style: while the pointer is locked to the canvas, mouse travel
 * rotates the ship directly (`consumeLook`). When pointer lock is unavailable the cursor's offset
 * from the screen centre steers instead (`cursorSteer`). Consumers read `yaw`, `pitch` (-1..1),
 * `thrust` (-0.35, 0, 1), `boost` (Shift or Space), `fire`, and poll `consumePulse()` for the
 * scanner pulse edge (R). One-shot keys are exposed through `onKey`. Touch feeds `touch` directly.
 */
export default class Input {
  constructor(canvas) {
    this.canvas = canvas
    this.keys = {}
    this.touch = { yaw: 0, pitch: 0, thrust: 0, boost: false, pulse: false, fire: false }
    this.pointerFire = false
    this.mouse = { x: 0, y: 0, offsetX: 0, offsetY: 0, inside: false, overUi: false, overClickable: false }
    this.mouseLook = readMouseLook()
    this.lockSupported = typeof canvas.requestPointerLock === 'function'
    this.locked = false
    this.sensitivityScale = readSensitivity()
    this._look = { dx: 0, dy: 0 }
    this.enabled = true
    this._pulseQueued = false
    this._keyHandlers = {}

    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === canvas; this._look.dx = 0; this._look.dy = 0 })
    document.addEventListener('pointerlockerror', () => { this.locked = false })
    window.addEventListener('mousemove', (e) => {
      if (!this.locked) return
      this._look.dx += e.movementX || 0
      this._look.dy += e.movementY || 0
    })

    window.addEventListener('keydown', (e) => this._onKeyDown(e))
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false })
    window.addEventListener('blur', () => { this.keys = {}; this.pointerFire = false })

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return
      this.mouse.x = e.clientX
      this.mouse.y = e.clientY
      this.mouse.inside = true
      const half = Math.max(1, window.innerHeight * 0.45)
      this.mouse.offsetX = clamp((e.clientX - window.innerWidth / 2) / half, -1, 1)
      this.mouse.offsetY = clamp((e.clientY - window.innerHeight / 2) / half, -1, 1)
      const target = e.target instanceof Element ? e.target : null
      this.mouse.overUi = !!(target && target.closest(UI_SELECTOR))
      this.mouse.overClickable = !!(target && target.closest(CLICKABLE_SELECTOR))
    })
    document.addEventListener('pointerleave', () => { this.mouse.inside = false })
    document.addEventListener('mouseleave', () => { this.mouse.inside = false })

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return
      // A click on the free view recaptures the mouse; it should not also fire.
      if (e.button === 0 && !(this.wantsLock && !this.locked)) this.pointerFire = true
    })
    const release = () => { this.pointerFire = false }
    window.addEventListener('pointerup', release)
    window.addEventListener('pointercancel', release)
  }

  /** Mouse look on or off (persisted). Keys keep working either way. */
  setMouseLook(on) {
    this.mouseLook = !!on
    try { localStorage.setItem(MOUSELOOK_KEY, this.mouseLook ? '1' : '0') } catch { /* private mode */ }
    if (!this.mouseLook && this.locked) document.exitPointerLock?.()
  }

  /** Whether the ship should currently be flown with a captured mouse. */
  /** Radians of turn per pixel of mouse travel: the base rate times the player's 0.2–3× scale. */
  get sensitivity() { return LOOK_SENSITIVITY * this.sensitivityScale }

  setSensitivity(scale) {
    this.sensitivityScale = clampSensitivity(scale)
    try { localStorage.setItem(SENSITIVITY_KEY, String(this.sensitivityScale)) } catch { /* private mode */ }
  }

  get wantsLock() { return this.mouseLook && this.lockSupported }

  /** Radians of yaw/pitch accumulated from mouse travel since the last frame. Resets on read. */
  consumeLook() {
    const out = this.enabled && this.locked ? mouseLook(this._look.dx, this._look.dy, this.sensitivity) : { yaw: 0, pitch: 0 }
    this._look.dx = 0
    this._look.dy = 0
    return out
  }

  /** Fallback steering when pointer lock is unavailable: the cursor's offset from the centre. */
  get steer() {
    if (!this.enabled || !this.mouseLook || this.lockSupported || !this.mouse.inside || this.mouse.overUi) return { yaw: 0, pitch: 0 }
    return cursorSteer(this.mouse.offsetX, this.mouse.offsetY)
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
    v += this.steer.yaw
    v += this.touch.yaw
    return clamp(v, -1, 1)
  }

  get pitch() {
    if (!this.enabled) return 0
    let v = 0
    if (this._down('ArrowUp', 'KeyQ')) v += 1
    if (this._down('ArrowDown', 'KeyE')) v -= 1
    v += this.steer.pitch
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

/**
 * Maps the cursor's offset from the screen centre (-1..1 per axis, in units of 45% of the
 * viewport height) to yaw/pitch. Nothing inside the dead zone, then a soft curve up to full
 * deflection. Cursor right of centre yaws right (negative), cursor above centre climbs (positive).
 */
export function cursorSteer(offsetX, offsetY, { deadZone = 0.12, curve = 1.4 } = {}) {
  const shape = (v) => {
    const a = Math.min(1, Math.abs(v))
    if (a <= deadZone) return 0
    const t = (a - deadZone) / (1 - deadZone)
    return Math.sign(v) * Math.pow(t, curve)
  }
  return { yaw: -shape(offsetX) || 0, pitch: -shape(offsetY) || 0 }
}

/** Mouse travel (pixels) to rotation (radians). Right yaws right (negative), up climbs (positive). */
export function mouseLook(dx, dy, sensitivity) {
  const cap = (v) => Math.max(-LOOK_FRAME_CAP, Math.min(LOOK_FRAME_CAP, v))
  return { yaw: cap(-dx * sensitivity) || 0, pitch: cap(-dy * sensitivity) || 0 }
}

export function clampSensitivity(scale) {
  const n = Number(scale)
  return Number.isFinite(n) ? Math.min(3, Math.max(0.2, n)) : 1
}

function readSensitivity() {
  try { return clampSensitivity(localStorage.getItem(SENSITIVITY_KEY) ?? 1) } catch { return 1 }
}

function readMouseLook() {
  try { return localStorage.getItem(MOUSELOOK_KEY) !== '0' } catch { return true }
}

/** Resolves the touch buttons into a thrust value: brake wins, then held thrust or cruise. */
export function touchThrust({ thrust = false, brake = false, cruise = false } = {}) {
  if (brake) return -0.35
  if (thrust || cruise) return 1
  return 0
}
