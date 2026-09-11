import * as THREE from 'three'
import Experience from '../Experience.js'
import { fbm } from '../utils/noise.js'
import { makeLabelSprite } from '../utils/labels.js'

const ATMOSPHERE_VERTEX = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const ATMOSPHERE_FRAGMENT = /* glsl */`
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = clamp(1.0 + dot(vNormal, vView), 0.0, 1.0);
    float glow = pow(f, uPower);
    gl_FragColor = vec4(uColor * glow * uIntensity, glow);
  }
`

/**
 * Career worlds: one textured planet per chapter, plus the moon and satellite orbiting Softtek.
 * Exposes `scannables` for the scanner/HUD and `colliders` for ship collision.
 */
export default class Planets {
  constructor(worlds) {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker

    this.scannables = []
    this.colliders = []
    this._orbiters = []
    this._spinners = []

    worlds.forEach((world, index) => this._createWorld(world, index))
    this.ticker.events.on('tick', (delta, elapsed) => this._update(delta, elapsed), 3)
  }

  _createWorld(world, index) {
    const position = new THREE.Vector3(...world.position)
    const group = new THREE.Group()
    group.position.copy(position)
    this.scene.add(group)

    const texture = planetTexture(world.palette.base, world.palette.bands, index * 17 + 3)
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.92,
      metalness: 0.0,
      emissive: new THREE.Color(world.palette.emissive),
      emissiveIntensity: 1.0,
    })
    const planet = new THREE.Mesh(new THREE.SphereGeometry(world.radius, 48, 32), material)
    planet.rotation.z = 0.15 + index * 0.1
    group.add(planet)
    this._spinners.push({ mesh: planet, rate: 0.04 + index * 0.01 })

    group.add(atmosphere(world.radius * 1.16, world.palette.atmosphere, 3.2, 1.4))

    if (world.ring) group.add(planetRing(world.radius, world.palette.atmosphere))

    const label = makeLabelSprite(world.order ? `${world.order} · ${world.name}` : world.name, { color: hexToCss(world.palette.atmosphere), width: 22, sub: world.data.period })
    label.position.y = world.radius + 8
    group.add(label)

    const scannable = {
      id: world.id, name: world.name, kind: 'planet', objectiveId: world.objectiveId,
      scanRange: world.scanRange, radius: world.radius, data: world.data, required: world.required,
      label: world.label, color: world.palette.atmosphere, order: world.order,
      getPosition: (out) => out.copy(position),
    }
    this.scannables.push(scannable)
    this.colliders.push({ getPosition: scannable.getPosition, radius: world.radius, name: world.name, damage: false })

    if (world.moon) this._createMoon(world, position)
    for (const spec of world.satellites || []) this._createSatellite(spec, position)
  }

  _createMoon(world, parentPos) {
    const moon = world.moon
    const texture = planetTexture(moon.palette.base, moon.palette.bands, 99)
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(moon.radius, 24, 18),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 1, emissive: new THREE.Color(moon.palette.emissive) })
    )
    mesh.add(atmosphere(moon.radius * 1.2, moon.palette.atmosphere, 3.5, 0.9))
    const label = makeLabelSprite(moon.order ? `${moon.order} · INTERN` : 'INTERN', { color: hexToCss(moon.palette.atmosphere), width: 12 })
    label.position.y = moon.radius + 3
    mesh.add(label)
    this.scene.add(mesh)

    const orbiter = { mesh, center: parentPos, radius: moon.orbitRadius, speed: moon.speed, angle: 1.1, tilt: 0.35 }
    this._orbiters.push(orbiter)
    this._spinners.push({ mesh, rate: 0.2 })

    const getPosition = (out) => out.copy(mesh.position)
    this.scannables.push({
      id: moon.id, name: moon.name, kind: 'moon', objectiveId: moon.objectiveId,
      scanRange: moon.scanRange, radius: moon.radius, data: moon.data, required: moon.required,
      label: moon.label, color: moon.palette.atmosphere, order: moon.order, getPosition,
    })
    this.colliders.push({ getPosition, radius: moon.radius, name: moon.name, damage: false })
  }

  /** A small orbiter around a world: a satellite (side project) or a trophy (award). */
  _createSatellite(sat, parentPos) {
    const group = sat.kind === 'trophy' ? trophyMesh(sat.color) : satelliteMesh()
    const label = makeLabelSprite(sat.label, { color: hexToCss(sat.color), width: 11 })
    label.position.y = 3.6
    group.add(label)
    this.scene.add(group)

    const orbiter = { mesh: group, center: parentPos, radius: sat.orbitRadius, speed: sat.speed, angle: sat.kind === 'trophy' ? 1.3 : 3.9, tilt: sat.kind === 'trophy' ? 0.4 : -0.5, beacon: group.userData.beacon }
    this._orbiters.push(orbiter)
    this._spinners.push({ mesh: group, rate: sat.kind === 'trophy' ? 0.8 : 0.6 })

    const getPosition = (out) => out.copy(group.position)
    this.scannables.push({
      id: sat.id, name: sat.name, kind: sat.kind, objectiveId: sat.objectiveId,
      scanRange: sat.scanRange, radius: sat.radius, data: sat.data, required: sat.required,
      label: sat.label, color: sat.color, getPosition,
    })
  }

  _update(delta, elapsed) {
    for (const s of this._spinners) s.mesh.rotation.y += delta * s.rate
    for (const o of this._orbiters) {
      o.angle += delta * o.speed
      const x = Math.cos(o.angle) * o.radius
      const z = Math.sin(o.angle) * o.radius
      o.mesh.position.set(o.center.x + x, o.center.y + Math.sin(o.angle) * o.radius * Math.sin(o.tilt), o.center.z + z)
      if (o.beacon) o.beacon.material.color.setScalar(0.5 + 0.5 * Math.sin(elapsed * 6))
    }
  }
}

function satelliteMesh() {
  const group = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.6, 2.4),
    new THREE.MeshStandardMaterial({ color: 0xd8dde6, metalness: 0.8, roughness: 0.3, emissive: 0x111a22 })
  )
  group.add(body)
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1c3f7a, metalness: 0.6, roughness: 0.4, emissive: 0x0a1f44, emissiveIntensity: 0.8 })
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 1.6), panelMat)
    panel.position.x = side * 3
    group.add(panel)
  }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a }))
  beacon.position.y = 1.2
  group.add(beacon)
  group.userData.beacon = beacon
  return group
}

/** A floating golden award: a faceted gem on a plinth inside a slow ring. */
function trophyMesh(color) {
  const group = new THREE.Group()
  const gold = new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: 0.25, emissive: 0x332000, emissiveIntensity: 1.2 })
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), gold)
  gem.scale.set(1, 1.5, 1)
  gem.position.y = 0.6
  group.add(gem)
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 0.5, 12), gold)
  plinth.position.y = -1.6
  group.add(plinth)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color }))
  ring.rotation.x = Math.PI / 2
  group.add(ring)
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff1b0 }))
  beacon.position.y = 2.6
  group.add(beacon)
  group.userData.beacon = beacon
  return group
}

function atmosphere(radius, color, power, intensity) {
  const material = new THREE.ShaderMaterial({
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: power },
      uIntensity: { value: intensity },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  })
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), material)
}

function planetRing(planetRadius, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 4
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 256, 0)
  const css = hexToCss(color)
  gradient.addColorStop(0, 'rgba(255,255,255,0)')
  gradient.addColorStop(0.15, css)
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.25)')
  gradient.addColorStop(0.55, css)
  gradient.addColorStop(0.8, 'rgba(255,255,255,0.15)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 4)
  for (let x = 0; x < 256; x += 3) {
    ctx.fillStyle = `rgba(0,0,0,${0.15 + 0.35 * fbm(x * 0.08, 0, 7)})`
    ctx.fillRect(x, 0, 2, 4)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  const inner = planetRadius * 1.45
  const outer = planetRadius * 2.5
  const geometry = new THREE.RingGeometry(inner, outer, 128, 1)
  const uv = geometry.attributes.uv
  const pos = geometry.attributes.position
  for (let i = 0; i < uv.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i))
    uv.setXY(i, (r - inner) / (outer - inner), 0.5)
  }
  geometry.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    map: texture, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false,
  }))
  mesh.rotation.x = 0.22
  mesh.rotation.z = 0.1
  return mesh
}

function planetTexture(baseCss, bandsCss, seed) {
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(w, h)
  const base = cssToRgb(baseCss)
  const bands = cssToRgb(bandsCss)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w
      const ny = y / h
      const warp = fbm(nx * 6, ny * 3, seed, 3) * 0.6
      const band = 0.5 + 0.5 * Math.sin((ny * 11 + warp) * Math.PI * 2)
      const detail = fbm(nx * 14, ny * 14, seed + 5, 4)
      const mix = Math.min(1, Math.max(0, band * 0.7 + detail * 0.5 - 0.2))
      const shade = 0.8 + detail * 0.4
      const i = (y * w + x) * 4
      image.data[i] = (base[0] + (bands[0] - base[0]) * mix) * shade
      image.data[i + 1] = (base[1] + (bands[1] - base[1]) * mix) * shade
      image.data[i + 2] = (base[2] + (bands[2] - base[2]) * mix) * shade
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.anisotropy = 4
  return texture
}

const cssToRgb = (css) => {
  const v = css.replace('#', '')
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}

const hexToCss = (hex) => '#' + hex.toString(16).padStart(6, '0')
