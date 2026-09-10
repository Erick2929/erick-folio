import * as THREE from 'three'
import { scannerProgress } from './physics.js'

const SCAN_SECONDS = 2.2
const COOLDOWN_SECONDS = 8
const _pos = new THREE.Vector3()

/**
 * Proximity scanner. Each frame it picks the nearest available target within range and fills a
 * progress bar while the ship stays close; leaving range drains it. Docking at the station uses
 * the same rule, so the player learns one mechanic. Story chapters out of order are reported as
 * `locked` instead of scanned, so the HUD can point the player to the right one.
 */
export default class Scanner {
  constructor(scannables, ship, run) {
    this._scannables = scannables
    this._ship = ship
    this._run = run
    this.target = null
    this.progress = 0
    this._lastTickBucket = 0
    this._cooldowns = new Map()
    this._clock = 0
    this.locked = null
  }

  reset() {
    this.target = null
    this.progress = 0
    this._lastTickBucket = 0
  }

  /**
   * Returns { completed, ticked, locked }: the scannable that just finished (or null), whether a
   * tick sound is due, and the nearest in-range chapter that is out of story order (or null).
   */
  update(delta) {
    this._clock += delta
    let nearest = null
    let nearestDist = Infinity
    let locked = null
    let lockedDist = Infinity
    for (const s of this._scannables) {
      if (s.objectiveId && this._run.isObjectiveDone(s.objectiveId)) continue
      if ((this._cooldowns.get(s.id) || 0) > this._clock) continue
      s.getPosition(_pos)
      const surface = _pos.distanceTo(this._ship.position) - s.radius
      if (surface >= s.scanRange) continue
      if (s.objectiveId && !this._run.isObjectiveAvailable(s.objectiveId)) {
        if (surface < lockedDist) { locked = s; lockedDist = surface }
        continue
      }
      if (surface < nearestDist) {
        nearest = s
        nearestDist = surface
      }
    }
    this.locked = locked

    if (nearest !== this.target) {
      if (nearest) {
        this.target = nearest
        this.progress = 0
      }
    }

    const inRange = nearest !== null && nearest === this.target
    if (!this.target) return { completed: null, ticked: false, locked }

    this.progress = scannerProgress(this.progress, inRange, delta, SCAN_SECONDS)
    const bucket = Math.floor(this.progress * 8)
    const ticked = inRange && bucket !== this._lastTickBucket
    this._lastTickBucket = bucket

    if (this.progress >= 1) {
      const completed = this.target
      this._cooldowns.set(completed.id, this._clock + COOLDOWN_SECONDS)
      this.target = null
      this.progress = 0
      this._lastTickBucket = 0
      return { completed, ticked: false, locked }
    }
    if (!inRange && this.progress <= 0) this.target = null
    return { completed: null, ticked, locked }
  }
}
