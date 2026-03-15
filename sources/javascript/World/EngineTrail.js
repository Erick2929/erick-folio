import * as THREE from 'three'
import { randFloat, lerp } from '../utils/maths.js'

const PARTICLE_COUNT = 450

const vertexShader = /* glsl */ `
attribute float aOpacity;
varying float vOpacity;
void main() {
  vOpacity = aOpacity;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aOpacity * 2.5 * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentShader = /* glsl */ `
varying float vOpacity;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  gl_FragColor = vec4(0.0, 0.8, 1.0, vOpacity * 0.85);
}
`

// Local-space nozzle positions matching Ship.js
const NOZZLES = [
  new THREE.Vector3(0,    0, 1.2),
  new THREE.Vector3(-0.8, 0, 1.0),
  new THREE.Vector3( 0.8, 0, 1.0),
]

export default class EngineTrail {
  constructor(scene, shipMesh) {
    this.scene = scene
    this.shipMesh = shipMesh

    // Parallel flat arrays
    this.positions  = new Float32Array(PARTICLE_COUNT * 3)
    this.velocities = new Float32Array(PARTICLE_COUNT * 3)
    this.ages       = new Float32Array(PARTICLE_COUNT)
    this.lifetimes  = new Float32Array(PARTICLE_COUNT)
    this.opacities  = new Float32Array(PARTICLE_COUNT)

    // Hide all particles initially
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.positions[i * 3 + 1] = -9999
      this.lifetimes[i] = 1
      this.ages[i] = 1 // treat as dead
    }

    this._head = 0
    this._worldNozzle = new THREE.Vector3()

    this._buildMesh()
  }

  _buildMesh() {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geo.setAttribute('aOpacity', new THREE.BufferAttribute(this.opacities, 1))

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      transparent: true,
    })

    this.points = new THREE.Points(geo, mat)
    this.points.frustumCulled = false
    this.scene.add(this.points)
  }

  update(delta, normalizedSpeed, boost, shipVelocity) {
    // Ensure matrixWorld is current
    this.shipMesh.updateMatrixWorld(false)

    const spawnPerEngine = Math.floor(lerp(0, boost ? 3 : 2, normalizedSpeed))

    for (const localNozzle of NOZZLES) {
      this._worldNozzle.copy(localNozzle).applyMatrix4(this.shipMesh.matrixWorld)

      for (let s = 0; s < spawnPerEngine; s++) {
        const slot = this._head % PARTICLE_COUNT
        this._head++

        const si = slot * 3
        this.positions[si]     = this._worldNozzle.x + randFloat(-0.02, 0.02)
        this.positions[si + 1] = this._worldNozzle.y + randFloat(-0.02, 0.02)
        this.positions[si + 2] = this._worldNozzle.z + randFloat(-0.02, 0.02)

        // Tight stream: minimal lateral spread, slow backward drift
        const spread = boost ? 0.08 : 0.05
        this.velocities[si]     = shipVelocity.x * -0.1 + randFloat(-spread, spread)
        this.velocities[si + 1] = shipVelocity.y * -0.1 + randFloat(-spread, spread)
        this.velocities[si + 2] = shipVelocity.z * -0.1 + randFloat(-spread, spread)

        this.ages[slot]      = 0
        this.lifetimes[slot] = randFloat(boost ? 0.1 : 0.2, boost ? 0.25 : 0.45)
        this.opacities[slot] = 1.0
      }
    }

    // Advance all particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (this.ages[i] >= this.lifetimes[i]) continue

      this.ages[i] += delta
      if (this.ages[i] >= this.lifetimes[i]) {
        this.positions[i * 3 + 1] = -9999
        this.opacities[i] = 0
        continue
      }

      const t = this.ages[i] / this.lifetimes[i]
      const vi = i * 3
      this.positions[vi]     += this.velocities[vi]     * delta
      this.positions[vi + 1] += this.velocities[vi + 1] * delta
      this.positions[vi + 2] += this.velocities[vi + 2] * delta
      this.opacities[i] = 1.0 - t
    }

    this.points.geometry.attributes.position.needsUpdate = true
    this.points.geometry.attributes.aOpacity.needsUpdate = true
  }

  dispose() {
    this.scene.remove(this.points)
    this.points.geometry.dispose()
    this.points.material.dispose()
  }
}
