import * as THREE from 'three'
import Experience from '../Experience.js'
import { TUTORIAL_STEPS } from '../Game/Tutorial.js'

/** The three flight-school stars, placed in the spawn frame so they sit ahead of a new pilot. */
export default class TutorialStars {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker
    this.stars = TUTORIAL_STEPS.map((step, i) => this._build(i))
    this.ticker.events.on('tick', (delta, elapsed) => this._update(delta, elapsed), 3)
  }

  _build(index) {
    const group = new THREE.Group()
    group.visible = false
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(2.2, 0), new THREE.MeshBasicMaterial({ color: 0xfff1b0 }))
    group.add(core)
    const shell = new THREE.Mesh(new THREE.OctahedronGeometry(3.4, 0), new THREE.MeshBasicMaterial({ color: 0xffb35c, transparent: true, opacity: 0.25, depthWrite: false }))
    group.add(shell)
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd27a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }))
    glow.scale.set(22, 22, 1)
    group.add(glow)
    const light = new THREE.PointLight(0xffd27a, 200, 40, 2)
    light.layers.enableAll()
    group.add(light)
    this.scene.add(group)
    return { group, core, shell, glow }
  }

  /** Positions the stars relative to a spawn { position, lookAt }. */
  place(spawn) {
    const forward = spawn.lookAt.clone().sub(spawn.position).normalize()
    const up = new THREE.Vector3(0, 1, 0)
    const right = new THREE.Vector3().crossVectors(forward, up).normalize()
    TUTORIAL_STEPS.forEach((step, i) => {
      const [r, u, f] = step.offset
      this.stars[i].group.position.copy(spawn.position).addScaledVector(right, r).addScaledVector(up, u).addScaledVector(forward, f)
    })
  }

  show(index) {
    this.stars.forEach((s, i) => { s.group.visible = i === index })
  }

  hideAll() { this.show(-1) }

  positionOf(index, out) { return out.copy(this.stars[index].group.position) }

  _update(delta, elapsed) {
    for (const s of this.stars) {
      if (!s.group.visible) continue
      s.core.rotation.y += delta * 1.5
      s.core.rotation.x += delta * 0.7
      s.shell.rotation.y -= delta * 0.9
      const pulse = 1 + 0.12 * Math.sin(elapsed * 4)
      s.shell.scale.setScalar(pulse)
      s.glow.material.opacity = 0.7 + 0.25 * Math.sin(elapsed * 3)
    }
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
  g.addColorStop(0.25, 'rgba(255,220,150,0.6)')
  g.addColorStop(1, 'rgba(255,200,120,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  _glow = new THREE.CanvasTexture(c)
  return _glow
}
