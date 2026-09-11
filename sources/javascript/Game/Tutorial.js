import Events from '../Events.js'

/**
 * Flight school steps. Offsets are in the spawn frame: [right, up, forward] units from the
 * spawn point, so the stars always line up with where a new pilot is pointing.
 */
export const TUTORIAL_STEPS = [
  { id: 'thrust', keys: 'HOLD W TO THRUST', touch: 'HOLD THRUST (OR SWITCH CRUISE ON)', text: 'Fly through the first star', offset: [0, 0, 48] },
  { id: 'steer', keys: 'A / D TURN · ↑ ↓ CLIMB AND DIVE', touch: 'DRAG THE LEFT SIDE TO STEER', text: 'Turn and climb to the second star', offset: [-38, 20, 92] },
  { id: 'boost', keys: 'HOLD SHIFT OR SPACE TO BOOST', touch: 'HOLD BOOST', text: 'Boost to the last star', offset: [14, 8, 175] },
]

/**
 * Pure flight-school state: idle → active (three stars in order) → done. Remembers completion
 * so returning visitors are not taught twice. Events: 'start', 'step' (index), 'complete', 'skip'.
 */
export default class Tutorial {
  static SAVE_KEY = 'event-horizon:tutorial-done'

  constructor({ storage = null, steps = TUTORIAL_STEPS } = {}) {
    this.events = new Events()
    this._storage = storage
    this.steps = steps
    this.state = 'idle'
    this.index = 0
    this.seen = readSeen(storage)
  }

  get active() { return this.state === 'active' }
  get step() { return this.active ? this.steps[this.index] : null }

  start() {
    this.state = 'active'
    this.index = 0
    this.events.trigger('start')
  }

  skip() {
    if (!this.active) return
    this._finish()
    this.events.trigger('skip')
  }

  /** `reached` is true on the frame the ship touches the current star. */
  update(reached) {
    if (!this.active || !reached) return
    this.index++
    if (this.index >= this.steps.length) {
      this._finish()
      this.events.trigger('complete')
      return
    }
    this.events.trigger('step', [this.index])
  }

  _finish() {
    this.state = 'done'
    this.seen = true
    try { this._storage?.setItem(Tutorial.SAVE_KEY, '1') } catch { /* unavailable */ }
  }
}

function readSeen(storage) {
  try { return storage?.getItem(Tutorial.SAVE_KEY) === '1' } catch { return false }
}
