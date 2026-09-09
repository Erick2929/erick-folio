import * as THREE from 'three'
import Experience from '../Experience.js'

const VERTEX = /* glsl */`
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aTwinkle;
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    float twinkle = 0.75 + 0.25 * sin(uTime * aTwinkle + aSize * 10.0);
    vAlpha = twinkle;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * twinkle;
  }
`

const FRAGMENT = /* glsl */`
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * core * vAlpha, core * vAlpha);
  }
`

/** Distant stars on a sphere plus a faint galactic band. Rides along with the camera so it never parallaxes. */
export default class Starfield {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker
    this.camera = exp.camera

    this.group = new THREE.Group()
    this.group.add(this._stars(4500, 1300, 1900, false))
    this.group.add(this._stars(7000, 1500, 1800, true))
    this.scene.add(this.group)

    this.ticker.events.on('tick', (delta, elapsed) => {
      this.group.position.copy(this.camera.instance.position)
      for (const child of this.group.children) child.material.uniforms.uTime.value = elapsed
    }, 8)
  }

  _stars(count, minR, maxR, band) {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const twinkles = new Float32Array(count)
    const bandAxis = new THREE.Vector3(0.35, 1, 0.2).normalize()
    const tmp = new THREE.Vector3()
    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = minR + Math.random() * (maxR - minR)
      tmp.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi))
      if (band) {
        const along = tmp.dot(bandAxis)
        tmp.addScaledVector(bandAxis, -along * (0.85 + Math.random() * 0.1))
        tmp.addScaledVector(bandAxis, (Math.random() - 0.5) * 220 * Math.pow(Math.random(), 1.5))
      }
      positions[i * 3] = tmp.x
      positions[i * 3 + 1] = tmp.y
      positions[i * 3 + 2] = tmp.z

      const temperature = Math.random()
      if (band) color.setHSL(0.62 + Math.random() * 0.08, 0.35, 0.55 + Math.random() * 0.25)
      else if (temperature < 0.2) color.setRGB(1, 0.75, 0.55)
      else if (temperature < 0.55) color.setRGB(1, 0.96, 0.9)
      else color.setRGB(0.7, 0.82, 1)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = band ? 1.0 + Math.random() * 1.3 : 1.2 + Math.pow(Math.random(), 3.5) * 5.5
      twinkles[i] = 0.5 + Math.random() * 3
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkles, 1))
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX, fragmentShader: FRAGMENT,
      uniforms: { uTime: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    material.opacity = band ? 0.5 : 1
    const points = new THREE.Points(geometry, material)
    points.frustumCulled = false
    return points
  }
}
