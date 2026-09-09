import Experience from '../Experience.js'

/** The title screen. Launches the run or drops straight into the CV for people in a hurry. */
export default class Intro {
  constructor() {
    const exp = Experience.getInstance()
    this._exp = exp
    this._el = document.getElementById('title')
    this._best = document.getElementById('title-best')
    this._launched = false

    const best = exp.game.run.best
    if (best) this._best.textContent = `BEST RUN · ${formatShipTime(best.shipTime)} · ${best.fragments} FRAGMENTS · ${best.score.toLocaleString()} PTS`

    document.getElementById('btn-launch').addEventListener('click', () => this._launch())
    document.getElementById('btn-cv').addEventListener('click', () => this._launch({ cvMode: true }))
    exp.input.onKey('Enter', () => { if (!this._launched) this._launch() })
  }

  _launch(options = {}) {
    if (this._launched) return
    this._launched = true
    this._el.classList.add('hidden')
    document.getElementById('hud').classList.add('visible')
    this._exp.game.launch(options)
    if (options.cvMode) setTimeout(() => this._exp.panels.open('experience'), 600)
  }
}

export function formatShipTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Earth time can reach years near the horizon, so it scales its own units. */
export function formatEarthTime(seconds) {
  const YEAR = 365.25 * 24 * 3600
  const DAY = 24 * 3600
  if (seconds < DAY) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  const years = Math.floor(seconds / YEAR)
  const days = Math.floor((seconds % YEAR) / DAY)
  return years > 0 ? `${years}y ${days}d` : `${days}d ${Math.floor((seconds % DAY) / 3600)}h`
}
