import * as THREE from 'three'
import Experience from '../Experience.js'
import { randFloat, randInt } from '../utils/maths.js'

const PLANET_PALETTES = [
  { color: 0x050d1a, emissive: 0x000511, emissiveIntensity: 0.1, atmosphere: 0x00f0ff },  // cyber cyan
  { color: 0x1a0510, emissive: 0x110003, emissiveIntensity: 0.1, atmosphere: 0xff00aa },  // neon magenta
  { color: 0x0a051a, emissive: 0x050011, emissiveIntensity: 0.1, atmosphere: 0xaa44ff },  // void violet
  { color: 0x1a0e05, emissive: 0x110800, emissiveIntensity: 0.1, atmosphere: 0xff8800 },  // neon orange
  { color: 0x051a0a, emissive: 0x001105, emissiveIntensity: 0.1, atmosphere: 0x00ff88 },  // matrix green
]

export default class Galaxy {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker

    this.planets = []
    this._projects = []
    this._projectMarkers = []

    this._createAmbientLight()
    this._createSun()
    this._createStars()
    this._createPlanets()
    this._loadProjects()
  }

  _createAmbientLight() {
    const ambient = new THREE.AmbientLight(0x0a0a1a, 0.3)
    this.scene.add(ambient)
    this.scene.background = new THREE.Color(0x000005)
    this.scene.fog = null
  }

  _createSun() {
    const sunLight = new THREE.PointLight(0xfff4e0, 2, 0)
    sunLight.position.set(300, 100, -200)
    this.scene.add(sunLight)

    const geo = new THREE.SphereGeometry(8, 16, 16)
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff4e0 })
    const sun = new THREE.Mesh(geo, mat)
    sun.position.set(300, 100, -200)
    this.scene.add(sun)
  }

  _createStars() {
    const count = 3000
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)  // full sphere
      const r = 400 + Math.random() * 200
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 1.0,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      fog: false
    })
    this.scene.add(new THREE.Points(geo, mat))
  }

  _createPlanets() {
    const positions = [
      [80,   10,  -120],
      [-100,  30,   -80],
      [150,  -20,    60],
      [-60,  -30,   150],
      [200,   50,   -50],
      [-180,  20,  -150],
    ]
    positions.forEach((pos, i) => {
      const palette = PLANET_PALETTES[i % PLANET_PALETTES.length]
      this._placePlanet(pos[0], pos[1], pos[2], palette)
    })
  }

  _placePlanet(x, y, z, palette) {
    const radius = randFloat(8, 18)

    const geo = new THREE.SphereGeometry(radius, 32, 32)
    const mat = new THREE.MeshStandardMaterial({
      color: palette.color,
      emissive: palette.emissive,
      emissiveIntensity: palette.emissiveIntensity,
      roughness: 0.8,
      metalness: 0.1,
    })
    const planet = new THREE.Mesh(geo, mat)
    planet.position.set(x, y, z)
    this.scene.add(planet)

    // Atmosphere glow (BackSide — the neon halo is what blooms)
    const atmosGeo = new THREE.SphereGeometry(radius * 1.12, 32, 32)
    const atmosMat = new THREE.MeshBasicMaterial({
      color: palette.atmosphere,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    })
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat)
    atmosphere.position.set(x, y, z)
    this.scene.add(atmosphere)

    // Outer halo (FrontSide, wider, more subtle)
    const haloGeo = new THREE.SphereGeometry(radius * 1.25, 32, 32)
    const haloMat = new THREE.MeshBasicMaterial({
      color: palette.atmosphere,
      transparent: true,
      opacity: 0.04,
      side: THREE.FrontSide,
    })
    const halo = new THREE.Mesh(haloGeo, haloMat)
    halo.position.set(x, y, z)
    this.scene.add(halo)

    const planetData = { x, y, z, radius, project: null, mesh: planet }
    this.planets.push(planetData)

    // Self-rotation
    this.ticker.events.on('tick', (delta) => {
      planet.rotation.y += delta * 0.05
    }, 3)

    if (Math.random() > 0.5) {
      this._addMoon(planet, radius)
    }

    return planetData
  }

  _addMoon(planetMesh, planetRadius) {
    const moonRadius = randFloat(1.5, 3.5)
    const orbitRadius = planetRadius * 1.8 + randFloat(3, 8)
    const orbitSpeed = randFloat(0.2, 0.5)
    let angle = Math.random() * Math.PI * 2

    const geo = new THREE.SphereGeometry(moonRadius, 12, 12)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      emissive: 0x050d14,
      emissiveIntensity: 0.1,
      roughness: 0.9,
    })
    const moon = new THREE.Mesh(geo, mat)
    this.scene.add(moon)

    this.ticker.events.on('tick', (delta) => {
      angle += delta * orbitSpeed
      moon.position.set(
        planetMesh.position.x + Math.cos(angle) * orbitRadius,
        planetMesh.position.y,
        planetMesh.position.z + Math.sin(angle) * orbitRadius
      )
    }, 3)
  }

  _makeTextTexture(text, hexColor) {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(0,0,0,0.85)'
    ctx.fillRect(0, 0, 512, 128)
    const cssColor = '#' + hexColor.toString(16).padStart(6, '0')
    ctx.fillStyle = cssColor
    ctx.shadowColor = cssColor
    ctx.shadowBlur = 40
    ctx.font = 'bold 72px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 256, 64)
    ctx.shadowBlur = 80
    ctx.fillText(text, 256, 64)
    return new THREE.CanvasTexture(canvas)
  }

  async _loadProjects() {
    try {
      const res = await fetch('/projects.json')
      this._projects = await res.json()
    } catch {
      this._projects = []
      return
    }

    const shuffled = [...this.planets].sort(() => Math.random() - 0.5)
    for (let i = 0; i < this._projects.length && i < shuffled.length; i++) {
      shuffled[i].project = this._projects[i]
      this._addProjectMarker(shuffled[i])
    }
  }

  _addProjectMarker(planet) {
    const light = new THREE.PointLight(0x00f0ff, 2, 60)
    light.position.set(planet.x, planet.y, planet.z)
    this.scene.add(light)

    // Floating label above planet
    const tex = this._makeTextTexture('[ PROJECT ]', 0x00f0ff)
    const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true })
    const sprite = new THREE.Sprite(spriteMat)
    sprite.position.set(planet.x, planet.y + planet.radius + 6, planet.z)
    sprite.scale.set(16, 4, 1)
    this.scene.add(sprite)

    const startTime = Date.now()
    const pulse = () => {
      const t = (Date.now() - startTime) * 0.002
      light.intensity = 1.2 + Math.sin(t * 2) * 0.8
      requestAnimationFrame(pulse)
    }
    pulse()

    this._projectMarkers.push({ light, sprite })
  }

  getProjectPlanets() {
    return this.planets.filter(p => p.project !== null)
  }
}
