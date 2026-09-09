import Events from '../Events.js'

const WORMHOLE_PENALTY_SECONDS = 7 * 365.25 * 24 * 3600   // "one hour here is seven years there"
const REBOOT_PENALTY_SECONDS = 365.25 * 24 * 3600
const POINTS_PER_OBJECTIVE = 500
const POINTS_PER_FRAGMENT = 100
const TIME_BONUS_MAX = 3000
const TIME_BONUS_DECAY_PER_SECOND = 5

/**
 * The rules of the run: objectives, fragments, clocks, score and persistence.
 *
 * Pure state machine (title → playing → finale → freeflight) with no rendering or DOM
 * concerns. Anything visual subscribes to `events`:
 *   'start', 'objective' (objective), 'horizon-open', 'fragment' (fragment, count),
 *   'wormhole', 'finale' (summary), 'reboot', 'pause', 'resume', 'freeflight'.
 */
export default class GameState {
  static SAVE_KEY = 'event-horizon:best'

  constructor({ objectives, fragmentsTotal, fragmentObjectiveId = 'fragments', storage = null }) {
    this.events = new Events()
    this._objectives = objectives.map(o => ({ ...o }))
    this.fragmentsTotal = fragmentsTotal
    this._fragmentObjectiveId = fragmentObjectiveId
    this._storage = storage
    this.state = 'title'
    this._reset()
  }

  _reset() {
    this._done = new Set()
    this._collected = new Map()
    this.shipTime = 0
    this.earthTime = 0
    this.reboots = 0
    this.paused = false
    this.horizonOpen = false
  }

  get objectives() {
    return this._objectives.map(o => ({ ...o, done: this._done.has(o.id) }))
  }

  get objectivesDone() { return this._done.size }
  get fragments() { return this._collected.size }
  get collectedSkills() { return [...this._collected.values()].map(f => f.skill) }
  get running() { return (this.state === 'playing' || this.state === 'freeflight') && !this.paused }

  get score() {
    const timeBonus = Math.max(0, TIME_BONUS_MAX - this.shipTime * TIME_BONUS_DECAY_PER_SECOND)
    return this._done.size * POINTS_PER_OBJECTIVE
      + this._collected.size * POINTS_PER_FRAGMENT
      + Math.round(timeBonus)
  }

  get best() {
    if (!this._storage) return null
    try {
      const raw = this._storage.getItem(GameState.SAVE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  start() {
    this._reset()
    this.state = 'playing'
    this.events.trigger('start')
  }

  pause() {
    if (this.paused) return
    this.paused = true
    this.events.trigger('pause')
  }

  resume() {
    if (!this.paused) return
    this.paused = false
    this.events.trigger('resume')
  }

  /** Advances both clocks. `dilation` is how much faster Earth time runs than ship time. */
  tick(dt, dilation = 1) {
    if (!this.running) return
    this.shipTime += dt
    this.earthTime += dt * dilation
  }

  isObjectiveDone(id) { return this._done.has(id) }

  /** Marks an objective complete. Returns false when it was already done or unknown. */
  completeObjective(id) {
    const objective = this._objectives.find(o => o.id === id)
    if (!objective || this._done.has(id)) return false
    this._done.add(id)
    this.events.trigger('objective', [{ ...objective, done: true }])
    this._checkHorizon()
    return true
  }

  _checkHorizon() {
    if (this.horizonOpen) return
    const required = this._objectives.filter(o => o.required)
    if (required.every(o => this._done.has(o.id))) {
      this.horizonOpen = true
      this.events.trigger('horizon-open')
    }
  }

  collectFragment(fragment) {
    if (this._collected.has(fragment.id)) return false
    this._collected.set(fragment.id, fragment)
    this.events.trigger('fragment', [fragment, this._collected.size])
    if (this._collected.size >= this.fragmentsTotal) this.completeObjective(this._fragmentObjectiveId)
    return true
  }

  recordReboot() {
    this.reboots++
    this.earthTime += REBOOT_PENALTY_SECONDS
    this.events.trigger('reboot', [this.reboots])
  }

  /** Crossing the event horizon: the finale when the horizon is open, a wormhole slip otherwise. */
  enterHorizon() {
    if (this.state !== 'playing' && this.state !== 'freeflight') return
    if (!this.horizonOpen) {
      this.earthTime += WORMHOLE_PENALTY_SECONDS
      this.events.trigger('wormhole')
      return
    }
    if (this.state === 'freeflight') {
      this.events.trigger('wormhole')
      return
    }
    this.state = 'finale'
    const summary = this._buildSummary()
    this._saveBest(summary)
    this.events.trigger('finale', [summary])
  }

  freeFlight() {
    this.state = 'freeflight'
    this.paused = false
    this.events.trigger('freeflight')
  }

  _buildSummary() {
    const previous = this.best
    const score = this.score
    const isNewBest = !previous || score > previous.score
    return {
      shipTime: this.shipTime,
      earthTime: this.earthTime,
      fragments: this.fragments,
      fragmentsTotal: this.fragmentsTotal,
      objectivesDone: this.objectivesDone,
      objectivesTotal: this._objectives.length,
      reboots: this.reboots,
      score,
      best: isNewBest ? { score, shipTime: this.shipTime, fragments: this.fragments } : previous,
      isNewBest,
    }
  }

  _saveBest(summary) {
    if (!this._storage || !summary.isNewBest) return
    try {
      this._storage.setItem(GameState.SAVE_KEY, JSON.stringify(summary.best))
    } catch {
      // Storage can be unavailable (private mode); the run still finishes.
    }
  }
}
