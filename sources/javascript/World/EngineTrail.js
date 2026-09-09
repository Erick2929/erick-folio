import * as THREE from 'three'
import { SHIP_LAYER } from '../Renderer.js'
import { lerp, randFloat } from '../utils/maths.js'

const PARTICLE_COUNT = 420

const vertexShader = /* glsl */`
  attribute float aOpacity;
  attribute float aHeat;
  varying float vOpacity;
  varying float vHeat;
  void main() {
    vOpacity = aOpacity;
    vHeat = aHeat;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (0.5 + aOpacity * 1.0 + aHeat * 0.8) * (130.0 / max(-mvPosition.z, 1.0));
  }
`

const fragmentShader = /* glsl */`
  varying float vOpacity;
  varying float vHeat;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = (1.0 - d * 2.0) * vOpacity * 0.11;
    vec3 cool = vec3(0.35, 0.75, 1.0);
    vec3 hot = vec3(1.0, 0.92, 0.8);
    gl_FragColor = vec4(mix(cool, hot, vHeat) * (0.7 + 0.3 * vHeat), alpha);
  }
`

/** Exhaust particles behind both engines. Runs hotter and denser while boosting. */
export default class EngineTrail {
  constructor(scene, shipGroup) {
    this.scene = scene
    this.shipGroup = shipGroup

    this.positions = new Float32Array(PARTICLE_COUNT * 3)
    this.opacities = new Float32Array(PARTICLE_COUNT)
    this.heat = new Float32Array(PARTICLE_COUNT)
    this.lifetimes = new Float32Array(PARTICLE_COUNT)
    this.velocities = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) this.lifetimes[i] = -1

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(this.opacities, 1))
    geometry.setAttribute('aHeat', new THREE.BufferAttribute(this.heat, 1))
    const material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    this.points = new THREE.Points(geometry, material)
    this.points.frustumCulled = false
    this.points.layers.set(SHIP_LAYER)
    this.scene.add(this.points)

    this._slot = 0
    this._engineOffsets = [new THREE.Vector3(-1.0, -0.05, -2.3), new THREE.Vector3(1.0, -0.05, -2.3)]
    this._world = new THREE.Vector3()
    this._back = new THREE.Vector3()
  }

  update(delta, speedNorm, boost) {
    const idle = speedNorm < 0.04
    const perEngine = idle ? 1 : 1 + Math.floor(lerp(0, 2, Math.max(speedNorm, boost)))
    this._back.set(0, 0, -1).applyQuaternion(this.shipGroup.quaternion)

    for (const offset of this._engineOffsets) {
      this._world.copy(offset).applyMatrix4(this.shipGroup.matrixWorld)
      for (let s = 0; s < perEngine; s++) {
        const i = this._slot++ % PARTICLE_COUNT
        this.positions[i * 3] = this._world.x + (Math.random() - 0.5) * 0.15
        this.positions[i * 3 + 1] = this._world.y + (Math.random() - 0.5) * 0.15
        this.positions[i * 3 + 2] = this._world.z + (Math.random() - 0.5) * 0.15
        const kick = 3 + boost * 6
        this.velocities[i * 3] = this._back.x * kick + (Math.random() - 0.5) * 0.6
        this.velocities[i * 3 + 1] = this._back.y * kick + (Math.random() - 0.5) * 0.6
        this.velocities[i * 3 + 2] = this._back.z * kick + (Math.random() - 0.5) * 0.6
        this.lifetimes[i] = idle ? randFloat(0.3, 0.5) : randFloat(0.25, 0.5 + boost * 0.3)
        this.opacities[i] = idle ? 0.1 : 0.3 + boost * 0.4
        this.heat[i] = boost
      }
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (this.lifetimes[i] <= 0) { this.opacities[i] = 0; continue }
      this.lifetimes[i] -= delta
      this.opacities[i] *= 1 - delta * 2.4
      this.positions[i * 3] += this.velocities[i * 3] * delta
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * delta
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * delta
    }

    const attrs = this.points.geometry.attributes
    attrs.position.needsUpdate = true
    attrs.aOpacity.needsUpdate = true
    attrs.aHeat.needsUpdate = true
  }
}
