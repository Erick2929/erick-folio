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
    const required = this.game.run.objectives.filter((o) => o.required)
    const done = required.filter((o) => o.done).length
    const total = required.length

    const d = scannable.data
    const isEducation = !!d.school
    const isProject = scannable.kind === 'satellite'
    const isTrophy = scannable.kind === 'trophy'
    el.tag.textContent = isTrophy ? '// ARTIFACT SCAN · HONORS'
      : isProject ? '// SATELLITE SCAN · SIDE PROJECT'
      : scannable.kind === 'station' ? `// DOCKING COMPLETE · LOG ENTRY ${Math.min(done, total)}/${total}`
      : `// LOG ENTRY ${Math.min(done, total)}/${total} · SCAN COMPLETE`
    // Recruiters read the headline first: the degree for education, the company for jobs,
    // then the role in bright type, then dates.
    el.title.textContent = (isEducation ? d.degree : (d.company || d.name || '')).toUpperCase()
    const role = isEducation ? d.school : d.role
    el.meta.innerHTML = `<span class="log-role">${esc(role)}</span><br><span class="log-when">${esc(d.period)}${d.location ? ' · ' + esc(d.location) : ''}</span>`
    el.summary.textContent = d.summary
    el.highlights.innerHTML = (d.highlights || []).map((h) => `<li>${esc(h)}</li>`).join('')
    el.skills.innerHTML = (d.skills || []).map((s) => `<span class="chip">${esc(s)}</span>`).join('')
    if (d.link) { el.link.href = d.link; el.link.textContent = d.linkLabel || 'VISIT →'; el.link.classList.remove('hidden') } else el.link.classList.add('hidden')

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
