import * as THREE from 'three'
import Experience from '../Experience.js'
import { gravityStrength, diskHeat } from '../Game/physics.js'

const DISK_VERTEX = /* glsl */`
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const DISK_FRAGMENT = /* glsl */`
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;
  uniform float uIntensity;
  uniform float uDetail;
  uniform vec3 uCamLocal;
  varying vec3 vLocal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * noise(p);
      p = p * 2.1 + vec2(17.3, 9.1);
      amp *= 0.5;
    }
    return v;
  }

  void main() {
    float r = length(vLocal.xz);
    float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
    float angle = atan(vLocal.z, vLocal.x);

    // Keplerian shear: inner material laps the outer material.
    float omega = 1.9 / pow(max(r / uInner, 1.0), 1.5);
    float phase = angle - uTime * omega;
    vec2 p = vec2(phase * 2.2, r * 0.42 * uDetail);
    float streaks = fbm(p + vec2(0.0, uTime * 0.05));
    float fine = noise(vec2(phase * 9.0, r * 1.1) + uTime * 0.2);
    float texture = smoothstep(0.18, 0.95, streaks * 0.85 + fine * 0.25);

    float envelope = smoothstep(0.0, 0.05, t) * pow(1.0 - t, 1.7);
    float hotRim = exp(-t * 26.0) * 0.9;

    // Relativistic beaming: the side rotating toward the viewer burns brighter and whiter.
    vec3 tangent = vec3(-vLocal.z, 0.0, vLocal.x) / max(r, 1e-4);
    vec3 view = normalize(uCamLocal - vLocal);
    float beam = dot(tangent, view);
    float beamGain = 1.0 + 0.85 * beam;

    float brightness = (envelope * (0.25 + 1.0 * texture) + hotRim) * beamGain * uIntensity;
    vec3 cold = vec3(1.0, 0.36, 0.09);
    vec3 hot = vec3(1.0, 0.86, 0.62);
    vec3 col = mix(cold, hot, pow(1.0 - t, 2.2)) * brightness;
    col = mix(col, col * vec3(0.85, 0.9, 1.05) + vec3(0.06, 0.05, 0.08) * brightness, clamp(beam, 0.0, 1.0) * 0.5);

    float alpha = clamp(brightness * 0.9, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`

/**
 * The singularity at the centre of the run: an accretion disk shader, the light it casts,
 * gravity for the ship, and the geometry the lens pass needs. The shadow itself is painted in
 * screen space (see LensShader), so no black sphere is rendered here.
 */
export default class BlackHole {
  constructor(layout) {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.camera = exp.camera
    this.ticker = exp.ticker

    this.position = new THREE.Vector3(0, 0, 0)
    this.rs = layout.rs
    this.diskInner = layout.diskInner
    this.diskOuter = layout.diskOuter
    this.halfThickness = 3
    this.gravity = { mu: 42000, rs: this.rs, cap: 45 }

    this.group = new THREE.Group()
    this.group.rotation.set(layout.tilt[0], layout.tilt[1], layout.tilt[2])
    this.scene.add(this.group)

    this._materials = []
    this._createDisk()
    this._createLight()

    this.ticker.events.on('tick', (delta, elapsed) => this._update(delta, elapsed), 4)
  }

  _diskMaterial(intensity, detail) {
    const material = new THREE.ShaderMaterial({
      vertexShader: DISK_VERTEX,
      fragmentShader: DISK_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uInner: { value: this.diskInner },
        uOuter: { value: this.diskOuter },
        uIntensity: { value: intensity },
        uDetail: { value: detail },
        uCamLocal: { value: new THREE.Vector3() },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
    this._materials.push(material)
    return material
  }

  _createDisk() {
    const main = new THREE.RingGeometry(this.diskInner, this.diskOuter, 160, 6)
    main.rotateX(-Math.PI / 2)
    this.group.add(new THREE.Mesh(main, this._diskMaterial(0.85, 1.0)))

    // A second, faintly tilted sheet gives the plasma a hint of volume when seen edge-on.
    const veil = new THREE.RingGeometry(this.diskInner * 0.96, this.diskOuter * 1.08, 160, 4)
    veil.rotateX(-Math.PI / 2)
    const veilMesh = new THREE.Mesh(veil, this._diskMaterial(0.22, 0.6))
    veilMesh.rotation.x = 0.045
    veilMesh.rotation.z = 0.02
    this.group.add(veilMesh)

    const under = veilMesh.clone()
    under.rotation.x = -0.045
    under.rotation.z = -0.02
    this.group.add(under)
  }

  _createLight() {
    this.light = new THREE.PointLight(0xffb070, 70000, 0, 2)
    this.light.position.set(0, 0, 0)
    this.light.layers.enableAll()
    this.scene.add(this.light)
  }

  /** Acceleration vector toward the singularity at `pos`, written to `out`. */
  gravityAt(pos, out) {
    out.copy(this.position).sub(pos)
    const dist = out.length()
    if (dist < 1e-4) return out.set(0, 0, 0)
    return out.multiplyScalar(gravityStrength(dist, this.gravity) / dist)
  }

  distanceTo(pos) { return pos.distanceTo(this.position) }

  /** 0..1 heat factor for a world position inside the plasma of the disk. */
  heatAt(pos) {
    const local = this.group.worldToLocal(_tmp.copy(pos))
    return diskHeat(local, { inner: this.diskInner, outer: this.diskOuter, halfThickness: this.halfThickness })
  }

  _update(delta, elapsed) {
    const camLocal = this.group.worldToLocal(_tmp.copy(this.camera.instance.position))
    for (const material of this._materials) {
      material.uniforms.uTime.value = elapsed
      material.uniforms.uCamLocal.value.copy(camLocal)
    }
    this.light.intensity = 70000 + Math.sin(elapsed * 2.3) * 4000
  }
}

const _tmp = new THREE.Vector3()
