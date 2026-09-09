import * as THREE from 'three'
import Experience from '../Experience.js'
import { makeLabelSprite } from '../utils/labels.js'

/**
 * TEC STATION, the education chapter: a rotating ring station with a lit docking ring.
 * Docking uses the same proximity mechanic as scanning, so it exposes a scannable.
 */
export default class Station {
  constructor(layout) {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker

    this.position = new THREE.Vector3(...layout.position)
    this.group = new THREE.Group()
    this.group.position.copy(this.position)
    this.scene.add(this.group)

    this._build(layout)

    const getPosition = (out) => out.copy(this.position)
    this.scannable = {
      id: layout.id, name: layout.name, kind: 'station', objectiveId: layout.objectiveId,
      scanRange: layout.scanRange, radius: layout.radius, data: layout.data, required: layout.required,
      label: layout.label, color: 0x8fd3ff, getPosition,
    }
    this.colliders = [{ getPosition, radius: 7.5, name: layout.name, damage: false }]

    this.ticker.events.on('tick', (delta, elapsed) => this._update(delta, elapsed), 3)
  }

  _build(layout) {
    const hullMat = new THREE.MeshStandardMaterial({ color: 0xb8c2cf, metalness: 0.75, roughness: 0.35, emissive: 0x0b1420, emissiveIntensity: 0.4 })
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x4a5461, metalness: 0.6, roughness: 0.6 })
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x8fd3ff })

    this.ring = new THREE.Group()
    const torus = new THREE.Mesh(new THREE.TorusGeometry(layout.radius, 1.7, 14, 72), hullMat)
    torus.rotation.x = Math.PI / 2
    this.ring.add(torus)

    for (let i = 0; i < 6; i++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, layout.radius * 2, 8), darkMat)
      spoke.rotation.z = Math.PI / 2
      spoke.rotation.y = (i / 6) * Math.PI
      this.ring.add(spoke)
    }

    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2
      const window = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.3), glowMat)
      window.position.set(Math.cos(a) * layout.radius, 0, Math.sin(a) * layout.radius)
      window.lookAt(0, 0, 0)
      window.translateZ(-1.75)
      this.ring.add(window)
    }
    this.group.add(this.ring)

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 7, 12), hullMat)
    this.group.add(hub)
    const hubBand = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 0.4, 12), glowMat)
    this.group.add(hubBand)

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 12, 8), darkMat)
    mast.position.y = 9
    this.group.add(mast)

    this.dock = new THREE.Mesh(new THREE.TorusGeometry(5, 0.28, 8, 48), new THREE.MeshBasicMaterial({ color: 0x8fd3ff }))
    this.dock.rotation.x = Math.PI / 2
    this.dock.position.y = 15
    this.group.add(this.dock)

    this.beacon = new THREE.PointLight(0x8fd3ff, 160, 60, 2)
    this.beacon.position.y = 15
    this.beacon.layers.enableAll()
    this.group.add(this.beacon)

    const label = makeLabelSprite('TEC STATION', { color: '#8fd3ff', width: 24, sub: 'EDUCATION · 2020 — PRESENT' })
    label.position.y = 24
    this.group.add(label)
  }

  _update(delta, elapsed) {
    this.ring.rotation.y += delta * 0.12
    const pulse = 0.55 + 0.45 * Math.sin(elapsed * 3)
    this.dock.material.color.setRGB(0.35 + 0.25 * pulse, 0.7 + 0.15 * pulse, 1.0)
    this.beacon.intensity = 90 + 90 * pulse
  }
}
