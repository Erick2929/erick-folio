import Experience from '../Experience.js'
import { isTouchDevice } from '../utils/device.js'

/**
 * The black-hole cursor and the steering line. Replaces the native pointer on desktop: a tiny
 * event horizon that follows the mouse, swells over clickable things, and while the cursor is
 * steering the ship draws a faint line back to the reticle so the mechanic reads at a glance.
 */
export default class Cursor {
  constructor() {
    const exp = Experience.getInstance()
    this.input = exp.input
    this.game = exp.game
    this.el = document.getElementById('cursor')
    this.line = document.getElementById('steer-line')
    this.enabled = !isTouchDevice()
    if (!this.enabled) { this.el.classList.add('hidden'); return }
    document.body.classList.add('mouse')

    this._x = window.innerWidth / 2
    this._y = window.innerHeight / 2
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return
      this._x = e.clientX
      this._y = e.clientY
      this.el.classList.remove('hidden')
    })
    document.addEventListener('mouseleave', () => this.el.classList.add('hidden'))
    window.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch') this._click() })

    exp.ticker.events.on('tick', () => this._update(), 13)
  }

  _click() {
    this.el.classList.remove('click')
    void this.el.offsetWidth
    this.el.classList.add('click')
  }

  _update() {
    this.el.style.transform = `translate(${this._x}px, ${this._y}px)`
    const overUi = this.input.mouse.overUi
    this.el.classList.toggle('interactive', overUi)

    const steer = this.game.run.running ? this.input.steer : { yaw: 0, pitch: 0 }
    const steering = Math.abs(steer.yaw) + Math.abs(steer.pitch) > 0
    this.el.classList.toggle('steering', steering)
    if (steering) {
      this.line.setAttribute('x1', window.innerWidth / 2)
      this.line.setAttribute('y1', window.innerHeight / 2)
      this.line.setAttribute('x2', this._x)
      this.line.setAttribute('y2', this._y)
      this.line.classList.remove('hidden')
    } else {
      this.line.classList.add('hidden')
    }
  }
}
