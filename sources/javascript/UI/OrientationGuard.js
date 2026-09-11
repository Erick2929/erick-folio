import Experience from '../Experience.js'
import { isTouchDevice } from '../utils/device.js'

const DISMISS_KEY = 'event-horizon:portrait-ok'

/**
 * On touch devices held upright, covers the page with a "turn your phone sideways" prompt and
 * pauses a running game until the device is rotated. "Continue in portrait" dismisses it for
 * the session.
 */
export default class OrientationGuard {
  constructor() {
    const exp = Experience.getInstance()
    this.sizes = exp.sizes
    this.game = exp.game
    this.el = document.getElementById('rotate-overlay')
    this.enabled = isTouchDevice()
    this.shown = false
    this._pausedRun = false
    this.dismissed = readDismissed()
    if (!this.enabled) return

    document.getElementById('rotate-continue').addEventListener('click', () => this.dismiss())
    this.sizes.events.on('resize', () => this.evaluate())
    this.game.events.on('launch', () => this.evaluate())
    this.evaluate()
  }

  get portrait() { return this.sizes.portrait }

  dismiss() {
    this.dismissed = true
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ }
    this.evaluate()
  }

  evaluate() {
    if (!this.enabled) return
    const show = this.portrait && !this.dismissed
    if (show === this.shown) return
    this.shown = show
    this.el.classList.toggle('hidden', !show)
    if (show) {
      if (this.game.run.running) {
        this._pausedRun = true
        this.game.setOverlay(true)
      }
    } else if (this._pausedRun) {
      this._pausedRun = false
      this.game.setOverlay(false)
    }
  }
}

function readDismissed() {
  try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
}
