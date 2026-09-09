import Experience from '../Experience.js'
import { esc } from './Panels.js'

/** The log entry that pops up after a scan or docking. Pauses the run until dismissed. */
export default class Dialog {
  constructor() {
    const exp = Experience.getInstance()
    this._exp = exp
    this.game = exp.game
    this.el = {
      root: document.getElementById('log-dialog'),
      tag: document.getElementById('log-tag'),
      title: document.getElementById('log-title'),
      meta: document.getElementById('log-meta'),
      summary: document.getElementById('log-summary'),
      highlights: document.getElementById('log-highlights'),
      skills: document.getElementById('log-skills'),
      link: document.getElementById('log-link'),
      cont: document.getElementById('log-continue'),
    }
    this._openFor = null

    this.el.cont.addEventListener('click', () => this.close())
    exp.input.onKey('Enter', () => { if (this.isOpen) this.close() })
    this.game.events.on('scan', (scannable) => setTimeout(() => this.show(scannable), 350))
  }

  get isOpen() { return this._openFor !== null }

  show(scannable) {
    const el = this.el
    const done = this.game.run.objectivesDone
    const total = this.game.run.objectives.filter((o) => o.required).length

    if (scannable.kind === 'station') {
      const entries = scannable.data
      el.tag.textContent = `// DOCKING COMPLETE · EDUCATION`
      el.title.textContent = 'TECNOLÓGICO DE MONTERREY'
      el.meta.innerHTML = entries.map((e) => `${esc(e.degree)} · ${esc(e.period)}`).join('<br>')
      el.summary.textContent = entries[0].detail
      el.highlights.innerHTML = entries.slice(1).map((e) => `<li>${esc(e.degree)} — ${esc(e.detail)}</li>`).join('')
      el.skills.innerHTML = entries.flatMap((e) => e.skills).map((s) => `<span class="chip on">${esc(s)}</span>`).join('')
      el.link.classList.add('hidden')
    } else {
      const d = scannable.data
      const isProject = scannable.kind === 'satellite'
      el.tag.textContent = isProject ? `// SATELLITE SCAN · SIDE PROJECT` : `// LOG ENTRY ${Math.min(done, total)}/${total} · SCAN COMPLETE`
      el.title.textContent = (d.company || d.name || '').toUpperCase()
      el.meta.innerHTML = `${esc(d.role)}<br>${esc(d.period)}${d.location ? ' · ' + esc(d.location) : ''}`
      el.summary.textContent = d.summary
      el.highlights.innerHTML = (d.highlights || []).map((h) => `<li>${esc(h)}</li>`).join('')
      el.skills.innerHTML = (d.skills || []).map((s) => `<span class="chip">${esc(s)}</span>`).join('')
      if (d.link) { el.link.href = d.link; el.link.classList.remove('hidden') } else el.link.classList.add('hidden')
    }

    el.root.classList.remove('hidden')
    if (!this._openFor) this.game.setOverlay(true)
    this._openFor = scannable
  }

  close() {
    if (!this._openFor) return
    this.el.root.classList.add('hidden')
    this._openFor = null
    this.game.setOverlay(false)
  }
}
