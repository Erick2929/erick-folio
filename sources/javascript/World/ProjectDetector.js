import Experience from '../Experience.js'

export default class ProjectDetector {
  constructor(city, ship) {
    this._city = city
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

    const buildings = this._city.getProjectBuildings()
    if (!buildings.length) return

    const shipX = this._ship.mesh.position.x
    const shipZ = this._ship.mesh.position.z

    const SHOW_DIST = 30
    const HIDE_DIST = 40

    let nearest = null
    let nearestDist = Infinity

    for (const b of buildings) {
      const dx = shipX - b.x
      const dz = shipZ - b.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = b
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
