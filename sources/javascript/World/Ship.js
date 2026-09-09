import * as THREE from 'three'
import Experience from '../Experience.js'
import Events from '../Events.js'
import EngineTrail from './EngineTrail.js'
import BoostReserve from '../Game/Boost.js'
import { SHIP_LAYER } from '../Renderer.js'
import { lerp, clamp } from '../utils/maths.js'

const YAW_RATE = 1.75
const PITCH_RATE = 1.35
const CRUISE_SPEED = 26
const BOOST_SPEED = 54
const SHIP_RADIUS = 1.6
const HULL_MAX = 100
const HIT_GRACE_SECONDS = 0.6
const DEBRIS_HIT_MAX = 18

const _fwd = new THREE.Vector3()
const _up = new THREE.Vector3()
const _right = new THREE.Vector3()
const _target = new THREE.Vector3()
const _gravity = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _n = new THREE.Vector3()
const _c = new THREE.Vector3()
const _m = new THREE.Matrix4()
const _hit = { normal: new THREE.Vector3(), depth: 0, rock: null }

/**
 * The player's ship: quaternion flight model with yaw, pitch, thrust, a boost reserve, hull,
 * gravity from the singularity, and collisions with worlds and debris.
 *
 * Events: 'damage' (amount, source), 'destroyed', 'horizon', 'collide' (impact, name), 'bounds' (outside),
 * 'boost-denied' (the reserve refused a press).
 */
export default class Ship {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker
    this.input = exp.input
    this.camera = exp.camera
    this.renderer = exp.renderer
    this.events = new Events()

    this.group = new THREE.Group()
    this.position = this.group.position
    this.quaternion = this.group.quaternion
    this.velocity = new THREE.Vector3()
    this.hull = HULL_MAX
    this.reserve = new BoostReserve({ boostSeconds: 6, rechargeSeconds: 5, relockAt: 0.25 })
    this.boostAmount = 0
    this.speedNorm = 0
    this.pull = 0
    this.heat = 0
    this.locked = true
    this.outOfBounds = false
    this.destroyed = false
    this._yawVel = 0
    this._pitchVel = 0
    this._bank = 0
    this._sinceDamage = 10
    this._sinceHit = 10
    this._horizonArmed = true
    this._checkpoint = { position: new THREE.Vector3(0, 0, 300), lookAt: new THREE.Vector3(0, 0, 0) }
    this._world = null

    this._createMesh()
    this.scene.add(this.group)
    this.trail = new EngineTrail(this.scene, this.group)
    this.camera.followTarget(this)

    this.ticker.events.on('tick', (delta, elapsed) => this._update(delta, elapsed), 2)
  }

  _createMesh() {
    const hull = new THREE.MeshStandardMaterial({ color: 0xc9d3df, metalness: 0.82, roughness: 0.28, emissive: 0x101820, emissiveIntensity: 0.6 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x2b3440, metalness: 0.7, roughness: 0.5 })
    const glass = new THREE.MeshStandardMaterial({ color: 0x143a5a, metalness: 0.4, roughness: 0.1, emissive: 0x1b78b8, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 })
    const amber = new THREE.MeshBasicMaterial({ color: 0xffb35c })
    const engineGlow = new THREE.MeshBasicMaterial({ color: 0x3f8fb4 })

    const model = new THREE.Group()
    this.model = model

    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.95, 4.4, 6), hull)
    fuselage.rotation.x = Math.PI / 2
    fuselage.rotation.y = Math.PI / 6
    model.add(fuselage)

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 2.4), dark)
    spine.position.set(0, 0.35, -0.6)
    model.add(spine)

    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), glass)
    cockpit.scale.set(1, 0.7, 1.5)
    cockpit.position.set(0, 0.42, 0.55)
    model.add(cockpit)

    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, 1.4), hull)
      wing.position.set(side * 1.75, -0.05, -0.55)
      wing.rotation.y = side * 0.42
      wing.rotation.z = side * -0.08
      model.add(wing)

      const strip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.08), amber)
      strip.position.set(side * 1.9, 0.0, -0.05)
      strip.rotation.y = side * 0.42
      model.add(strip)

      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 1.5, 8), dark)
      pod.rotation.x = Math.PI / 2
      pod.position.set(side * 1.0, -0.05, -1.35)
      model.add(pod)

      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.25, 8), engineGlow)
      nozzle.rotation.x = Math.PI / 2
      nozzle.position.set(side * 1.0, -0.05, -2.15)
      model.add(nozzle)
    }

    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 1.2), hull)
    fin.position.set(0, 0.75, -1.4)
    fin.rotation.x = 0.35
    model.add(fin)

    this.engineLight = new THREE.PointLight(0x9fe6ff, 40, 9, 2)
    this.engineLight.position.set(0, 0, -2.3)
    model.add(this.engineLight)

    const fill = new THREE.PointLight(0xffd9b0, 30, 9, 2)
    fill.position.set(0, 2.5, 1.5)
    model.add(fill)

    model.traverse((o) => o.layers.set(SHIP_LAYER))
    this.group.add(model)
  }

  setWorld(world) { this._world = world }

  getForward(out) { return out.set(0, 0, 1).applyQuaternion(this.quaternion) }
  getUp(out) { return out.set(0, 1, 0).applyQuaternion(this.quaternion) }
  getRight(out) { return out.set(1, 0, 0).applyQuaternion(this.quaternion) }

  get boostEnergy() { return this.reserve.energy }

  /** Fuel cell pickup: full reserve plus a window of overdrive. */
  refuel(overdriveSeconds = 15) { this.reserve.refuel(overdriveSeconds) }

  get distanceToHorizon() {
    return this._world ? this._world.blackHole.distanceTo(this.position) - this._world.blackHole.rs : Infinity
  }

  lock() { this.locked = true }
  unlock() { this.locked = false }

  setCheckpoint(position, lookAt) {
    this._checkpoint.position.copy(position)
    this._checkpoint.lookAt.copy(lookAt)
  }

  /** Places the ship at `position` facing `lookAt`, at rest. */
  teleport(position, lookAt) {
    this.position.copy(position)
    _m.lookAt(lookAt, position, _up.set(0, 1, 0))
    this.quaternion.setFromRotationMatrix(_m)
    this.velocity.set(0, 0, 0)
    this._yawVel = 0
    this._pitchVel = 0
    this._horizonArmed = true
    this.camera.snapTo?.(this)
  }

  spawnAt(position, lookAt) {
    this.setCheckpoint(position, lookAt)
    this.teleport(position, lookAt)
  }

  respawn() {
    this.teleport(this._checkpoint.position, this._checkpoint.lookAt)
    this.hull = HULL_MAX
    this.reserve.reset()
    this.destroyed = false
    this._sinceDamage = 10
  }

  damage(amount, source = 'impact') {
    if (this.destroyed || this.locked) return
    this.hull = Math.max(0, this.hull - amount)
    this._sinceDamage = 0
    this.events.trigger('damage', [amount, source])
    if (this.hull <= 0) {
      this.destroyed = true
      this.locked = true
      this.events.trigger('destroyed')
    }
  }

  _update(delta, elapsed) {
    if (!this.locked) this._fly(delta)
    else this.velocity.multiplyScalar(Math.pow(0.2, delta))

    this.position.addScaledVector(this.velocity, delta)
    if (!this.locked) this._collide()

    this.speedNorm = clamp(this.velocity.length() / BOOST_SPEED, 0, 1)
    this._sinceDamage += delta
    this._sinceHit += delta
    if (this._sinceDamage > 3 && !this.destroyed) this.hull = Math.min(HULL_MAX, this.hull + 5 * delta)

    const targetBank = -this._yawVel * 0.55
    this._bank = lerp(this._bank, targetBank, 1 - Math.pow(0.001, delta))
    this.model.rotation.z = this._bank
    this.model.rotation.x = lerp(this.model.rotation.x, -this._pitchVel * 0.12, 1 - Math.pow(0.001, delta))

    const pulse = 0.85 + Math.sin(elapsed * 14) * 0.15
    this.engineLight.intensity = (3 + this.speedNorm * 12 + this.boostAmount * 20) * pulse
    this.trail.update(delta, this.speedNorm, this.boostAmount)
  }

  _fly(delta) {
    const input = this.input
    const smooth = 1 - Math.pow(0.0025, delta)
    this._yawVel = lerp(this._yawVel, input.yaw * YAW_RATE, smooth)
    this._pitchVel = lerp(this._pitchVel, input.pitch * PITCH_RATE, smooth)

    _q.setFromAxisAngle(_up.set(0, 1, 0), this._yawVel * delta)
    this.quaternion.multiply(_q)
    _q.setFromAxisAngle(_right.set(1, 0, 0), -this._pitchVel * delta)
    this.quaternion.multiply(_q)

    // Gentle auto-level so long yaw+pitch combos never leave the player flying upside down.
    this.getRight(_right)
    const rollError = _right.y
    if (Math.abs(rollError) > 0.001) {
      _q.setFromAxisAngle(_fwd.set(0, 0, 1), -rollError * 1.4 * delta)
      this.quaternion.multiply(_q)
    }
    this.quaternion.normalize()

    const { boosting, denied } = this.reserve.update(delta, input.boost && input.thrust >= 0)
    if (denied) this.events.trigger('boost-denied')
    this.boostAmount = lerp(this.boostAmount, boosting ? 1 : 0, 1 - Math.pow(0.006, delta))

    const thrust = boosting ? 1 : input.thrust
    const maxSpeed = lerp(CRUISE_SPEED, BOOST_SPEED, this.boostAmount)
    this.getForward(_fwd)
    _target.copy(_fwd).multiplyScalar(thrust * maxSpeed)
    this.velocity.lerp(_target, 1 - Math.pow(0.07, delta))

    if (this._world) {
      const bh = this._world.blackHole
      bh.gravityAt(this.position, _gravity)
      this.pull = _gravity.length()
      this.velocity.addScaledVector(_gravity, delta)

      this.heat = bh.heatAt(this.position)
      if (this.heat > 0) this.damage(this.heat * 16 * delta, 'heat')

      const dist = bh.distanceTo(this.position)
      if (dist < bh.rs * 1.08 && this._horizonArmed) {
        this._horizonArmed = false
        this.events.trigger('horizon')
      } else if (dist > bh.rs * 3) {
        this._horizonArmed = true
      }

      const outside = dist > this._world.bounds
      if (outside) {
        _c.copy(bh.position).sub(this.position).normalize()
        this.velocity.addScaledVector(_c, 26 * delta)
      }
      if (outside !== this.outOfBounds) {
        this.outOfBounds = outside
        this.events.trigger('bounds', [outside])
      }
    }
  }

  _collide() {
    if (!this._world) return
    for (const collider of this._world.colliders) {
      collider.getPosition(_c)
      const dist = _c.distanceTo(this.position)
      const limit = collider.radius + SHIP_RADIUS
      if (dist < limit) {
        _n.copy(this.position).sub(_c).normalize()
        this.position.copy(_c).addScaledVector(_n, limit + 0.05)
        const into = -this.velocity.dot(_n)
        if (into > 0) {
          this.velocity.addScaledVector(_n, into * 1.35)
          this.events.trigger('collide', [into, collider.name])
          if (into > 14) this.damage(Math.min(20, (into - 10) * 0.8), collider.name)
        }
      }
    }

    const belt = this._world.asteroids
    if (belt && belt.collide(this.position, SHIP_RADIUS, _hit)) {
      this.position.addScaledVector(_hit.normal, _hit.depth + 0.1)
      const into = -this.velocity.dot(_hit.normal)
      if (into > 0) {
        this.velocity.addScaledVector(_hit.normal, into * 1.5)
        this.events.trigger('collide', [into, 'debris'])
        if (this._sinceHit > HIT_GRACE_SECONDS) {
          this._sinceHit = 0
          this.damage(Math.min(DEBRIS_HIT_MAX, 6 + into * 0.4), 'debris')
        }
      }
    }
  }
}
