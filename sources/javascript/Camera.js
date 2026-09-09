import * as THREE from 'three'
import Experience from './Experience.js'
import { lerp } from './utils/maths.js'

const _desired = new THREE.Vector3()
const _look = new THREE.Vector3()
const _matrix = new THREE.Matrix4()
const _quat = new THREE.Quaternion()
const _fwd = new THREE.Vector3()
const _up = new THREE.Vector3()

/**
 * Two modes: a slow cinematic orbit of the singularity for the title screen, and a lagging
 * chase camera behind the ship that widens its field of view on boost and shakes on damage.
 */
export default class Camera {
  constructor() {
    const exp = Experience.getInstance()
    this.sizes = exp.sizes
    this.scene = exp.scene
    this.ticker = exp.ticker

    this.mode = 'cinematic'
    this.baseFov = 62
    this.shake = 0
    this._position = new THREE.Vector3(0, 60, 190)
    this._smoothUp = new THREE.Vector3(0, 1, 0)
    this._fovTarget = this.baseFov

    this.instance = new THREE.PerspectiveCamera(this.baseFov, this.sizes.ratio, 0.1, 3000)
    this.instance.position.copy(this._position)
    this.instance.layers.enableAll()
    this.scene.add(this.instance)

    this.sizes.events.on('resize', () => {
      this.instance.aspect = this.sizes.ratio
      this.instance.updateProjectionMatrix()
    })
    this.ticker.events.on('tick', (delta, elapsed) => this._update(delta, elapsed), 7)
  }

  followTarget(ship) { this._ship = ship }

  setMode(mode) { this.mode = mode }

  addShake(amount) { this.shake = Math.min(1.5, this.shake + amount) }

  /** Jumps the chase camera behind the ship immediately (after spawns and wormhole slips). */
  snapTo(ship) {
    if (this.mode !== 'chase') return
    ship.getForward(_fwd)
    ship.getUp(_up)
    this._position.copy(ship.position).addScaledVector(_fwd, -11).addScaledVector(_up, 3.4)
    this.instance.position.copy(this._position)
    this._smoothUp.copy(_up)
  }

  _update(delta, elapsed) {
    if (this.mode === 'cinematic' || !this._ship) this._updateCinematic(delta, elapsed)
    else this._updateChase(delta)

    this.shake = Math.max(0, this.shake - delta * 2.2)
    if (this.shake > 0.001) {
      const s = this.shake * 0.45
      this.instance.position.x += (Math.random() - 0.5) * s
      this.instance.position.y += (Math.random() - 0.5) * s
      this.instance.position.z += (Math.random() - 0.5) * s
    }

    const fov = lerp(this.instance.fov, this._fovTarget, 1 - Math.pow(0.02, delta))
    if (Math.abs(fov - this.instance.fov) > 0.01) {
      this.instance.fov = fov
      this.instance.updateProjectionMatrix()
    }
  }

  _updateCinematic(delta, elapsed) {
    const angle = elapsed * 0.06
    const radius = 175
    _desired.set(Math.cos(angle) * radius, 34 + Math.sin(elapsed * 0.13) * 18, Math.sin(angle) * radius)
    this._position.lerp(_desired, 1 - Math.pow(0.05, delta))
    this.instance.position.copy(this._position)
    this._smoothUp.set(0, 1, 0)
    _matrix.lookAt(this._position, _look.set(0, 0, 0), this._smoothUp)
    _quat.setFromRotationMatrix(_matrix)
    this.instance.quaternion.slerp(_quat, 1 - Math.pow(0.02, delta))
    this._fovTarget = this.baseFov
  }

  _updateChase(delta) {
    const ship = this._ship
    ship.getForward(_fwd)
    ship.getUp(_up)

    const boost = ship.boostAmount
    _desired.copy(ship.position).addScaledVector(_fwd, -11 - boost * 2.5).addScaledVector(_up, 3.4)
    const rate = 5.5 - boost * 1.5
    this._position.lerp(_desired, 1 - Math.pow(Math.exp(-rate), delta))
    this.instance.position.copy(this._position)

    this._smoothUp.lerp(_up, 1 - Math.pow(0.02, delta)).normalize()
    _look.copy(ship.position).addScaledVector(_fwd, 9)
    _matrix.lookAt(this._position, _look, this._smoothUp)
    _quat.setFromRotationMatrix(_matrix)
    this.instance.quaternion.slerp(_quat, 1 - Math.pow(0.001, delta))

    this._fovTarget = this.baseFov + boost * 14 + ship.speedNorm * 3
  }
}
