import * as THREE from 'three'
import Experience from '../Experience.js'

const PICKUP_RADIUS = 4.5
const MAGNET_RADIUS = 16
const MAGNET_SPEED = 22
const RESPAWN_SECONDS = 45

/**
 * Glowing fuel cells scattered along the routes. They drift toward a nearby ship, refill the
 * boost reserve on contact and come back after a while.
 */
export default class FuelCells {
  constructor(positions) {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.cells = positions.map((p, i) => this._build(new THREE.Vector3(...p), i))
  }

  _build(home, index) {
    const group = new THREE.Group()
    group.position.copy(home)
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.55, 1.4, 4, 12),
      new THREE.MeshBasicMaterial({ color: 0x9ff2ff })
    )
    group.add(body)
    const cage = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.08, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.8 })
    )
    cage.rotation.x = Math.PI / 2
    group.add(cage)
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x8fd3ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }))
    glow.scale.set(9, 9, 1)
    group.add(glow)
    this.scene.add(group)
    return { home, group, glow, active: true, respawnAt: 0, phase: index * 1.7 }
  }

  reset(elapsed = 0) {
    for (const c of this.cells) {
      c.active = true
      c.group.visible = true
      c.group.position.copy(c.home)
    }
  }

  /** Animates the cells and returns those the ship collected this frame. */
  update(delta, shipPos, elapsed, canCollect = true) {
    const picked = []
    for (const c of this.cells) {
      if (!c.active) {
        if (elapsed >= c.respawnAt) {
          c.active = true
          c.group.visible = true
          c.group.position.copy(c.home)
        }
        continue
      }
      const dist = c.group.position.distanceTo(shipPos)
      if (canCollect && dist < MAGNET_RADIUS) {
        const step = Math.min(dist, MAGNET_SPEED * delta * (1.5 - dist / MAGNET_RADIUS))
        c.group.position.lerp(shipPos, dist > 1e-4 ? step / dist : 1)
      } else {
        c.group.position.lerp(c.home, 1 - Math.pow(0.05, delta))
      }
      if (canCollect && dist < PICKUP_RADIUS) {
        c.active = false
        c.group.visible = false
        c.respawnAt = elapsed + RESPAWN_SECONDS
        picked.push(c)
        continue
      }
      c.group.rotation.y = elapsed * 1.2 + c.phase
      c.group.position.y += Math.sin(elapsed * 2 + c.phase) * delta * 0.6
      c.glow.material.opacity = 0.65 + 0.3 * Math.sin(elapsed * 3 + c.phase)
    }
    return picked
  }
}

let _glow = null
function glowTexture() {
  if (_glow) return _glow
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.2, 'rgba(160,230,255,0.7)')
  g.addColorStop(0.6, 'rgba(120,200,255,0.15)')
  g.addColorStop(1, 'rgba(120,200,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  _glow = new THREE.CanvasTexture(c)
  return _glow
}
