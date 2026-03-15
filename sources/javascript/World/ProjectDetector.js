import Experience from '../Experience.js'

export default class ProjectDetector {
  constructor(galaxy, ship) {
    this._galaxy = galaxy
    this._ship = ship
    this._enabled = true
    this._currentProject = null
    this._lastChange = 0

    this._dialog = document.getElementById('project-dialog')
    this._nameEl = document.getElementById('project-name')
    this._descEl = document.getElementById('project-desc')
    this._stackEl = document.getElementById('project-stack')
    this._linkEl = document.getElementById('project-link')
    this._githubEl = document.getElementById('project-github')

    document.getElementById('project-close')?.addEventListener('click', () => {
      this._hideDialog()
      this._currentProject = null
      // Cooldown so it doesn't re-trigger immediately
      this._lastChange = Date.now()
    })

    const exp = Experience.getInstance()
    exp.ticker.events.on('tick', () => this._update(), 15)
  }

  enable() { this._enabled = true }

  disable() {
    this._enabled = false
    this._hideDialog()
    this._currentProject = null
  }

  toggle() {
    if (this._enabled) this.disable()
    else this.enable()
    return this._enabled
  }

  _update() {
    if (!this._enabled) return
    if (!this._ship?.mesh) return

    const now = Date.now()
    if (now - this._lastChange < 500) return

    const planets = this._galaxy.getProjectPlanets()
    if (!planets.length) return

    const shipPos = this._ship.mesh.position

    const SHOW_DIST = 20
    const HIDE_DIST = 30

    let nearest = null
    let nearestDist = Infinity

    for (const p of planets) {
      const dx = shipPos.x - p.x
      const dy = shipPos.y - p.y
      const dz = shipPos.z - p.z
      const surfaceDist = Math.sqrt(dx * dx + dy * dy + dz * dz) - (p.radius ?? 0)
      if (surfaceDist < nearestDist) {
        nearestDist = surfaceDist
        nearest = p
      }
    }

    if (nearest && nearestDist < SHOW_DIST) {
      if (this._currentProject !== nearest.project) {
        this._currentProject = nearest.project
        this._showDialog(nearest.project)
        this._lastChange = now
      }
    } else if (nearestDist > HIDE_DIST && this._currentProject) {
      this._currentProject = null
      this._hideDialog()
      this._lastChange = now
    }
  }

  _showDialog(project) {
    if (!this._dialog) return
    this._nameEl.textContent = project.name
    this._descEl.textContent = project.description

    this._stackEl.innerHTML = ''
    for (const tech of project.stack) {
      const chip = document.createElement('span')
      chip.className = 'stack-chip'
      chip.textContent = tech
      this._stackEl.appendChild(chip)
    }

    if (project.link) {
      this._linkEl.href = project.link
      this._linkEl.style.display = ''
    } else {
      this._linkEl.style.display = 'none'
    }

    if (project.github) {
      this._githubEl.href = project.github
      this._githubEl.style.display = ''
    } else {
      this._githubEl.style.display = 'none'
    }

    this._dialog.classList.remove('hidden')
  }

  _hideDialog() {
    this._dialog?.classList.add('hidden')
  }
}
