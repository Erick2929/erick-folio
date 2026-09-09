import * as THREE from 'three'
import Experience from '../Experience.js'
import { SHIP_LAYER } from '../Renderer.js'

const POOL = 48
const BOLT_SPEED = 150
const BOLT_LIFE = 1.4
const FIRE_INTERVAL = 1 / 7

const _dir = new THREE.Vector3()
const _pos = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3(1, 1, 1)
const _matrix = new THREE.Matrix4()
const _up = new THREE.Vector3(0, 1, 0)

/**
 * The ship's blaster: a pool of glowing bolts fired alternately from both wings. Each frame the
 * bolts advance and are handed to a `collide(position)` callback that reports whether they hit
 * something.
 */
export default class Blaster {
  constructor(ship) {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ship = ship
    this.bursts = null
    this._cooldown = 0
    this._side = 1
    this.bolts = []
    for (let i = 0; i < POOL; i++) this.bolts.push({ active: false, position: new THREE.Vector3(), velocity: new THREE.Vector3(), life: 0 })

    const geometry = new THREE.CapsuleGeometry(0.14, 1.8, 3, 8)
    const material = new THREE.MeshBasicMaterial({ color: 0x9ff2ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
    this.mesh = new THREE.InstancedMesh(geometry, material, POOL)
    this.mesh.frustumCulled = false
    this.mesh.layers.set(0)
    this.scene.add(this.mesh)
    this._hideAll()
  }

  _hideAll() {
    _matrix.compose(_pos.set(0, -9999, 0), _quat.identity(), _scale)
    for (let i = 0; i < POOL; i++) this.mesh.setMatrixAt(i, _matrix)
    this.mesh.instanceMatrix.needsUpdate = true
  }

  /** Fires one bolt if the trigger cooldown allows it. Returns true when a bolt left the ship. */
  fire() {
    if (this._cooldown > 0) return false
    const bolt = this.bolts.find(b => !b.active)
    if (!bolt) return false
    this._cooldown = FIRE_INTERVAL
    this._side = -this._side
    this.ship.getForward(_dir)
    _pos.set(this._side * 1.6, -0.05, 1.0).applyQuaternion(this.ship.quaternion).add(this.ship.position)
    bolt.active = true
    bolt.position.copy(_pos)
    bolt.velocity.copy(_dir).multiplyScalar(BOLT_SPEED).add(this.ship.velocity)
    bolt.life = BOLT_LIFE
    this.bursts?.spawn(_pos, 0x9ff2ff, 6, 4)
    return true
  }

  update(dt, collide) {
    this._cooldown = Math.max(0, this._cooldown - dt)
    this.bolts.forEach((bolt, i) => {
      if (!bolt.active) return
      bolt.life -= dt
      bolt.position.addScaledVector(bolt.velocity, dt)
      if (bolt.life <= 0 || collide?.(bolt.position)) {
        bolt.active = false
        _matrix.compose(_pos.set(0, -9999, 0), _quat.identity(), _scale)
        this.mesh.setMatrixAt(i, _matrix)
        return
      }
      _dir.copy(bolt.velocity).normalize()
      _quat.setFromUnitVectors(_up, _dir)
      _matrix.compose(bolt.position, _quat, _scale)
      this.mesh.setMatrixAt(i, _matrix)
    })
    this.mesh.instanceMatrix.needsUpdate = true
  }
}
