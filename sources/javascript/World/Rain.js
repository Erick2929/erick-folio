import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Rain {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker
    this.ship = exp.ship

    this._create()
    this.ticker.events.on('tick', (delta) => this._update(delta), 5)
  }

  _create() {
    const count = 3000
    const positions = new Float32Array(count * 3)
    const spread = 200

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = Math.random() * 60 + 5
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: 0x4488aa,
      size: 0.08,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    })

    this.particles = new THREE.Points(geo, mat)
    this.positions = positions
    this.scene.add(this.particles)
  }

  _update(delta) {
    const pos = this.positions
    const count = pos.length / 3
    const shipPos = this.ship?.mesh?.position

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= 25 * delta // fall speed

      if (pos[i * 3 + 1] < -5) {
        // Respawn around ship
        const cx = shipPos ? shipPos.x : 0
        const cz = shipPos ? shipPos.z : 0
        pos[i * 3 + 0] = cx + (Math.random() - 0.5) * 200
        pos[i * 3 + 1] = (shipPos?.y ?? 10) + 40 + Math.random() * 20
        pos[i * 3 + 2] = cz + (Math.random() - 0.5) * 200
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true
  }
}
