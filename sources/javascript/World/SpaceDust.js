import * as THREE from 'three'
import Experience from '../Experience.js'

export default class SpaceDust {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker
    this.ship = exp.ship

    this._create()
    this.ticker.events.on('tick', (delta) => this._update(delta), 5)
  }

  _create() {
    const countEach = 1500

    const coldPositions = new Float32Array(countEach * 3)
    const warmPositions = new Float32Array(countEach * 3)
    this._coldVelocities = new Float32Array(countEach * 3)
    this._warmVelocities = new Float32Array(countEach * 3)

    for (let i = 0; i < countEach; i++) {
      this._randomSphericalPos(coldPositions, i, 20, 120)
      this._randomSphericalPos(warmPositions, i, 20, 120)
      this._randomDrift(this._coldVelocities, i)
      this._randomDrift(this._warmVelocities, i)
    }

    const coldGeo = new THREE.BufferGeometry()
    coldGeo.setAttribute('position', new THREE.BufferAttribute(coldPositions, 3))
    const coldMat = new THREE.PointsMaterial({
      color: 0xaabbff,
      size: 0.06,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true
    })
    this._cold = new THREE.Points(coldGeo, coldMat)
    this._coldPositions = coldPositions
    this.scene.add(this._cold)

    const warmGeo = new THREE.BufferGeometry()
    warmGeo.setAttribute('position', new THREE.BufferAttribute(warmPositions, 3))
    const warmMat = new THREE.PointsMaterial({
      color: 0xffddaa,
      size: 0.06,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    })
    this._warm = new THREE.Points(warmGeo, warmMat)
    this._warmPositions = warmPositions
    this.scene.add(this._warm)
  }

  _randomSphericalPos(arr, i, minR, maxR) {
    const r = minR + Math.random() * (maxR - minR)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    arr[i * 3 + 2] = r * Math.cos(phi)
  }

  _randomDrift(arr, i) {
    arr[i * 3]     = (Math.random() - 0.5) * 0.5
    arr[i * 3 + 1] = (Math.random() - 0.5) * 0.5
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5
  }

  _update(delta) {
    const shipPos = this.ship?.mesh?.position
    if (!shipPos) return

    const RESPAWN_DIST = 150

    for (let i = 0; i < this._coldPositions.length / 3; i++) {
      this._coldPositions[i * 3]     += this._coldVelocities[i * 3] * delta
      this._coldPositions[i * 3 + 1] += this._coldVelocities[i * 3 + 1] * delta
      this._coldPositions[i * 3 + 2] += this._coldVelocities[i * 3 + 2] * delta

      const dx = this._coldPositions[i * 3] - shipPos.x
      const dy = this._coldPositions[i * 3 + 1] - shipPos.y
      const dz = this._coldPositions[i * 3 + 2] - shipPos.z
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) > RESPAWN_DIST) {
        this._respawnAround(this._coldPositions, i, shipPos)
        this._randomDrift(this._coldVelocities, i)
      }
    }

    for (let i = 0; i < this._warmPositions.length / 3; i++) {
      this._warmPositions[i * 3]     += this._warmVelocities[i * 3] * delta
      this._warmPositions[i * 3 + 1] += this._warmVelocities[i * 3 + 1] * delta
      this._warmPositions[i * 3 + 2] += this._warmVelocities[i * 3 + 2] * delta

      const dx = this._warmPositions[i * 3] - shipPos.x
      const dy = this._warmPositions[i * 3 + 1] - shipPos.y
      const dz = this._warmPositions[i * 3 + 2] - shipPos.z
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) > RESPAWN_DIST) {
        this._respawnAround(this._warmPositions, i, shipPos)
        this._randomDrift(this._warmVelocities, i)
      }
    }

    this._cold.geometry.attributes.position.needsUpdate = true
    this._warm.geometry.attributes.position.needsUpdate = true
  }

  _respawnAround(arr, i, center) {
    const r = 20 + Math.random() * 100
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    arr[i * 3]     = center.x + r * Math.sin(phi) * Math.cos(theta)
    arr[i * 3 + 1] = center.y + r * Math.sin(phi) * Math.sin(theta)
    arr[i * 3 + 2] = center.z + r * Math.cos(phi)
  }
}
