import * as THREE from 'three'
import Experience from '../Experience.js'

const KINDS = {
  debris: { points: 100, hp: 1, radius: 2.4, color: 0xd6a06a, weight: 0.55 },
  drone: { points: 250, hp: 2, radius: 1.9, color: 0xff5c5c, weight: 0.35 },
  core: { points: 500, hp: 1, radius: 1.4, color: 0xffd27a, weight: 0.10 },
}
const ALIVE_TARGET = 8
const DESPAWN_DISTANCE = 240

const _fwd = new THREE.Vector3()
const _tmp = new THREE.Vector3()
const _side = new THREE.Vector3()

/**
 * Targets for the range: debris, drones and cores that spawn ahead of the ship while a session
 * runs. Bolts are tested against them with `hitTest`; `applyHit` scores and destroys.
 */
export default class Targets {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.bursts = null
    this.active = []
    this._pool = []
    this._running = false
    this._spawnTimer = 0
    this._glow = glowTexture()
  }

  begin() {
    this._running = true
    this._spawnTimer = 0
  }

  end() {
    this._running = false
    for (const t of [...this.active]) this._release(t)
  }

  nearest(point) {
    let best = null
    let bestDist = Infinity
    for (const t of this.active) {
      const d = t.position.distanceTo(point)
      if (d < bestDist) { bestDist = d; best = t }
    }
    return best
  }

  hitTest(point, radius) {
    for (const t of this.active) {
      const limit = t.radius + radius
      if (t.position.distanceToSquared(point) <= limit * limit) return t
    }
    return null
  }

  /** Damages a target. Returns { destroyed, points }. */
  applyHit(target) {
    target.hp--
    target.flash = 0.15
    if (target.hp > 0) return { destroyed: false, points: Math.round(target.points * 0.4) }
    this.bursts?.spawn(target.position, target.color, 46, 14)
    this._release(target)
    return { destroyed: true, points: target.points }
  }

  update(dt, ship, elapsed) {
    if (this._running) {
      this._spawnTimer -= dt
      if (this.active.length < ALIVE_TARGET && this._spawnTimer <= 0) {
        this._spawn(ship)
        this._spawnTimer = 0.45
      }
    }
    ship.getForward(_fwd)
    for (const t of [...this.active]) {
      t.age += dt
      if (t.kind === 'drone') {
        t.turn -= dt
        if (t.turn <= 0) { t.turn = 1.5 + Math.random() * 2; _side.set(Math.random() - 0.5, (Math.random() - 0.5) * 0.4, Math.random() - 0.5).normalize(); t.velocity.copy(_side).multiplyScalar(10) }
        const dist = t.position.distanceTo(ship.position)
        _tmp.copy(ship.position).sub(t.position).normalize()
        if (dist > 90) t.velocity.addScaledVector(_tmp, dt * 12)
        else if (dist < 28) t.velocity.addScaledVector(_tmp, -dt * 16)
      }
      t.position.addScaledVector(t.velocity, dt)
      t.mesh.position.copy(t.position)
      t.mesh.rotation.x += dt * t.spin
      t.mesh.rotation.y += dt * t.spin * 0.7
      if (t.flash > 0) {
        t.flash -= dt
        t.mesh.material.color.setHex(0xffffff)
        t.mesh.scale.setScalar(1.25)
      } else {
        t.mesh.material.color.setHex(t.color)
        t.mesh.scale.setScalar(1)
      }
      if (t.glow) t.glow.material.opacity = 0.55 + 0.35 * Math.sin(elapsed * 6 + t.phase)
      const far = t.position.distanceTo(ship.position) > DESPAWN_DISTANCE
      const expired = t.kind === 'core' && t.age > 7
      if (far || expired) this._release(t)
    }
  }

  _spawn(ship) {
    const kind = pickKind()
    const spec = KINDS[kind]
    const entry = this._acquire(kind, spec)
    ship.getForward(_fwd)
    const yaw = (Math.random() - 0.5) * 1.6
    const pitch = (Math.random() - 0.5) * 0.7
    _side.copy(_fwd).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
    _side.y += Math.sin(pitch)
    _side.normalize()
    const dist = 45 + Math.random() * 65
    entry.position.copy(ship.position).addScaledVector(_side, dist)
    entry.hp = spec.hp
    entry.age = 0
    entry.flash = 0
    entry.turn = 0
    entry.spin = 0.6 + Math.random() * 1.4
    entry.phase = Math.random() * 6
    if (kind === 'core') {
      _tmp.set(Math.random() - 0.5, (Math.random() - 0.5) * 0.3, Math.random() - 0.5).normalize()
      entry.velocity.copy(_tmp).multiplyScalar(26)
    } else if (kind === 'drone') {
      entry.velocity.set(0, 0, 0)
    } else {
      entry.velocity.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(2 + Math.random() * 3)
    }
    entry.mesh.visible = true
    entry.mesh.position.copy(entry.position)
    this.active.push(entry)
  }

  _acquire(kind, spec) {
    let entry = this._pool.find(p => p.kind === kind && !p.inUse)
    if (!entry) {
      entry = { kind, points: spec.points, radius: spec.radius, color: spec.color, position: new THREE.Vector3(), velocity: new THREE.Vector3(), mesh: this._buildMesh(kind, spec), glow: null, inUse: false }
      if (kind !== 'debris') {
        entry.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this._glow, color: spec.color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }))
        entry.glow.scale.set(spec.radius * 5, spec.radius * 5, 1)
        entry.mesh.add(entry.glow)
      }
      this._pool.push(entry)
    }
    entry.inUse = true
    return entry
  }

  _release(entry) {
    entry.inUse = false
    entry.mesh.visible = false
    const i = this.active.indexOf(entry)
    if (i >= 0) this.active.splice(i, 1)
  }

  _buildMesh(kind, spec) {
    let geometry
    let material
    if (kind === 'debris') {
      geometry = new THREE.IcosahedronGeometry(spec.radius, 0)
      material = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 1, emissive: 0x2a1a0a })
    } else if (kind === 'drone') {
      geometry = new THREE.OctahedronGeometry(spec.radius, 0)
      material = new THREE.MeshBasicMaterial({ color: spec.color })
    } else {
      geometry = new THREE.SphereGeometry(spec.radius, 12, 10)
      material = new THREE.MeshBasicMaterial({ color: spec.color })
    }
    const mesh = new THREE.Mesh(geometry, material)
    mesh.visible = false
    this.scene.add(mesh)
    return mesh
  }
}

function pickKind() {
  const r = Math.random()
  let acc = 0
  for (const [kind, spec] of Object.entries(KINDS)) {
    acc += spec.weight
    if (r <= acc) return kind
  }
  return 'debris'
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.3, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}
