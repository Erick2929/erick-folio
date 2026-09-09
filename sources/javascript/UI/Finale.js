import Experience from '../Experience.js'
import { formatShipTime, formatEarthTime } from './Intro.js'
import { PROFILE } from '../data/profile.js'

const TUNNEL_LAYERS = 16

/**
 * Crossing the horizon: white-out, a tesseract tunnel drawn on a 2D canvas, then the
 * transmission with the run's stats and contact links.
 *
 * The tunnel is plain canvas drawing on purpose: CSS 3D transforms flash when layers cross the
 * perspective plane and compositors keep repainting them, which read as flicker behind the card.
 */
export default class Finale {
  constructor() {
    const exp = Experience.getInstance()
    this._exp = exp
    this.game = exp.game
    this.renderer = exp.renderer
    this.el = {
      root: document.getElementById('finale'),
      transmission: document.getElementById('transmission'),
      tunnel: document.getElementById('tesseract'),
      ship: document.getElementById('tx-ship'),
      earth: document.getElementById('tx-earth'),
      frags: document.getElementById('tx-frags'),
      score: document.getElementById('tx-score'),
      best: document.getElementById('tx-best'),
      ach: document.getElementById('tx-ach'),
      contact: document.getElementById('tx-contact'),
    }
    const L = PROFILE.links
    this.el.contact.innerHTML = `
      <a href="mailto:${L.email}">EMAIL</a>
      <a href="${L.linkedin}" target="_blank" rel="noopener">LINKEDIN</a>
      <a href="${L.github}" target="_blank" rel="noopener">GITHUB</a>
      <a href="${L.site}" target="_blank" rel="noopener">ERICKSILLER.COM</a>
    `
    this._ctx = this.el.tunnel.getContext('2d')
    this._tunnelRunning = false
    this._calm = false
    this._speed = 0.11

    document.getElementById('btn-freeflight').addEventListener('click', () => this._exit(() => this.game.freeFlight()))
    document.getElementById('btn-replay').addEventListener('click', () => this._exit(() => this.game.restart()))
    window.addEventListener('resize', () => { if (this._tunnelRunning) this._sizeTunnel() })
    this.game.events.on('finale', (summary) => this.play(summary))
  }

  play(summary) {
    const start = performance.now()
    const ramp = () => {
      const t = (performance.now() - start) / 2200
      this.game.setFlash(Math.min(1, t * t))
      this._exp.camera.addShake(0.08)
      if (t < 1) requestAnimationFrame(ramp)
      else {
        this._calm = false
        this.el.root.classList.remove('hidden', 'calm')
        this.el.transmission.classList.add('hidden')
        this._startTunnel()
        setTimeout(() => this.game.setFlash(0), 400)
        setTimeout(() => this._showTransmission(summary), 4200)
      }
    }
    ramp()
  }

  _sizeTunnel() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    this.el.tunnel.width = Math.round(window.innerWidth * dpr)
    this.el.tunnel.height = Math.round(window.innerHeight * dpr)
    this._dpr = dpr
  }

  _startTunnel() {
    this._sizeTunnel()
    this._tunnelRunning = true
    this._last = performance.now()
    const frame = (now) => {
      if (!this._tunnelRunning) return
      const dt = Math.min(0.05, (now - this._last) / 1000)
      this._last = now
      this._drawTunnel(dt)
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }

  _stopTunnel() { this._tunnelRunning = false }

  /** Receding squares with faint grid lines. Alpha fades to zero before a layer reaches the viewer. */
  _drawTunnel(dt) {
    const ctx = this._ctx
    const w = this.el.tunnel.width
    const h = this.el.tunnel.height
    const cx = w / 2
    const cy = h / 2
    const base = Math.max(w, h) * 0.55
    const dim = this._calm ? 0.28 : 1
    // Once the card is up the tunnel eases to a standstill so the backdrop is fully static.
    this._speed += ((this._calm ? 0 : 0.11) - this._speed) * Math.min(1, dt * 1.5)
    this._phase = ((this._phase || 0) + this._speed * dt) % 1

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.lineJoin = 'round'

    for (let i = 0; i < TUNNEL_LAYERS; i++) {
      const z = (i / TUNNEL_LAYERS + this._phase) % 1          // 0 = far, 1 = at the viewer
      const depth = 0.06 + (1 - z) * 1.6                        // perspective divisor
      const size = base / depth
      const fade = Math.sin(z * Math.PI)                        // in and out smoothly
      const alpha = fade * 0.55 * dim
      if (alpha < 0.01) continue
      const half = size / 2
      ctx.strokeStyle = `rgba(242, 165, 65, ${alpha.toFixed(3)})`
      ctx.lineWidth = Math.max(1, (1.5 + z * 2) * this._dpr)
      ctx.strokeRect(cx - half, cy - half, size, size)

      ctx.strokeStyle = `rgba(236, 228, 211, ${(alpha * 0.22).toFixed(3)})`
      ctx.lineWidth = Math.max(1, this._dpr)
      const cells = 6
      for (let k = 1; k < cells; k++) {
        const p = -half + (size * k) / cells
        ctx.beginPath()
        ctx.moveTo(cx + p, cy - half)
        ctx.lineTo(cx + p, cy + half)
        ctx.moveTo(cx - half, cy + p)
        ctx.lineTo(cx + half, cy + p)
        ctx.stroke()
      }
    }

    ctx.strokeStyle = `rgba(242, 165, 65, ${(0.18 * dim).toFixed(3)})`
    ctx.lineWidth = Math.max(1, this._dpr)
    const reach = base * 4
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + sx * reach, cy + sy * reach)
      ctx.stroke()
    }
  }

  _showTransmission(summary) {
    this._calm = true
    this.el.root.classList.add('calm')
    this.renderer.paused = true
    this.el.ship.textContent = formatShipTime(summary.shipTime)
    this.el.earth.textContent = formatEarthTime(summary.earthTime)
    this.el.frags.textContent = `${summary.fragments}/${summary.fragmentsTotal}`
    this.el.score.textContent = summary.score.toLocaleString()
    this.el.best.textContent = summary.isNewBest
      ? 'NEW BEST RUN'
      : `BEST · ${formatShipTime(summary.best.shipTime)} · ${summary.best.score.toLocaleString()} PTS`
    const ach = this.game.achievements
    this.el.ach.textContent = `ACHIEVEMENTS ${ach.count}/${ach.total} · PRESS ESC IN FLIGHT TO SEE THEM`
    this.el.transmission.classList.remove('hidden')
  }

  _exit(then) {
    this._stopTunnel()
    this.renderer.paused = false
    this.el.root.classList.add('hidden')
    this.game.setFlash(0)
    this.game.setFade(1)
    then()
  }
}
