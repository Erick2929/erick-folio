import Events from './Events.js'
import { isTouchDevice } from './utils/device.js'

/**
 * Viewport size and pixel ratio, with a 'resize' event.
 *
 * Phones report stale dimensions at the moment `resize` / `orientationchange` fire, so every
 * signal re-measures again shortly after, and a cheap watchdog compares the window to the last
 * measurement twice a second. That is what keeps the 3D frame matched to the screen after a
 * rotation without a reload.
 */
export default class Sizes {
  constructor() {
    this.events = new Events()
    this.measure()
    const schedule = () => {
      this._check()
      setTimeout(() => this._check(), 120)
      setTimeout(() => this._check(), 450)
    }
    window.addEventListener('resize', schedule)
    window.addEventListener('orientationchange', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    setInterval(() => this._check(), 500)
  }

  get portrait() { return this.height > this.width }

  measure() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    // Phones and tablets render at 1x: the post-processing chain is the expensive part.
    this.pixelRatio = Math.min(window.devicePixelRatio, isTouchDevice() ? 1 : 1.5)
    this.ratio = this.width / this.height
  }

  _check() {
    if (window.innerWidth === this.width && window.innerHeight === this.height) return
    this.measure()
    this.events.trigger('resize')
  }
}
