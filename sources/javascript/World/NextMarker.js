import * as THREE from 'three'
import Experience from '../Experience.js'
import { makeLabelSprite } from '../utils/labels.js'

const _pos = new THREE.Vector3()

/**
 * The big amber diamond and numeral that hover above the next chapter of the story.
 * `setTarget(scannable)` moves it; it follows moving targets (the Softtek moon) every frame.
 */
export default class NextMarker {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker
    this._target = null

    this.group = new THREE.Group()
    this.group.visible = false

    const amber = 0xffb35c
    this.diamond = new THREE.Mesh(
      new THREE.OctahedronGeometry(3.2, 0),
      new THREE.MeshBasicMaterial({ color: amber, transparent: true, opacity: 0.28, depthWrite: false })
    )
    this.diamond.scale.set(1, 1.6, 1)
    this.group.add(this.diamond)
    this.edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(this.diamond.geometry),
      new THREE.LineBasicMaterial({ color: amber, transparent: true, opacity: 0.95 })
    )
    this.edges.scale.copy(this.diamond.scale)
    this.group.add(this.edges)

    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.35, 12, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: amber, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    )
    this.beam.position.y = -9
    this.group.add(this.beam)

    this.light = new THREE.PointLight(amber, 300, 50, 2)
    this.light.layers.enableAll()
    this.group.add(this.light)

    this.numeral = null
    this.scene.add(this.group)
    this.ticker.events.on('tick', (delta, elapsed) => this._update(delta, elapsed), 3)
  }

  setTarget(scannable) {
    this._target = scannable || null
    this.group.visible = !!scannable
    if (this.numeral) { this.group.remove(this.numeral); this.numeral.material.map.dispose(); this.numeral.material.dispose(); this.numeral = null }
    if (!scannable) return
    this.numeral = makeLabelSprite(String(scannable.order ?? '•'), { color: '#ffb35c', width: 14 })
    this.numeral.position.y = 8.5
    this.group.add(this.numeral)
  }

  _update(delta, elapsed) {
    if (!this._target) return
    this._target.getPosition(_pos)
    const lift = (this._target.radius ?? 4) + 16
    this.group.position.set(_pos.x, _pos.y + lift + Math.sin(elapsed * 1.8) * 1.2, _pos.z)
    this.diamond.rotation.y = elapsed * 0.9
    this.edges.rotation.y = elapsed * 0.9
    const pulse = 1 + 0.08 * Math.sin(elapsed * 3.2)
    this.diamond.scale.set(pulse, 1.6 * pulse, pulse)
    this.edges.scale.copy(this.diamond.scale)
    this.light.intensity = 220 + 120 * Math.sin(elapsed * 3.2)
    this.beam.material.opacity = 0.25 + 0.15 * Math.sin(elapsed * 3.2)
  }
}
