import Events from '../Events.js'

export const ACHIEVEMENTS = [
  { id: 'first-light', name: 'FIRST LIGHT', hint: 'Log your first chapter.' },
  { id: 'archivist', name: 'ARCHIVIST', hint: 'Log every chapter and open the horizon.' },
  { id: 'completionist', name: 'COMPLETIONIST', hint: 'Recover all 32 skill fragments.' },
  { id: 'skimmer', name: 'PHOTON SKIMMER', hint: 'Survive six seconds inside 2.5 horizon radii.' },
  { id: 'speedrunner', name: 'SPEEDRUNNER', hint: 'Cross the horizon in under four minutes of ship time.' },
  { id: 'untouchable', name: 'UNTOUCHABLE', hint: 'Cross the horizon without a single reboot.' },
  { id: 'time-traveler', name: 'TIME TRAVELER', hint: 'Let fifty Earth years pass in one run.' },
  { id: 'wormhole-tourist', name: 'WORMHOLE TOURIST', hint: 'Slip through the sealed horizon three times in one run.' },
  { id: 'racer', name: 'RACER', hint: 'Finish the time trial.' },
  { id: 'hotlap', name: 'HOT LAP', hint: 'Finish the time trial in under 50 seconds.' },
  { id: 'slingshot', name: 'SLINGSHOT', hint: 'Finish the hidden course behind the singularity.' },
  { id: 'photographer', name: 'PHOTOGRAPHER', hint: 'Use photo mode.' },
  { id: 'gunner', name: 'GUNNER', hint: 'Complete a target range session.' },
  { id: 'marksman', name: 'MARKSMAN', hint: 'Score 6,000 or more on the target range.' },
  { id: 'deadeye', name: 'DEADEYE', hint: 'Finish the range with 60% accuracy over 20+ shots.' },
]

/** Persisted unlockables. Emits 'unlock' (definition) the first time each one is earned. */
export default class Achievements {
  static SAVE_KEY = 'event-horizon:achievements'

  constructor({ storage = null, definitions = ACHIEVEMENTS } = {}) {
    this.events = new Events()
    this._storage = storage
    this._definitions = definitions
    this._unlocked = new Set(this._load())
  }

  get count() { return this._unlocked.size }
  get total() { return this._definitions.length }
  get list() { return this._definitions.map(d => ({ ...d, unlocked: this._unlocked.has(d.id) })) }

  has(id) { return this._unlocked.has(id) }

  unlock(id) {
    const definition = this._definitions.find(d => d.id === id)
    if (!definition || this._unlocked.has(id)) return false
    this._unlocked.add(id)
    this._save()
    this.events.trigger('unlock', [definition])
    return true
  }

  _load() {
    if (!this._storage) return []
    try {
      const raw = this._storage.getItem(Achievements.SAVE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  _save() {
    if (!this._storage) return
    try { this._storage.setItem(Achievements.SAVE_KEY, JSON.stringify([...this._unlocked])) } catch { /* unavailable */ }
  }
}
