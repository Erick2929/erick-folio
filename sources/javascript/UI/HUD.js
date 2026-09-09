import * as THREE from 'three'
import Experience from '../Experience.js'
import Radar from './Radar.js'
import { formatShipTime, formatEarthTime } from './Intro.js'

const _pos = new THREE.Vector3()
const _ndc = new THREE.Vector3()
const SCAN_CIRCUMFERENCE = 213.6

/** Everything drawn over the 3D view while flying: telemetry, mission log, race clock, marker, radar, alerts. */
export default class HUD {
  constructor() {
    const exp = Experience.getInstance()
    this._exp = exp
    this.ship = exp.ship
    this.game = exp.game
    this.world = exp.world
    this.camera = exp.camera
    this.sizes = exp.sizes
    this.audio = exp.audio

    const $ = (id) => document.getElementById(id)
    this.el = {
      hud: $('hud'), speed: $('telem-speed'), pull: $('telem-pull'), horizon: $('telem-horizon'),
      hull: $('hull-fill'), boost: $('boost-fill'), boostNote: $('boost-note'),
      clockShip: $('clock-ship'), clockEarth: $('clock-earth'),
      mission: $('mission-list'), frags: $('frag-count'), score: $('score'), horizonStatus: $('horizon-status'),
      scanRing: $('scan-ring'), scanLabel: $('scan-label'),
      marker: $('marker'), markerName: $('marker-name'), markerDist: $('marker-dist'), markerArrow: document.querySelector('.marker-arrow'),
      alerts: $('alerts'), sound: $('btn-sound'),
      race: $('race-hud'), raceName: $('race-name'), raceTime: $('race-time'), raceGate: $('race-gate'), raceBest: $('race-best'),
      countdown: $('countdown'), scorePop: $('score-pop'),
    }
    this.radar = new Radar($('radar'))
    this._frame = 0
    this._raceFrozen = false
    this._rangeMode = false

    this._buildMission()
    this._wireButtons()
    this._wireEvents()
    this._syncSoundButton()

    exp.ticker.events.on('tick', (delta, elapsed) => this._update(delta, elapsed), 12)
  }

  _buildMission() {
    this.el.mission.innerHTML = ''
    for (const o of this.game.run.objectives) {
      const li = document.createElement('li')
      li.dataset.id = o.id
      li.textContent = o.label
      if (!o.required) li.classList.add('optional')
      if (o.done) li.classList.add('done')
      this.el.mission.appendChild(li)
    }
    this._updateCounters()
    this._updateHorizonStatus()
  }

  _wireButtons() {
    const nav = document.getElementById('hud-nav')
    document.querySelectorAll('.hud-nav-btn[data-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        nav.classList.remove('open')
        this._exp.panels.toggle(btn.dataset.panel)
      })
    })
    document.getElementById('btn-cv-menu').addEventListener('click', () => nav.classList.toggle('open'))
    if (!document.fullscreenEnabled) document.getElementById('btn-fullscreen').classList.add('hidden')
    this.el.sound.addEventListener('click', () => {
      this.audio.unlock()
      this.audio.toggleMute()
      this._syncSoundButton()
    })
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {})
      else document.exitFullscreen?.().catch(() => {})
    })
    document.getElementById('btn-pause').addEventListener('click', () => this._exp.pauseMenu.toggle())
  }

  _syncSoundButton() {
    this.el.sound.classList.toggle('muted', this.audio.muted)
    const pauseBtn = document.getElementById('btn-pause-sound')
    if (pauseBtn) pauseBtn.textContent = this.audio.muted ? '[ SOUND: OFF ]' : '[ SOUND: ON ]'
  }

  _wireEvents() {
    const g = this.game.events
    g.on('start', () => { this._buildMission(); this._hideRace() })
    g.on('objective', (objective) => {
      const li = this.el.mission.querySelector(`li[data-id="${objective.id}"]`)
      if (li) { li.classList.add('done', 'flash'); li.classList.remove('current') }
      this._updateCounters()
    })
    g.on('fragment', () => {
      this._updateCounters()
      this.el.frags.classList.remove('pop')
      void this.el.frags.offsetWidth
      this.el.frags.classList.add('pop')
    })
    g.on('horizon-open', () => this._updateHorizonStatus())
    g.on('alert', (text, level, seconds) => this.alert(text, level, seconds))
    g.on('finale', () => { this.el.marker.classList.add('hidden'); this._hideRace() })
    g.on('freeflight', () => this._updateHorizonStatus())

    g.on('race-start', (course) => {
      this._raceFrozen = false
      this._rangeMode = false
      this.el.race.classList.remove('hidden')
      this.el.raceName.textContent = course.name
      this.el.raceGate.textContent = `GATE 1/${course.gates.length}`
      const best = this.game.race.leaderboard(this.game.race.courseId)[0]
      this.el.raceBest.textContent = best ? `BEST ${formatRaceTime(best.time)}` : 'NO TIME SET'
      this._showCountdown('3')
    })
    g.on('race-countdown', (n) => this._showCountdown(String(n)))
    g.on('race-go', () => this._showCountdown('GO', 700))
    g.on('race-gate', (index, total) => {
      this.el.raceGate.textContent = index >= total ? 'FINISH' : `GATE ${index + 1}/${total}`
      this.el.raceGate.classList.remove('pop')
      void this.el.raceGate.offsetWidth
      this.el.raceGate.classList.add('pop')
    })
    g.on('race-finish', (result) => {
      this._raceFrozen = true
      this.el.raceTime.textContent = formatRaceTime(result.time)
      this.el.raceGate.textContent = result.isBest ? 'NEW RECORD' : `RANK #${result.rank}`
      this.el.raceBest.textContent = `BEST ${formatRaceTime(result.best)}`
    })
    g.on('race-abort', () => this._hideRace())
    g.on('race-closed', () => this._hideRace())

    g.on('range-start', () => {
      this._raceFrozen = false
      this._rangeMode = true
      this.el.race.classList.remove('hidden')
      this.el.raceName.textContent = 'TARGET RANGE'
      this.el.raceGate.textContent = 'SCORE 0 · x1'
      const best = this.game.range.leaderboard()[0]
      this.el.raceBest.textContent = best ? `BEST ${best.score.toLocaleString()} PTS` : 'NO SCORE SET'
      this._showCountdown('3')
    })
    g.on('range-countdown', (n) => this._showCountdown(String(n)))
    g.on('range-go', () => this._showCountdown('GO', 700))
    g.on('range-hit', (points, combo) => {
      this.el.raceGate.textContent = `SCORE ${this.game.range.score.toLocaleString()} · x${combo}`
      this._scorePop(`+${points}`, combo)
    })
    g.on('range-finish', (result) => {
      this._raceFrozen = true
      this.el.raceTime.textContent = '00:00.00'
      this.el.raceGate.textContent = result.isBest ? `NEW RECORD · ${result.score.toLocaleString()} PTS` : `${result.score.toLocaleString()} PTS · RANK #${result.rank}`
      this.el.raceBest.textContent = `BEST ${result.best.toLocaleString()} PTS`
    })
    g.on('range-abort', () => this._hideRace())
    g.on('range-closed', () => this._hideRace())

    this._exp.input.onKey('KeyM', () => { this.audio.unlock(); this.audio.toggleMute(); this._syncSoundButton() })
    this._exp.input.onKey('KeyG', () => document.getElementById('btn-fullscreen').click())
  }

  _showCountdown(text, ms = 900) {
    const el = this.el.countdown
    el.textContent = text
    el.classList.remove('hidden', 'zoom')
    void el.offsetWidth
    el.classList.add('zoom')
    clearTimeout(this._countdownTimer)
    this._countdownTimer = setTimeout(() => el.classList.add('hidden'), ms)
  }

  _hideRace() {
    this.el.race.classList.add('hidden')
    this.el.countdown.classList.add('hidden')
    this._raceFrozen = false
    this._rangeMode = false
  }

  _scorePop(text, combo) {
    const el = this.el.scorePop
    el.textContent = combo > 1 ? `${text} ×${combo}` : text
    el.className = 'score-pop' + (combo >= 3 ? ' hot' : '')
    void el.offsetWidth
    el.classList.add('show')
  }

  alert(text, level = 'info', seconds = 3) {
    const el = document.createElement('div')
    el.className = `alert ${level}`
    el.textContent = text
    this.el.alerts.appendChild(el)
    while (this.el.alerts.children.length > 4) this.el.alerts.firstChild.remove()
    setTimeout(() => el.classList.add('out'), seconds * 1000)
    setTimeout(() => el.remove(), seconds * 1000 + 600)
  }

  _updateCounters() {
    const run = this.game.run
    this.el.frags.textContent = `${String(run.fragments).padStart(2, '0')}/${String(run.fragmentsTotal).padStart(2, '0')}`
    this.el.score.textContent = run.score.toLocaleString()
  }

  _updateHorizonStatus() {
    const run = this.game.run
    const open = run.horizonOpen
    this.el.horizonStatus.textContent = run.state === 'freeflight' ? 'FREE FLIGHT' : open ? 'HORIZON · OPEN' : 'HORIZON · SEALED'
    this.el.horizonStatus.className = open ? 'open' : 'sealed'
  }

  _update(delta, elapsed) {
    const run = this.game.run
    if (run.state === 'title') return
    this._frame++

    const ship = this.ship
    const speed = ship.velocity.length()
    this.el.speed.textContent = String(Math.round(speed * 10)).padStart(3, '0')
    this.el.pull.textContent = (ship.pull / 9.8).toFixed(1) + 'g'
    this.el.horizon.textContent = String(Math.max(0, Math.round(ship.distanceToHorizon))).padStart(3, '0') + 'u'
    this.el.hull.style.width = ship.hull + '%'
    this.el.hull.classList.toggle('low', ship.hull < 30)
    this._updateBoost()
    this.el.clockShip.textContent = formatShipTime(run.shipTime)
    this.el.clockEarth.textContent = formatEarthTime(run.earthTime)
    if (this._frame % 10 === 0) this.el.score.textContent = run.score.toLocaleString()

    this._updateScan()
    this._updateRace()
    this._updateMarker()
    this._updateCurrentObjective()
    if (this._frame % 2 === 0) this.radar.draw({ ship, world: this.world, target: this.game.currentTarget, elapsed })
  }

  _updateBoost() {
    const reserve = this.ship.reserve
    const overdrive = reserve.overdrive > 0
    this.el.boost.style.width = (overdrive ? 100 : Math.round(reserve.energy * 100)) + '%'
    this.el.boost.classList.toggle('active', this.ship.boostAmount > 0.5)
    this.el.boost.classList.toggle('empty', reserve.locked && !overdrive)
    this.el.boost.classList.toggle('overdrive', overdrive)
    this.el.boostNote.textContent = overdrive ? `OVERDRIVE ${Math.ceil(reserve.overdrive)}s` : reserve.locked ? 'RECHARGING' : ''
    this.el.boostNote.className = 'boost-note' + (overdrive ? ' good' : reserve.locked ? ' warn' : '')
  }

  _updateScan() {
    const scanner = this.game.scanner
    const racing = this.game.activityRunning
    const progress = scanner.target && !racing ? scanner.progress : 0
    this.el.scanRing.style.strokeDashoffset = String(SCAN_CIRCUMFERENCE * (1 - progress))
    if (scanner.target && !racing) {
      const verb = scanner.target.kind === 'station' ? 'DOCKING' : scanner.target.kind === 'race' ? 'ACCEPTING CHALLENGE' : 'SCANNING'
      this.el.scanLabel.textContent = `${verb} ${scanner.target.name} · ${Math.round(progress * 100)}%`
    } else {
      this.el.scanLabel.textContent = ''
    }
  }

  _updateRace() {
    if (this._raceFrozen) return
    if (this._rangeMode) {
      const range = this.game.range
      if (!range.active) return
      this.el.raceTime.textContent = formatRaceTime(range.state === 'countdown' ? range.duration : range.timeLeft)
      return
    }
    const race = this.game.race
    if (!race.active) return
    this.el.raceTime.textContent = race.state === 'countdown' ? '00:00.00' : formatRaceTime(race.elapsed)
  }

  _updateMarker() {
    const target = this.game.currentTarget
    if (!target || this.game.run.state === 'finale') { this.el.marker.classList.add('hidden'); return }
    this.el.marker.classList.remove('hidden')

    const cam = this.camera.instance
    target.getPosition(_pos)
    const distance = _pos.distanceTo(this.ship.position)
    _ndc.copy(_pos).project(cam)
    const behind = _ndc.z > 1
    let x = _ndc.x
    let y = _ndc.y
    if (behind) { x = -x; y = -y }

    const w = this.sizes.width
    const h = this.sizes.height
    // Keep the marker clear of the HUD edges; on touch the bottom band holds the buttons.
    const touch = document.body.classList.contains('touch')
    const mSide = 70
    const mTop = 70
    const mBottom = touch ? 240 : 70
    let px = (x * 0.5 + 0.5) * w
    let py = (-y * 0.5 + 0.5) * h
    const onScreen = !behind && px > mSide && px < w - mSide && py > mTop && py < h - mBottom

    if (!onScreen) {
      const cx = w / 2
      const cy = (mTop + (h - mBottom)) / 2
      let dx = px - cx
      let dy = py - cy
      if (behind && Math.hypot(dx, dy) < 1) { dx = 0; dy = 1 }
      const len = Math.hypot(dx, dy) || 1
      const nx = dx / len
      const ny = dy / len
      const tx = Math.abs(nx) > 1e-6 ? (nx > 0 ? (w - mSide - cx) : (cx - mSide)) / Math.abs(nx) : Infinity
      const ty = Math.abs(ny) > 1e-6 ? (ny > 0 ? (h - mBottom - cy) : (cy - mTop)) / Math.abs(ny) : Infinity
      const t = Math.min(tx, ty)
      px = cx + nx * t
      py = cy + ny * t
      const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90
      this.el.markerArrow.style.transform = `rotate(${angle}deg)`
      this.el.marker.classList.add('edge')
    } else {
      this.el.marker.classList.remove('edge')
    }

    this.el.marker.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`
    this.el.markerName.textContent = target.name
    this.el.markerDist.textContent = `${Math.round(distance)}u`
  }

  _updateCurrentObjective() {
    if (this._frame % 15 !== 0) return
    const target = this.game.currentTarget
    const id = target?.objectiveId
    this.el.mission.querySelectorAll('li').forEach((li) => li.classList.toggle('current', li.dataset.id === id))
  }
}

/** mm:ss.cc for race clocks. */
export function formatRaceTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const c = Math.floor((seconds % 1) * 100)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`
}
