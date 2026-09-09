import Experience from '../Experience.js'
import { touchThrust } from '../Input.js'
import { isTouchDevice } from '../utils/device.js'

const STICK_RADIUS = 44

/**
 * Touch flight controls: a floating stick anywhere on the left side of the screen, hold buttons
 * for thrust, boost and brake, a tap for the scanner pulse and a CRUISE toggle that keeps the
 * ship flying so one thumb can steer. Only wired on touch devices (or with `?touch=1`).
 */
export default class TouchControls {
  constructor() {
    const exp = Experience.getInstance()
    this.input = exp.input
    this.enabled = isTouchDevice()
    this.root = document.getElementById('touch')
    if (!this.enabled) return

    document.body.classList.add('touch')
    exp.game.events.on('launch', () => this.root.classList.remove('hidden'))
    this.root.addEventListener('contextmenu', (e) => e.preventDefault())
    this.state = { thrust: false, brake: false, cruise: false, boost: false }

    this._steer()
    this._buttons()
  }

  _sync() {
    this.input.touch.thrust = touchThrust(this.state)
    this.input.touch.boost = this.state.boost
  }

  _steer() {
    const zone = document.getElementById('touch-steer')
    const pad = document.getElementById('joystick')
    const knob = document.getElementById('joystick-knob')
    let active = null
    let origin = { x: 0, y: 0 }

    const place = (e) => {
      const rect = zone.getBoundingClientRect()
      origin = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      pad.style.left = origin.x + 'px'
      pad.style.top = origin.y + 'px'
      pad.classList.add('active')
    }
    const update = (e) => {
      const rect = zone.getBoundingClientRect()
      const dx = e.clientX - rect.left - origin.x
      const dy = e.clientY - rect.top - origin.y
      const len = Math.hypot(dx, dy) || 1
      const clamped = Math.min(len, STICK_RADIUS)
      const nx = (dx / len) * clamped
      const ny = (dy / len) * clamped
      knob.style.transform = `translate(${nx}px, ${ny}px)`
      this.input.touch.yaw = -nx / STICK_RADIUS
      this.input.touch.pitch = -ny / STICK_RADIUS
    }
    const release = () => {
      active = null
      pad.classList.remove('active')
      knob.style.transform = ''
      this.input.touch.yaw = 0
      this.input.touch.pitch = 0
    }

    zone.addEventListener('pointerdown', (e) => {
      if (active !== null) return
      e.preventDefault()
      active = e.pointerId
      zone.setPointerCapture?.(e.pointerId)
      place(e)
      update(e)
    })
    zone.addEventListener('pointermove', (e) => { if (e.pointerId === active) update(e) })
    zone.addEventListener('pointerup', (e) => { if (e.pointerId === active) release() })
    zone.addEventListener('pointercancel', (e) => { if (e.pointerId === active) release() })
    zone.addEventListener('lostpointercapture', (e) => { if (e.pointerId === active) release() })
  }

  _hold(id, key) {
    const btn = document.getElementById(id)
    const set = (on) => (e) => {
      e.preventDefault()
      this.state[key] = on
      btn.classList.toggle('on', on)
      this._sync()
    }
    btn.addEventListener('pointerdown', set(true))
    btn.addEventListener('pointerup', set(false))
    btn.addEventListener('pointercancel', set(false))
    btn.addEventListener('pointerleave', set(false))
  }

  _buttons() {
    this._hold('touch-thrust', 'thrust')
    this._hold('touch-brake', 'brake')
    this._hold('touch-boost', 'boost')

    // FIRE: hold to shoot, a quick tap also sends a scanner pulse.
    const fire = document.getElementById('touch-pulse')
    let downAt = 0
    const release = (e) => {
      e.preventDefault()
      if (!this.input.touch.fire) return
      this.input.touch.fire = false
      fire.classList.remove('on')
      if (performance.now() - downAt < 220) this.input.touch.pulse = true
    }
    fire.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      downAt = performance.now()
      this.input.touch.fire = true
      fire.classList.add('on')
    })
    fire.addEventListener('pointerup', release)
    fire.addEventListener('pointercancel', release)
    fire.addEventListener('pointerleave', release)

    const cruise = document.getElementById('touch-cruise')
    cruise.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      this.state.cruise = !this.state.cruise
      cruise.classList.toggle('on', this.state.cruise)
      cruise.textContent = this.state.cruise ? 'CRUISE ON' : 'CRUISE'
      this._sync()
    })
  }
}
