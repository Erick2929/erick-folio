import Experience from '../Experience.js'

export default class HUD {
  constructor() {
    const exp = Experience.getInstance()
    this.ship = exp.ship
    this.ticker = exp.ticker
    this._exp = exp

    this._speedEl = document.getElementById('telem-speed')
    this._altEl = document.getElementById('telem-alt')
    this._vecEl = document.getElementById('telem-vec')

    this._initPanels()
    this._initFullscreen()
    this._initFreeFly()

    this.ticker.events.on('tick', () => this._updateTelemetry(), 10)
  }

  _initPanels() {
    document.querySelectorAll('.hud-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = 'panel-' + btn.dataset.panel
        const panel = document.getElementById(id)
        const isOpen = panel?.classList.contains('visible')
        document.querySelectorAll('.portfolio-panel').forEach(p => p.classList.remove('visible'))
        document.querySelectorAll('.hud-nav-btn').forEach(b => b.classList.remove('active'))
        if (!isOpen && panel) {
          panel.classList.add('visible')
          btn.classList.add('active')
        }
      })
    })

    document.querySelectorAll('.panel-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.portfolio-panel').classList.remove('visible')
        document.querySelectorAll('.hud-nav-btn').forEach(b => b.classList.remove('active'))
      })
    })
  }

  _initFullscreen() {
    const btn = document.getElementById('btn-fullscreen')
    if (!btn) return
    btn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      } else {
        document.exitFullscreen().catch(() => {})
      }
    })
  }

  _initFreeFly() {
    const btn = document.getElementById('btn-freefly')
    if (!btn) return
    btn.addEventListener('click', () => {
      const world = this._exp.world
      if (!world?.projectDetector) return
      const enabled = world.projectDetector.toggle()
      btn.textContent = enabled ? '[ FREE FLY ]' : '[ PROJECTS ON ]'
    })
  }

  _updateTelemetry() {
    if (!this.ship?.velocity || !this.ship?.mesh) return
    const v = this.ship.velocity
    const speed = Math.round(v.length() * 10)
    const alt = Math.round(this.ship.mesh.position.y)
    const vx = v.x.toFixed(1)
    const vz = v.z.toFixed(1)
    this._speedEl.textContent = String(speed).padStart(3, '0')
    this._altEl.textContent = String(alt).padStart(3, '0')
    this._vecEl.textContent = `${vx >= 0 ? '+' : ''}${vx} / ${vz >= 0 ? '+' : ''}${vz}`
  }
}
