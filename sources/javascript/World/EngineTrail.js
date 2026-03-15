import * as THREE from 'three'
import { lerp, randFloat } from '../utils/maths.js'

const PARTICLE_COUNT = 300

const vertexShader = /* glsl */`
  attribute float aOpacity;
  varying float vOpacity;

  void main() {
    vOpacity = aOpacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aOpacity * 1.2 * (200.0 / -mvPosition.z);
  }
`

const fragmentShader = /* glsl */`
  varying float vOpacity;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = (1.0 - d * 2.0) * vOpacity * 0.22;
    gl_FragColor = vec4(0.0, 0.55, 0.8, alpha);
  }
`

export default class EngineTrail {
  constructor(scene, shipMesh) {
    this.scene = scene
    this.shipMesh = shipMesh

    this.positions = new Float32Array(PARTICLE_COUNT * 3)
    this.opacities = new Float32Array(PARTICLE_COUNT)
    this.lifetimes = new Float32Array(PARTICLE_COUNT)
    this.maxLifetimes = new Float32Array(PARTICLE_COUNT)
    this.velocities = new Float32Array(PARTICLE_COUNT * 3)

    // All particles start dead
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      this.lifetimes[i] = -1
      this.opacities[i] = 0
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geo.setAttribute('aOpacity', new THREE.BufferAttribute(this.opacities, 1))

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.points = new THREE.Points(geo, mat)
    this.points.frustumCulled = false
    this.scene.add(this.points)

    this._slot = 0
    this._engineOffsets = [
      new THREE.Vector3(-0.8, 0, 1.0), // left wing
      new THREE.Vector3(0.8, 0, 1.0),  // right wing
    ]
  }

  update(delta, normalizedSpeed, boost) {
    const isIdle = normalizedSpeed < 0.05
    const spawnPerEngine = 1 + Math.floor(lerp(0, boost ? 2 : 1, normalizedSpeed))

    // Spawn new particles
    for (const offset of this._engineOffsets) {
      for (let s = 0; s < spawnPerEngine; s++) {
        const slot = this._slot % PARTICLE_COUNT
        this._slot++

        // World position of engine exit
        const worldPos = offset.clone().applyMatrix4(this.shipMesh.matrixWorld)

        this.positions[slot * 3]     = worldPos.x + (Math.random() - 0.5) * 0.1
        this.positions[slot * 3 + 1] = worldPos.y + (Math.random() - 0.5) * 0.1
        this.positions[slot * 3 + 2] = worldPos.z + (Math.random() - 0.5) * 0.1

        // Drift velocity — mostly backward along world -Z of ship
        const spread = 0.3
        this.velocities[slot * 3]     = (Math.random() - 0.5) * spread
        this.velocities[slot * 3 + 1] = (Math.random() - 0.5) * spread * 0.5
        this.velocities[slot * 3 + 2] = (Math.random() - 0.5) * spread

        const maxLife = isIdle
          ? randFloat(0.35, 0.6)
          : randFloat(boost ? 0.1 : 0.18, boost ? 0.22 : 0.4)

        this.maxLifetimes[slot] = maxLife
        this.lifetimes[slot] = maxLife
        this.opacities[slot] = isIdle ? 0.18 : (boost ? 0.7 : 0.4)
      }
    }

    // Age all particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (this.lifetimes[i] <= 0) {
        this.opacities[i] = 0
        continue
      }
      this.lifetimes[i] -= delta
      const t = Math.max(0, this.lifetimes[i] / this.maxLifetimes[i])
      this.opacities[i] *= (1 - delta * 2.5) // fade out
      if (this.opacities[i] < 0.01) this.opacities[i] = 0

      // Drift
      this.positions[i * 3]     += this.velocities[i * 3]     * delta
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * delta
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * delta
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
