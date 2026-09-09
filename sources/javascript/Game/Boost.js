const EMPTY_FLOOR = 0.02

/**
 * The ship's boost reserve: drains while boosting, recharges only while the key is released, and once emptied
 * refuses to fire again until it is back to `relockAt` so the player never gets a stuttering
 * half-second of boost. Fuel cells refill it and grant overdrive: boost that does not drain.
 */
export default class BoostReserve {
  constructor({ boostSeconds = 6, rechargeSeconds = 5, relockAt = 0.25 } = {}) {
    this.boostSeconds = boostSeconds
    this.rechargeSeconds = rechargeSeconds
    this.relockAt = relockAt
    this.reset()
  }

  reset() {
    this.energy = 1
    this.locked = false
    this.overdrive = 0
    this._pressed = false
  }

  get canBoost() {
    return this.overdrive > 0 || (!this.locked && this.energy > 0)
  }

  refuel(overdriveSeconds = 15) {
    this.energy = 1
    this.locked = false
    this.overdrive = Math.max(this.overdrive, overdriveSeconds)
  }

  /** Returns { boosting, denied }. `denied` is true only on the first frame of a refused press. */
  update(dt, wants) {
    if (this.overdrive > 0) this.overdrive = Math.max(0, this.overdrive - dt)
    let boosting = false
    let denied = false
    if (wants) {
      if (this.canBoost) boosting = true
      else if (!this._pressed) denied = true
      this._pressed = true
    } else {
      this._pressed = false
    }

    if (boosting && this.overdrive <= 0) {
      this.energy -= dt / this.boostSeconds
      if (this.energy <= EMPTY_FLOOR) {
        this.energy = 0
        this.locked = true
      }
    } else if (!wants) {
      this.energy = Math.min(1, this.energy + dt / this.rechargeSeconds)
      if (this.locked && this.energy >= this.relockAt) this.locked = false
    }
    return { boosting, denied }
  }
}
