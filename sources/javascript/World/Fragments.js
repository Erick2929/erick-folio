import * as THREE from 'three'
import Experience from '../Experience.js'

const _pos = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _matrix = new THREE.Matrix4()
const _euler = new THREE.Euler()
const _color = new THREE.Color()

const COLLECT_RADIUS = 4.2

/**
 * Skill fragments: collectible crystals ringed around each world plus a few hidden ones.
 * `update()` returns the fragments the ship swept up this frame.
 */
export default class Fragments {
  constructor({ groups, hidden }) {
    const exp = Experience.getInstance()
    this.scene = exp.scene

    this.all = []
    groups.forEach((group) => this._ringOf(group))
    hidden.forEach((h) => this.all.push({
      id: h.id, skill: h.skill, hidden: true, hint: h.hint,
      position: new THREE.Vector3(...h.position), color: new THREE.Color(0xffffff),
      collected: false, glow: 0, phase: Math.random() * 6.28,
    }))

    this.total = this.all.length
    this._build()
  }

  _ringOf({ center, radius, skills, color, tilt = 0.4, phase = 0, worldId }) {
    const c = new THREE.Vector3(...center)
    const normal = new THREE.Vector3(Math.sin(tilt), Math.cos(tilt), 0).normalize()
    const seed = Math.abs(normal.x) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)
    const u = seed.cross(normal).normalize()
    const v = new THREE.Vector3().crossVectors(normal, u)
    skills.forEach((skill, i) => {
      const a = phase + (i / skills.length) * Math.PI * 2
      const p = c.clone().addScaledVector(u, Math.cos(a) * radius).addScaledVector(v, Math.sin(a) * radius)
      this.all.push({
        id: `${worldId}-${i}`, skill, worldId, hidden: false,
        position: p, color: new THREE.Color(color), collected: false, glow: 0, phase: a,
      })
    })
  }

  _build() {
    const geometry = new THREE.OctahedronGeometry(1.1, 0)
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
    this.mesh = new THREE.InstancedMesh(geometry, material, this.total)
    this.mesh.frustumCulled = false
    this.all.forEach((f, i) => {
      this.mesh.setColorAt(i, f.color)
      _matrix.compose(f.position, _quat.identity(), _scale.setScalar(1))
      this.mesh.setMatrixAt(i, _matrix)
    })
    this.mesh.instanceColor.needsUpdate = true
    this.scene.add(this.mesh)

    const coreGeometry = new THREE.OctahedronGeometry(0.45, 0)
    this.core = new THREE.InstancedMesh(coreGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }), this.total)
    this.core.frustumCulled = false
    this.all.forEach((f, i) => {
      _matrix.compose(f.position, _quat.identity(), _scale.setScalar(1))
      this.core.setMatrixAt(i, _matrix)
    })
    this.scene.add(this.core)
  }

  /** Puts every fragment back for a new run. */
  reset() {
    this.all.forEach((f, i) => {
      f.collected = false
      f.glow = 0
      this.mesh.setColorAt(i, f.color)
      _matrix.compose(f.position, _quat.identity(), _scale.setScalar(1))
      this.mesh.setMatrixAt(i, _matrix)
      this.core.setMatrixAt(i, _matrix)
    })
    this.mesh.instanceColor.needsUpdate = true
    this.mesh.instanceMatrix.needsUpdate = true
    this.core.instanceMatrix.needsUpdate = true
  }

  /** Brightens fragments within `range` of `point` for a moment (the scanner pulse). */
  pulse(point, range = 160) {
    for (const f of this.all) {
      if (!f.collected && f.position.distanceTo(point) < range) f.glow = 1
    }
  }

  get remaining() { return this.all.filter(f => !f.collected) }

  /** Animates every fragment; sweeps up those within reach of `shipPos` when `canCollect` is true. */
  update(delta, shipPos, elapsed, canCollect = true) {
    const collected = []
    this.all.forEach((f, i) => {
      if (f.collected) return
      if (canCollect && f.position.distanceTo(shipPos) < COLLECT_RADIUS) {
        f.collected = true
        collected.push(f)
        _matrix.compose(f.position, _quat.identity(), _scale.setScalar(0))
        this.mesh.setMatrixAt(i, _matrix)
        this.core.setMatrixAt(i, _matrix)
        return
      }
      f.glow = Math.max(0, f.glow - delta * 0.7)
      const bob = Math.sin(elapsed * 1.6 + f.phase) * 0.5
      _pos.copy(f.position)
      _pos.y += bob
      _euler.set(elapsed * 0.9 + f.phase, elapsed * 1.3 + f.phase, 0)
      _quat.setFromEuler(_euler)
      const s = 1 + f.glow * 0.7 + (f.hidden ? 0.15 : 0)
      _matrix.compose(_pos, _quat, _scale.setScalar(s))
      this.mesh.setMatrixAt(i, _matrix)
      _matrix.compose(_pos, _quat, _scale.setScalar(s * (0.9 + 0.25 * Math.sin(elapsed * 5 + f.phase))))
      this.core.setMatrixAt(i, _matrix)
      if (f.glow > 0) {
        _color.copy(f.color).lerp(_white, f.glow * 0.8)
        this.mesh.setColorAt(i, _color)
        this.mesh.instanceColor.needsUpdate = true
      }
    })
    this.mesh.instanceMatrix.needsUpdate = true
    this.core.instanceMatrix.needsUpdate = true
    return collected
  }
}

const _white = new THREE.Color(0xffffff)
