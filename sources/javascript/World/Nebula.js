import * as THREE from 'three'
import Experience from '../Experience.js'

const CLOUDS = [
  { center: [-200, 20, 100],  color: 0x220044, count: 2000 },
  { center: [150, -40, -180], color: 0x001133, count: 1500 },
  { center: [0, 100, -250],   color: 0x330011, count: 1200 },
]

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
        const r = Math.pow(Math.random(), 0.5) * 80
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        positions[i * 3]     = cloud.center[0] + r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = cloud.center[1] + r * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = cloud.center[2] + r * Math.cos(phi)
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const mat = new THREE.PointsMaterial({
        color: cloud.color,
        size: 2.5,
        transparent: true,
        opacity: 0.18,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      this.scene.add(new THREE.Points(geo, mat))
    }
  }
}
