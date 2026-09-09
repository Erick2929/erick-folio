import * as THREE from 'three'
import Experience from '../Experience.js'

const CLOUDS = [
  { center: [-420, 60, 260], color: 0x1a0f4a, count: 2600, spread: 190 },
  { center: [380, -90, -420], color: 0x082a3a, count: 2200, spread: 170 },
  { center: [60, 180, -520], color: 0x3a0f1e, count: 1800, spread: 150 },
  { center: [-260, -140, -380], color: 0x2a1a05, count: 1600, spread: 140 },
]

/** Soft additive dust clouds far outside the play area. Pure set dressing. */
export default class Nebula {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this._createClouds()
  }

  _createClouds() {
    for (const cloud of CLOUDS) {
      const positions = new Float32Array(cloud.count * 3)
      for (let i = 0; i < cloud.count; i++) {
        const r = Math.pow(Math.random(), 0.6) * cloud.spread
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        positions[i * 3] = cloud.center[0] + r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = cloud.center[1] + r * Math.sin(phi) * Math.sin(theta) * 0.55
        positions[i * 3 + 2] = cloud.center[2] + r * Math.cos(phi)
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const material = new THREE.PointsMaterial({
        color: cloud.color, size: 7, transparent: true, opacity: 0.16,
        sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
      })
      this.scene.add(new THREE.Points(geometry, material))
    }
  }
}
