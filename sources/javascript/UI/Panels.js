import Experience from '../Experience.js'
import { PROFILE, EXPERIENCE, EDUCATION, PROJECTS, SKILL_GROUPS, HIDDEN_FRAGMENTS } from '../data/profile.js'

/**
 * The CV, readable without playing: about, experience, projects, skills, education, contact.
 * Built once from the profile data; scanned chapters and collected skills light up as the run goes.
 */
export default class Panels {
  constructor() {
    const exp = Experience.getInstance()
    this._exp = exp
    this.game = exp.game
    this.open_ = null

    this._build()
    document.querySelectorAll('.panel-close').forEach((btn) => btn.addEventListener('click', () => this.close()))
    this.game.events.on('scan', (scannable) => this._markLogged(scannable))
    this.game.events.on('fragment', () => this._syncSkills())
    this.game.events.on('start', () => { this._syncSkills(); this._clearLogged() })
  }

  get isOpen() { return this.open_ !== null }

  toggle(name) {
    if (this.open_ === name) this.close()
    else this.open(name)
  }

  open(name) {
    const panel = document.getElementById('panel-' + name)
    if (!panel) return
    const wasOpen = this.open_ !== null
    document.querySelectorAll('.portfolio-panel').forEach((p) => p.classList.remove('visible'))
    document.querySelectorAll('.hud-nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.panel === name))
    panel.classList.add('visible')
    this.open_ = name
    if (!wasOpen) this.game.setOverlay(true)
  }

  close() {
    if (this.open_ === null) return
    document.querySelectorAll('.portfolio-panel').forEach((p) => p.classList.remove('visible'))
    document.querySelectorAll('.hud-nav-btn').forEach((b) => b.classList.remove('active'))
    this.open_ = null
    this.game.setOverlay(false)
  }

  _body(name) { return document.querySelector(`#panel-${name} .panel-body`) }

  _build() {
    this._body('about').innerHTML = `
      <div class="panel-meta">${esc(PROFILE.headline)}</div>
      ${PROFILE.about.map((p, i) => `<p class="${i === 0 ? 'panel-lead' : ''}">${esc(p)}</p>`).join('')}
      <p>${esc(PROFILE.location)} · ${esc(PROFILE.workMode)} · ${esc(PROFILE.connections)} connections on LinkedIn</p>
      <div class="skill-group"><span class="skill-label">TOP SKILLS</span><div class="chips">${PROFILE.topSkills.map((s) => chip(s)).join('')}</div></div>
      <div class="skill-group"><span class="skill-label">PROFICIENT</span><div class="chips">${PROFILE.proficient.map((s) => chip(s)).join('')}</div></div>
    `

    this._body('experience').innerHTML = EXPERIENCE.map((e) => `
      <div class="entry" data-entry="${e.id}">
        <span class="logged-tag hidden">LOGGED</span>
        <div class="entry-head"><span class="entry-title">${esc(e.company)}</span><span class="entry-period">${esc(e.period)}</span></div>
        <div class="entry-role">${esc(e.role)}<span class="entry-loc">${esc(e.location)}</span></div>
        <p>${esc(e.summary)}</p>
        <ul>${e.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
        <div class="chips">${e.skills.map((s) => chip(s)).join('')}</div>
      </div>
    `).join('')

    this._body('projects').innerHTML = PROJECTS.map((p) => `
      <div class="entry" data-entry="${p.id}">
        <span class="logged-tag hidden">LOGGED</span>
        <div class="entry-head"><span class="entry-title">${esc(p.name)}</span><span class="entry-period">${esc(p.period)}</span></div>
        <div class="entry-role">${esc(p.role)}</div>
        <p>${esc(p.summary)}</p>
        <ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
        <div class="chips">${p.skills.map((s) => chip(s)).join('')}</div>
        ${p.link ? `<p style="margin-top:10px"><a class="btn" href="${p.link}" target="_blank" rel="noopener">VISIT →</a></p>` : ''}
      </div>
    `).join('')

    const hidden = new Set(HIDDEN_FRAGMENTS.map((h) => h.skill))
    this._body('skills').innerHTML = `
      <div class="skills-progress" id="skills-progress"></div>
      ${SKILL_GROUPS.map((g) => `
        <div class="skill-group"><span class="skill-label">${esc(g.label)}</span>
          <div class="chips">${g.skills.map((s) => chip(s, hidden.has(s))).join('')}</div>
        </div>`).join('')}
      <p style="margin-top:14px;font-size:10px;letter-spacing:1px;color:var(--ink-faint)">Fragments light up as you collect them in flight. Dashed ones are hidden somewhere in the system.</p>
    `

    this._body('education').innerHTML = EDUCATION.map((e) => `
      <div class="entry" data-entry="${e.id}">
        <div class="entry-head"><span class="entry-title">${esc(e.school)}</span><span class="entry-period">${esc(e.period)}</span></div>
        <div class="entry-role">${esc(e.degree)}</div>
        <p>${esc(e.detail)}</p>
        ${e.skills.length ? `<div class="chips">${e.skills.map((s) => chip(s)).join('')}</div>` : ''}
      </div>
    `).join('')

    const L = PROFILE.links
    this._body('contact').innerHTML = `
      <p class="panel-lead">Open to senior engineering roles, AI systems work, and interesting problems. Based in ${esc(PROFILE.location)}, working remote.</p>
      <div class="contact-links">
        <a class="contact-item" href="mailto:${L.email}"><span class="contact-label">EMAIL</span><span>${esc(L.email)}</span></a>
        <a class="contact-item" href="${L.linkedin}" target="_blank" rel="noopener"><span class="contact-label">LINKEDIN</span><span>linkedin.com/in/ericksiller</span></a>
        <a class="contact-item" href="${L.github}" target="_blank" rel="noopener"><span class="contact-label">GITHUB</span><span>github.com/Erick2929</span></a>
        <a class="contact-item" href="${L.site}" target="_blank" rel="noopener"><span class="contact-label">SITE</span><span>ericksiller.com</span></a>
      </div>
    `
    this._syncSkills()
  }

  _syncSkills() {
    const collected = new Set(this.game.run.collectedSkills)
    document.querySelectorAll('#panel-skills .chip').forEach((c) => c.classList.toggle('on', collected.has(c.dataset.skill)))
    const progress = document.getElementById('skills-progress')
    if (progress) progress.textContent = `${collected.size} / ${this.game.run.fragmentsTotal} FRAGMENTS RECOVERED`
  }

  _markLogged(scannable) {
    const ids = Array.isArray(scannable.data) ? scannable.data.map((d) => d.id) : [scannable.data.id]
    for (const id of ids) {
      const entry = document.querySelector(`.entry[data-entry="${id}"]`)
      if (!entry) continue
      entry.classList.add('logged')
      entry.querySelector('.logged-tag')?.classList.remove('hidden')
    }
  }

  _clearLogged() {
    document.querySelectorAll('.entry.logged').forEach((e) => {
      e.classList.remove('logged')
      e.querySelector('.logged-tag')?.classList.add('hidden')
    })
  }
}

function chip(skill, hidden = false) {
  return `<span class="chip ${hidden ? 'hidden-skill' : ''}" data-skill="${esc(skill)}">${esc(skill)}</span>`
}

export function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
