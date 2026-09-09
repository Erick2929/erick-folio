import * as THREE from 'three'
import Experience from '../Experience.js'

const COUNT = 600

const VERTEX = /* glsl */`
  attribute float aLife;
  attribute vec3 aColor;
  varying float vLife;
  varying vec3 vColor;
  void main() {
    vLife = aLife;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.0 + aLife * 6.0) * (160.0 / max(-mv.z, 1.0));
  }
`

const FRAGMENT = /* glsl */`
  varying float vLife;
  varying vec3 vColor;
  void main() {
    if (vLife <= 0.0) discard;
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = (1.0 - d * 2.0) * vLife;
    gl_FragColor = vec4(vColor * (0.6 + vLife), alpha);
  }
`

/** Pooled spark bursts for pickups, impacts and scans. */
export default class Burst {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker

    this.positions = new Float32Array(COUNT * 3)
    this.velocities = new Float32Array(COUNT * 3)
    this.life = new Float32Array(COUNT)
    this.decay = new Float32Array(COUNT)
    this.colors = new Float32Array(COUNT * 3)
    this._slot = 0

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    geometry.setAttribute('aLife', new THREE.BufferAttribute(this.life, 1))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3))
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX, fragmentShader: FRAGMENT,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    this.points = new THREE.Points(geometry, material)
    this.points.frustumCulled = false
    this.scene.add(this.points)

    this.ticker.events.on('tick', (delta) => this._update(delta), 6)
  }

  spawn(position, color, count = 26, speed = 10) {
    const c = new THREE.Color(color)
    for (let n = 0; n < count; n++) {
      const i = this._slot++ % COUNT
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const s = speed * (0.3 + Math.random() * 0.7)
      this.positions[i * 3] = position.x
      this.positions[i * 3 + 1] = position.y
      this.positions[i * 3 + 2] = position.z
      this.velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * s
      this.velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * s
      this.velocities[i * 3 + 2] = Math.cos(phi) * s
      this.life[i] = 1
      this.decay[i] = 1.2 + Math.random() * 1.4
      this.colors[i * 3] = c.r
      this.colors[i * 3 + 1] = c.g
      this.colors[i * 3 + 2] = c.b
    }
  }

  _update(delta) {
    for (let i = 0; i < COUNT; i++) {
      if (this.life[i] <= 0) continue
      this.life[i] = Math.max(0, this.life[i] - delta * this.decay[i])
      this.positions[i * 3] += this.velocities[i * 3] * delta
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * delta
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * delta
      this.velocities[i * 3] *= 0.96
      this.velocities[i * 3 + 1] *= 0.96
      this.velocities[i * 3 + 2] *= 0.96
    }
    this.points.geometry.attributes.position.needsUpdate = true
    this.points.geometry.attributes.aLife.needsUpdate = true
    this.points.geometry.attributes.aColor.needsUpdate = true
  }
}
