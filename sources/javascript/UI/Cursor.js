import Experience from '../Experience.js'
import { isTouchDevice } from '../utils/device.js'

/**
 * The black-hole cursor: replaces the native pointer on desktop whenever the mouse is free
 * (title screen, menus, dialogs). While the pointer is locked for flight it disappears, like
 * any FPS. It swells over clickable things and pinches on click.
 */
export default class Cursor {
  constructor() {
    const exp = Experience.getInstance()
    this.input = exp.input
    this.el = document.getElementById('cursor')
    this.enabled = !isTouchDevice()
    if (!this.enabled) { this.el.classList.add('hidden'); return }
    document.body.classList.add('mouse')

    this._x = window.innerWidth / 2
    this._y = window.innerHeight / 2
    this._inside = false
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || this.input.locked) return
      this._x = e.clientX
      this._y = e.clientY
      this._inside = true
    })
    // Browsers put the pointer back where it was captured, which is the last position we saw.
    // Releasing the lock can also emit a stray mouseleave, so that signal is ignored briefly.
    this._unlockedAt = -Infinity
    document.addEventListener('mouseleave', () => { if (performance.now() - this._unlockedAt > 500) this._inside = false })
    document.addEventListener('pointerlockchange', () => { if (!this.input.locked) { this._inside = true; this._unlockedAt = performance.now() } })
    window.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') this._click() })

    exp.ticker.events.on('tick', () => this._update(), 13)
  }

  _click() {
    this.el.classList.remove('click')
    void this.el.offsetWidth
    this.el.classList.add('click')
  }

  _update() {
    const visible = this._inside && !this.input.locked
    this.el.classList.toggle('hidden', !visible)
    if (!visible) return
    this.el.style.transform = `translate(${this._x}px, ${this._y}px)`
    this.el.classList.toggle('interactive', this.input.mouse.overClickable)
  }
}
