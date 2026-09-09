import Events from '../Events.js'

const COUNTDOWN_SECONDS = 3
const COMBO_WINDOW = 2
const COMBO_MAX = 4
const BOARD_SIZE = 5

/**
 * Rules of the target range: a countdown, a fixed-length session, points per hit multiplied by
 * a combo that grows with destroyed targets and fades when the shooting stops, accuracy, and a
 * persisted top-five score board.
 *
 * Pure logic. Events: 'start', 'countdown' (n), 'go', 'hit' (points, combo, destroyed),
 * 'finish' (result), 'abort'.
 */
export default class Range {
  static SAVE_KEY = 'event-horizon:range'

  constructor({ storage = null, duration = 60 } = {}) {
    this.events = new Events()
    this._storage = storage
    this.duration = duration
    this._board = this._load()
    this.reset()
  }

  reset() {
    this.state = 'idle'
    this.timeLeft = this.duration
    this.countdown = 0
    this.score = 0
    this.hits = 0
    this.shots = 0
    this.combo = 1
    this._comboTimer = 0
    this._lastTick = 0
  }

  get active() { return this.state !== 'idle' }
  get running() { return this.state === 'running' }

  start() {
    this.reset()
    this.state = 'countdown'
    this.countdown = COUNTDOWN_SECONDS
    this._lastTick = COUNTDOWN_SECONDS + 1
    this.events.trigger('start')
  }

  abort() {
    if (!this.active) return
    this.reset()
    this.events.trigger('abort')
  }

  update(dt) {
    if (this.state === 'countdown') {
      this.countdown -= dt
      const whole = Math.ceil(this.countdown)
      if (whole < this._lastTick && whole > 0) {
        this._lastTick = whole
        this.events.trigger('countdown', [whole])
      }
      if (this.countdown <= 0) {
        this.state = 'running'
        this.events.trigger('go')
      }
      return
    }
    if (this.state !== 'running') return
    this.timeLeft = Math.max(0, this.timeLeft - dt)
    if (this._comboTimer > 0) {
      this._comboTimer -= dt
      if (this._comboTimer <= 0) this.combo = 1
    }
    if (this.timeLeft <= 0) this._finish()
  }

  registerShot() {
    if (this.running) this.shots++
  }

  /** Scores a hit. Returns the points awarded (base × combo). */
  registerHit(basePoints, destroyed) {
    if (!this.running) return 0
    const points = basePoints * this.combo
    this.score += points
    this.hits++
    this._comboTimer = COMBO_WINDOW
    if (destroyed) this.combo = Math.min(COMBO_MAX, this.combo + 1)
    this.events.trigger('hit', [points, this.combo, destroyed])
    return points
  }

  leaderboard() { return [...this._board] }

  _finish() {
    this.state = 'finished'
    const accuracy = this.shots ? Math.round((this.hits / this.shots) * 100) : 0
    const previousBest = this._board.length ? this._board[0].score : null
    const entry = { score: this.score, hits: this.hits, shots: this.shots, accuracy, date: new Date().toISOString() }
    const updated = [...this._board, entry].sort((a, b) => b.score - a.score).slice(0, BOARD_SIZE)
    this._board = updated
    this._save()
    const rank = updated.indexOf(entry) + 1
    this.events.trigger('finish', [{
      score: this.score, hits: this.hits, shots: this.shots, accuracy,
      isBest: previousBest === null || this.score > previousBest,
      best: previousBest === null ? this.score : Math.max(previousBest, this.score),
      rank: rank === 0 ? updated.length + 1 : rank,
      board: updated,
    }])
  }

  _load() {
    if (!this._storage) return []
    try {
      const raw = this._storage.getItem(Range.SAVE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  _save() {
    if (!this._storage) return
    try { this._storage.setItem(Range.SAVE_KEY, JSON.stringify(this._board)) } catch { /* unavailable */ }
  }
}
