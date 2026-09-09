import Events from '../Events.js'

const COUNTDOWN_SECONDS = 3
const BOARD_SIZE = 5

/**
 * Time-trial rules for any course: a countdown, gates that must be taken in order, a clock,
 * and a persisted per-course leaderboard.
 *
 * Pure logic. `update(dt, shipPos)` drives everything; positions only need x/y/z.
 * Events: 'start' (course), 'countdown' (secondsLeft), 'go', 'gate' (index, total, elapsed),
 * 'finish' (result), 'abort'.
 */
export default class Race {
  static SAVE_KEY = 'event-horizon:races'

  constructor({ courses, storage = null }) {
    this.events = new Events()
    this._courses = courses
    this._storage = storage
    this._boards = this._load()
    this.state = 'idle'
    this.courseId = null
    this.nextGate = 0
    this.elapsed = 0
    this.countdown = 0
    this.splits = []
    this._lastTick = 0
  }

  get course() { return this.courseId ? this._courses[this.courseId] : null }
  get gates() { return this.course ? this.course.gates : [] }
  get active() { return this.state !== 'idle' }
  get running() { return this.state === 'running' }

  start(courseId) {
    if (!this._courses[courseId]) return
    this.courseId = courseId
    this.state = 'countdown'
    this.countdown = COUNTDOWN_SECONDS
    this._lastTick = COUNTDOWN_SECONDS + 1
    this.nextGate = 0
    this.elapsed = 0
    this.splits = []
    this.events.trigger('start', [this.course])
  }

  abort() {
    if (!this.active) return
    this.state = 'idle'
    this.courseId = null
    this.events.trigger('abort')
  }

  /** Clears a finished race so the course can be run again. */
  reset() {
    this.state = 'idle'
    this.courseId = null
    this.nextGate = 0
    this.elapsed = 0
    this.splits = []
  }

  update(dt, shipPos) {
    if (this.state === 'countdown') {
      this.countdown -= dt
      const whole = Math.ceil(this.countdown)
      if (whole < this._lastTick && whole > 0) {
        this._lastTick = whole
        this.events.trigger('countdown', [whole])
      }
      if (this.countdown <= 0) {
        this.state = 'running'
        this.elapsed = 0
        this.events.trigger('go')
      }
      return
    }
    if (this.state !== 'running') return

    this.elapsed += dt
    const gate = this.gates[this.nextGate]
    if (!gate) return
    const dx = shipPos.x - gate.position.x
    const dy = shipPos.y - gate.position.y
    const dz = shipPos.z - gate.position.z
    if (dx * dx + dy * dy + dz * dz <= gate.radius * gate.radius) {
      this.splits.push(this.elapsed)
      this.nextGate++
      this.events.trigger('gate', [this.nextGate, this.gates.length, this.elapsed])
      if (this.nextGate >= this.gates.length) this._finish()
    }
  }

  leaderboard(courseId) {
    return [...(this._boards[courseId] || [])]
  }

  _finish() {
    this.state = 'finished'
    const time = this.elapsed
    const board = this.leaderboard(this.courseId)
    const previousBest = board.length ? board[0].time : null
    const entry = { time, date: new Date().toISOString() }
    const updated = [...board, entry].sort((a, b) => a.time - b.time).slice(0, BOARD_SIZE)
    this._boards[this.courseId] = updated
    this._save()
    const rank = updated.findIndex(e => e === entry) + 1
    const result = {
      courseId: this.courseId,
      courseName: this.course.name,
      time,
      splits: [...this.splits],
      isBest: previousBest === null || time < previousBest,
      best: previousBest === null ? time : Math.min(previousBest, time),
      rank: rank === 0 ? updated.length + 1 : rank,
      board: updated,
    }
    this.events.trigger('finish', [result])
  }

  _load() {
    if (!this._storage) return {}
    try {
      const raw = this._storage.getItem(Race.SAVE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  _save() {
    if (!this._storage) return
    try { this._storage.setItem(Race.SAVE_KEY, JSON.stringify(this._boards)) } catch { /* storage unavailable */ }
  }
}
