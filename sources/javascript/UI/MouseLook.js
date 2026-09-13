import Experience from '../Experience.js'
import { isTouchDevice } from '../utils/device.js'

/**
 * Pointer-lock management, FPS style: the mouse is captured while flying and released whenever
 * a menu or dialog needs the cursor. Clicking the view (or closing the overlay that freed it)
 * captures it again. A hint shows while the ship is flyable but the mouse is free.
 */
export default class MouseLook {
  constructor() {
    const exp = Experience.getInstance()
    this._exp = exp
    this.input = exp.input
    this.game = exp.game
    this.canvas = exp.canvas
    this.hint = document.getElementById('lock-hint')
    this.enabled = !isTouchDevice() && this.input.lockSupported
    if (!this.enabled) return

    this._wasLocked = false
    this._autoPausedAt = -Infinity
    this.canvas.addEventListener('click', () => this.lock())
    ;['launch', 'restart', 'freeflight'].forEach((name) => this.game.events.on(name, () => this.lock()))
    this.game.events.on('finale', () => this.unlock())
    document.addEventListener('pointerlockchange', () => this._onLockChange())
    exp.ticker.events.on('tick', () => this._update(), 14)
  }

  /**
   * Esc is the browser's own way out of pointer lock, so losing the lock mid-flight is the
   * player asking for the menu. The Esc keydown may still reach the page right after, so the
   * pause menu ignores Escape for a moment (`escapeShielded`) instead of closing again.
   */
  _onLockChange() {
    const locked = this.input.locked
    const lost = this._wasLocked && !locked
    this._wasLocked = locked
    if (!lost || this.game.overlayOpen || !this.game.run.running) return
    this._autoPausedAt = performance.now()
    this._exp.pauseMenu?.open()
  }

  get escapeShielded() { return performance.now() - this._autoPausedAt < 400 }

  get active() { return this.input.locked }

  lock() {
    if (!this.enabled || !this.input.wantsLock || !this.game.run.running || this.game.overlayOpen) return
    if (document.pointerLockElement === this.canvas) return
    // Rejections (no user gesture, embedded documents) surface as `pointerlockerror`; the hint covers them.
    try {
      const result = this.canvas.requestPointerLock()
      if (result && typeof result.catch === 'function') result.catch(() => {})
    } catch { /* unsupported */ }
  }

  unlock() {
    if (document.pointerLockElement) document.exitPointerLock?.()
  }

  /** The pointer stays captured only while the ship is flyable; the finale and any overlay free it. */
  _update() {
    const flyable = this.game.run.running && !this.game.overlayOpen
    if (!flyable && this.input.locked) this.unlock()
    const free = flyable && this.input.wantsLock && !this.input.locked
    this.hint.classList.toggle('hidden', !free)
  }
}
