import * as THREE from 'three'
import Experience from '../Experience.js'
import Events from '../Events.js'
import GameState from './GameState.js'
import Scanner from './Scanner.js'
import Race from './Race.js'
import Range from './Range.js'
import Achievements from './Achievements.js'
import { timeDilation } from './physics.js'
import { OBJECTIVES, LAYOUT } from '../data/profile.js'
import { buzz } from '../utils/device.js'

const _pos = new THREE.Vector3()
const _tmp = new THREE.Vector3()
const _hit = { normal: new THREE.Vector3(), depth: 0, rock: null }
const SKIM_RADII = 2.5
const SKIM_SECONDS = 6
const YEAR = 365.25 * 24 * 3600

/**
 * Glue between the rules (GameState, Race, Achievements), the world and the ship. Runs the
 * scanner, fragment and fuel pickups, gravity-well warnings, wormhole slips, reboots, races
 * and the finale, and tells the UI what to show.
 *
 * Events: everything GameState emits is re-emitted here, plus 'scan' (scannable),
 * 'alert' (text, level, seconds), 'launch', 'restart', 'race-start' (course), 'race-countdown' (n),
 * 'race-go', 'race-gate' (index, total, elapsed), 'race-finish' (result), 'race-abort',
 * 'race-closed', 'fuel' (overdriveSeconds), 'achievement' (definition), 'photo' (on),
 * 'range-start', 'range-countdown' (n), 'range-go', 'range-hit' (points, combo, destroyed),
 * 'range-finish' (result), 'range-abort', 'range-closed'.
 */
export default class Game {
  constructor() {
    const exp = Experience.getInstance()
    this._exp = exp
    this.ship = exp.ship
    this.world = exp.world
    this.input = exp.input
    this.audio = exp.audio
    this.camera = exp.camera
    this.renderer = exp.renderer
    this.events = new Events()

    const storage = safeStorage()
    this.run = new GameState({ objectives: OBJECTIVES, fragmentsTotal: this.world.fragments.total, storage })
    this.race = new Race({ courses: this.world.raceCourse.courses, storage })
    this.range = new Range({ storage, duration: LAYOUT.range.duration })
    this._activeResult = null
    this.achievements = new Achievements({ storage })
    this.scanner = new Scanner(this.world.scannables, this.ship, this.run)
    this.currentTarget = null
    this.dilation = 1
    this.cvMode = false
    this.photoMode = false
    this._overlays = 0
    this._wellWarned = false
    this._heatWarned = false
    this._pulseCooldown = 0
    this._fade = 0
    this._flash = 0
    this._damageGlow = 0
    this._skimSeconds = 0
    this._wormholes = 0

    this._wireRun()
    this._wireShip()
    this._wireRace()
    this._wireRange()
    this.achievements.events.on('unlock', (def) => {
      this.audio.achievement()
      this.alert(`ACHIEVEMENT · ${def.name}`, 'good', 4)
      this.events.trigger('achievement', [def])
    })
    this.input.onKey('KeyH', () => this.togglePhotoMode())

    exp.ticker.events.on('tick', (delta, elapsed) => this._update(delta, elapsed), 9)
  }

  _wireRun() {
    const forward = (name) => this.run.events.on(name, (...args) => this.events.trigger(name, args))
    ;['start', 'objective', 'fragment', 'pause', 'resume', 'freeflight', 'reboot'].forEach(forward)

    this.run.events.on('horizon-open', () => {
      this.audio.horizonOpen()
      this.alert('EVERY CHAPTER LOGGED · THE HORIZON IS OPEN', 'good', 6)
      this.alert('FLY INTO THE SINGULARITY', 'good', 6)
      this.achievements.unlock('archivist')
      this.events.trigger('horizon-open')
    })

    this.run.events.on('wormhole', () => {
      this.audio.wormhole()
      this._flash = 1
      this.abortActivity(true)
      const rim = this.world.rimPoint()
      this.ship.teleport(rim.position, rim.lookAt)
      this.camera.addShake(1)
      this._wormholes++
      if (this._wormholes >= 3) this.achievements.unlock('wormhole-tourist')
      if (this.run.state === 'freeflight') this.alert('WORMHOLE SLIP · BACK TO THE RIM', 'warn', 4)
      else this.alert('WORMHOLE SLIP · +7 YEARS ON EARTH · LOG EVERY CHAPTER BEFORE CROSSING', 'warn', 6)
      this.events.trigger('wormhole')
    })

    this.run.events.on('finale', (summary) => {
      this.abortActivity(true)
      this.ship.lock()
      this.audio.finale()
      this.audio.duckMusic(true)
      if (summary.shipTime < 240) this.achievements.unlock('speedrunner')
      if (summary.reboots === 0) this.achievements.unlock('untouchable')
      this.events.trigger('finale', [summary])
    })

    this.run.events.on('fragment', (fragment, count) => {
      if (count >= this.run.fragmentsTotal) this.achievements.unlock('completionist')
    })
  }

  _wireShip() {
    this.ship.events.on('damage', (amount, source) => {
      this._damageGlow = Math.min(1, this._damageGlow + amount / 25)
      this.camera.addShake(Math.min(1, amount / 20))
      if (source === 'heat') {
        if (!this._heatWarned) { this.alert('DISK PLASMA · HULL HEATING', 'warn', 2.5); this._heatWarned = true }
      } else {
        this.audio.hit(Math.min(1, amount / 15))
        buzz(30)
        this._heatWarned = false
      }
    })
    this.ship.events.on('collide', (impact) => {
      if (impact > 6) this.world.bursts.spawn(this.ship.position, 0xffc890, 14, 6)
    })
    this.ship.events.on('destroyed', () => {
      this.audio.reboot()
      this.run.recordReboot()
      this.abortActivity(true)
      this.world.bursts.spawn(this.ship.position, 0xff9060, 60, 14)
      this._fade = 1
      setTimeout(() => {
        this.ship.respawn()
        if (this.run.running) this.ship.unlock()
        this.alert('HULL LOST · SYSTEMS REBOOTED AT LAST CHECKPOINT · +1 YEAR ON EARTH', 'warn', 5)
      }, 900)
    })
    this.ship.events.on('horizon', () => this.run.enterHorizon())
    this.ship.events.on('bounds', (outside) => {
      if (outside) this.alert('LEAVING THE SYSTEM · TURN BACK', 'warn', 3)
    })
    this.ship.events.on('boost-denied', () => {
      this.audio.boostDenied()
      this.alert('BOOST RESERVE EMPTY · RECHARGING · FIND A FUEL CELL', 'warn', 2)
    })
  }

  _wireRace() {
    const race = this.race
    race.events.on('start', (course) => {
      this.world.raceCourse.showCourse(race.courseId)
      this.audio.countdown(3)
      this.events.trigger('race-start', [course])
    })
    race.events.on('countdown', (n) => {
      this.audio.countdown(n)
      this.events.trigger('race-countdown', [n])
    })
    race.events.on('go', () => {
      this.audio.countdown(0)
      this.events.trigger('race-go')
    })
    race.events.on('gate', (index, total, elapsed) => {
      this.audio.gate()
      buzz(15)
      this.world.raceCourse.setNextGate(index)
      this.world.bursts.spawn(this.ship.position, 0xffb35c, 24, 8)
      this.events.trigger('race-gate', [index, total, elapsed])
    })
    race.events.on('finish', (result) => {
      this.audio.raceFinish()
      this.world.bursts.spawn(this.ship.position, 0xffd27a, 80, 16)
      if (result.courseId === 'trial') {
        this.run.completeObjective('race')
        this.achievements.unlock('racer')
        if (result.time < 50) this.achievements.unlock('hotlap')
      }
      if (result.courseId === 'slingshot') this.achievements.unlock('slingshot')
      this._activeResult = 'race'
      this.events.trigger('race-finish', [result])
    })
    race.events.on('abort', () => {
      this.world.raceCourse.hideCourse()
      this.events.trigger('race-abort')
    })
  }

  _wireRange() {
    const range = this.range
    range.events.on('start', () => {
      this.world.targets.begin()
      this.audio.countdown(3)
      this.events.trigger('range-start')
    })
    range.events.on('countdown', (n) => {
      this.audio.countdown(n)
      this.events.trigger('range-countdown', [n])
    })
    range.events.on('go', () => {
      this.audio.countdown(0)
      this.events.trigger('range-go')
    })
    range.events.on('hit', (points, combo, destroyed) => this.events.trigger('range-hit', [points, combo, destroyed]))
    range.events.on('finish', (result) => {
      this.world.targets.end()
      this.audio.raceFinish()
      this.run.completeObjective('range')
      this.achievements.unlock('gunner')
      if (result.score >= 6000) this.achievements.unlock('marksman')
      if (result.shots >= 20 && result.accuracy >= 60) this.achievements.unlock('deadeye')
      this._activeResult = 'range'
      this.events.trigger('range-finish', [result])
    })
    range.events.on('abort', () => {
      this.world.targets.end()
      this.events.trigger('range-abort')
    })
  }

  alert(text, level = 'info', seconds = 3) {
    this.events.trigger('alert', [text, level, seconds])
  }

  /** Called by the title screen. `cvMode` skips the tutorial alerts for people who just want the CV. */
  launch({ cvMode = false } = {}) {
    this.cvMode = cvMode
    this.audio.unlock()
    this._startRun()
    this.events.trigger('launch')
  }

  restart() {
    this.abortActivity(true)
    this._startRun()
    this.events.trigger('restart')
  }

  _startRun() {
    this.world.fragments.reset()
    this.world.fuelCells.reset()
    this.world.targets.end()
    this.range.reset()
    this.scanner.reset()
    this._overlays = 0
    this._wellWarned = false
    this._skimSeconds = 0
    this._wormholes = 0
    const spawn = this.world.spawnPoint()
    this.ship.spawnAt(spawn.position, spawn.lookAt)
    this.ship.hull = 100
    this.ship.reserve.reset()
    this.ship.destroyed = false
    this.run.start()
    this.ship.unlock()
    this.input.enabled = true
    this.camera.setMode('chase')
    this.audio.duckMusic(false)
    if (!this.cvMode) {
      this.alert('MISSION · LOG EVERY CHAPTER OF THE CAREER, THEN CROSS THE HORIZON', 'info', 6)
      this.alert('FLY CLOSE TO ORIGIN AND HOLD POSITION TO SCAN IT', 'info', 6)
      this.alert('THE AMBER BEACON AHEAD STARTS A TIME TRIAL', 'info', 6)
    }
  }

  freeFlight() {
    this.run.freeFlight()
    const rim = this.world.rimPoint()
    this.ship.teleport(rim.position, rim.lookAt)
    this.ship.hull = 100
    this.ship.destroyed = false
    this.ship.unlock()
    this.audio.duckMusic(false)
    this.alert('FREE FLIGHT · THE REMAINING FRAGMENTS AND COURSES ARE YOURS', 'good', 5)
  }

  /** Overlays (panels, dialogs, pause) freeze the run while they are open. */
  setOverlay(open) {
    this._overlays = Math.max(0, this._overlays + (open ? 1 : -1))
    const paused = this._overlays > 0
    if (paused) this.run.pause()
    else this.run.resume()
    this.input.enabled = !paused
    this.audio.duckMusic(paused)
  }

  get overlayOpen() { return this._overlays > 0 }

  /** Starts a course. Works from the beacon or from the pause menu, wherever the ship is. */
  startRace(courseId) {
    if (!this.run.running) return
    this._exp.dialog?.close()
    this.race.start(courseId)
  }

  abortRace(silent = false) {
    if (!this.race.active) return
    this.race.abort()
    if (!silent) this.alert('TIME TRIAL ABORTED', 'warn', 2.5)
  }

  /** Starts a target range session from the beacon or the pause menu. */
  startRange() {
    if (!this.run.running) return
    this._exp.dialog?.close()
    if (this.race.active) this.abortRace(true)
    this.range.start()
  }

  abortRange(silent = false) {
    if (!this.range.active) return
    this.range.abort()
    if (!silent) this.alert('TARGET RANGE ABORTED', 'warn', 2.5)
  }

  get activityRunning() { return this.race.active || this.range.active }

  abortActivity(silent = false) {
    if (this.race.active) this.abortRace(silent)
    if (this.range.active) this.abortRange(silent)
  }

  /** A results card was dismissed: clear the course or the range. `again` restarts it immediately. */
  closeActivityResults(again = false) {
    if (this._activeResult === 'range') {
      this._activeResult = null
      this.range.reset()
      this.events.trigger('range-closed')
      if (again) this.startRange()
      return
    }
    this._activeResult = null
    const courseId = this.race.courseId
    this.race.reset()
    this.world.raceCourse.hideCourse()
    this.events.trigger('race-closed')
    if (again && courseId) this.startRace(courseId)
  }

  togglePhotoMode() {
    if (this.run.state === 'title') return
    this.photoMode = !this.photoMode
    document.body.classList.toggle('photo', this.photoMode)
    if (this.photoMode) this.achievements.unlock('photographer')
    this.events.trigger('photo', [this.photoMode])
  }

  pulse() {
    if (this._pulseCooldown > 0 || !this.run.running) return
    this._pulseCooldown = 1.2
    this.audio.pulse()
    this.world.fragments.pulse(this.ship.position, 170)
    this.world.bursts.spawn(this.ship.position, 0x8fd3ff, 40, 30)
    this.events.trigger('pulse')
  }

  _update(delta, elapsed) {
    const run = this.run
    const ship = this.ship
    const bh = this.world.blackHole

    this._pulseCooldown = Math.max(0, this._pulseCooldown - delta)
    if (this.input.consumePulse()) this.pulse()

    const dist = bh.distanceTo(ship.position)
    this.dilation = timeDilation(dist, bh.rs)
    run.tick(delta, this.dilation)

    const collected = this.world.fragments.update(delta, ship.position, elapsed, run.running)
    for (const fragment of collected) {
      run.collectFragment(fragment)
      this.audio.pickup(run.fragments)
      buzz(10)
      this.world.bursts.spawn(fragment.position, fragment.color, 30, 9)
      this.alert(fragment.hidden ? `HIDDEN FRAGMENT · ${fragment.skill.toUpperCase()}` : `FRAGMENT · ${fragment.skill.toUpperCase()}`, fragment.hidden ? 'good' : 'info', 2.2)
    }

    const fuel = this.world.fuelCells.update(delta, ship.position, elapsed, run.running)
    for (const cell of fuel) {
      ship.refuel(15)
      this.audio.fuel()
      buzz(20)
      this.world.bursts.spawn(cell.group.position, 0x9ff2ff, 40, 12)
      this.alert('FUEL CELL · OVERDRIVE FOR 15 SECONDS', 'good', 2.5)
      this.events.trigger('fuel', [15])
    }

    if (run.running && this.input.fire && this.world.blaster.fire()) {
      this.audio.shoot()
      if (this.range.running) this.range.registerShot()
    }
    this.world.blaster.update(delta, (pos) => this._boltHit(pos))
    this.world.targets.update(delta, ship, elapsed)

    if (run.running) {
      if (this.race.active) {
        this.race.update(delta, ship.position)
      } else if (this.range.active) {
        this.range.update(delta)
      } else {
        const { completed, ticked } = this.scanner.update(delta)
        if (ticked) this.audio.scanTick()
        if (completed) this._onScanned(completed)
      }
      this._trackSkim(delta, dist, bh)
      if (run.earthTime >= 50 * YEAR) this.achievements.unlock('time-traveler')
    }

    this._updateWellWarnings(dist, bh)
    this._updateTarget()
    this._updateEffects(delta)

    const danger = run.running ? Math.max(0, 1 - (dist - bh.rs) / (bh.rs * 3.5)) : 0
    this.audio.setFlight(ship.speedNorm, ship.boostAmount, run.horizonOpen ? danger * 0.4 : danger)
  }

  _trackSkim(delta, dist, bh) {
    if (dist < bh.rs * SKIM_RADII && !this.ship.destroyed) {
      this._skimSeconds += delta
      if (this._skimSeconds >= SKIM_SECONDS) this.achievements.unlock('skimmer')
    } else {
      this._skimSeconds = Math.max(0, this._skimSeconds - delta * 0.5)
    }
  }

  /** A bolt reached `pos`: damage a range target or shatter a belt rock. Returns true when it hit. */
  _boltHit(pos) {
    const targets = this.world.targets
    const target = targets.hitTest(pos, 1.0)
    if (target) {
      const { destroyed, points } = targets.applyHit(target)
      if (this.range.running) this.range.registerHit(points, destroyed)
      if (destroyed) { this.audio.targetDestroyed(this.range.combo); buzz(15) } else this.audio.targetHit()
      this.world.bursts.spawn(pos, target.color, 10, 6)
      return true
    }
    const belt = this.world.asteroids
    if (belt && belt.collide(pos, 0.8, _hit)) {
      if (belt.shatter(_hit.rock)) {
        this.world.bursts.spawn(_hit.rock.position, 0xd6a06a, 30, 9)
        this.audio.targetDestroyed(1)
      }
      return true
    }
    return false
  }

  _onScanned(scannable) {
    if (scannable.kind === 'race') {
      this.startRace(scannable.courseId)
      return
    }
    if (scannable.kind === 'range') {
      this.startRange()
      return
    }
    this.run.completeObjective(scannable.objectiveId)
    this.achievements.unlock('first-light')
    this.ship.setCheckpoint(this.ship.position, scannable.getPosition(_tmp))
    if (scannable.kind === 'station') this.audio.dock()
    else this.audio.scanComplete()
    this.world.bursts.spawn(scannable.getPosition(_pos).addScaledVector(_tmp.copy(this.ship.position).sub(_pos).normalize(), scannable.radius), scannable.color, 50, 12)
    this.events.trigger('scan', [scannable])
  }

  _updateWellWarnings(dist, bh) {
    const deep = dist < bh.rs * 4.5
    if (deep && !this._wellWarned && this.run.running) {
      this._wellWarned = true
      if (this.run.horizonOpen) this.alert('GRAVITY WELL · THE HORIZON IS OPEN · KEEP GOING', 'good', 3)
      else this.alert('GRAVITY WELL · HORIZON SEALED · PULL UP', 'warn', 3)
    }
    if (dist > bh.rs * 7) this._wellWarned = false
  }

  _updateTarget() {
    const run = this.run
    if (run.state === 'finale' || run.state === 'title') { this.currentTarget = null; return }

    if (this.race.active && this.race.state !== 'finished') {
      const index = this.race.nextGate
      const gate = this.race.gates[index]
      this.currentTarget = gate
        ? { name: `GATE ${index + 1}/${this.race.gates.length}`, kind: 'gate', color: 0xffb35c, radius: gate.radius, getPosition: (out) => out.copy(gate.position) }
        : null
      return
    }

    if (this.range.active && this.range.state !== 'finished') {
      const nearest = this.world.targets.nearest(this.ship.position)
      this.currentTarget = nearest
        ? { name: nearest.kind.toUpperCase(), kind: 'target', color: 0xff5c5c, radius: nearest.radius, getPosition: (out) => out.copy(nearest.position) }
        : null
      return
    }

    if (run.horizonOpen && run.state === 'playing') {
      this.currentTarget = { name: 'SINGULARITY', kind: 'horizon', color: 0xffb35c, radius: this.world.blackHole.rs, getPosition: (out) => out.copy(this.world.blackHole.position) }
      return
    }

    let best = null
    let bestDist = Infinity
    for (const s of this.world.scannables) {
      if (s.kind === 'race' || s.kind === 'range') continue
      if (run.isObjectiveDone(s.objectiveId)) continue
      s.getPosition(_pos)
      const d = _pos.distanceTo(this.ship.position)
      const weighted = s.required ? d : d * 1.6
      if (weighted < bestDist) { bestDist = weighted; best = s }
    }
    if (!best && run.state === 'freeflight') {
      const remaining = this.world.fragments.remaining
      if (remaining.length) {
        let nearest = remaining[0]
        let nd = Infinity
        for (const f of remaining) {
          const d = f.position.distanceTo(this.ship.position)
          if (d < nd) { nd = d; nearest = f }
        }
        best = { name: 'FRAGMENT', kind: 'fragment', color: 0xffffff, radius: 1, getPosition: (out) => out.copy(nearest.position) }
      }
    }
    this.currentTarget = best
  }

  _updateEffects(delta) {
    const e = this.renderer.effects
    const ship = this.ship
    this._damageGlow = Math.max(0, this._damageGlow - delta * 1.6)
    if (this.run.state !== 'finale') {
      this._flash = Math.max(0, this._flash - delta * 1.1)
      this._fade = Math.max(0, this._fade - delta * 0.9)
    }
    e.boost = ship.boostAmount
    e.damage = this._damageGlow + (ship.hull < 25 && this.run.running ? 0.15 + 0.15 * Math.sin(performance.now() * 0.01) : 0)
    e.heat = ship.heat
    e.flash = this._flash
    e.fade = this._fade
  }

  /** The finale sequence drives the fade and flash itself. */
  setFade(value) { this._fade = value }
  setFlash(value) { this._flash = value }
}

function safeStorage() {
  try {
    const key = '__eh_probe__'
    localStorage.setItem(key, '1')
    localStorage.removeItem(key)
    return localStorage
  } catch {
    return null
  }
}
