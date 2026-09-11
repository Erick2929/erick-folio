import * as THREE from 'three'
import Experience from '../Experience.js'
import { makeLabelSprite } from '../utils/labels.js'
import { planetTexture, atmosphere, planetRing, hexToCss } from './planetVisuals.js'
import { createMoon, createSatellite } from './Orbiters.js'

/**
 * Career worlds: one textured planet per chapter plus whatever orbits it (moons, satellites,
 * trophies). Exposes `scannables` for the scanner/HUD and `colliders` for ship collision.
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

    if (world.moon) this._adopt(createMoon(this.scene, { ...world.moon, shortLabel: 'INTERN' }, position))
    for (const spec of world.satellites || []) this._adopt(createSatellite(this.scene, spec, position))
  }

  _adopt(orbiter) {
    this._orbiters.push(orbiter)
    this.scannables.push(orbiter.scannable)
    if (orbiter.collider) this.colliders.push(orbiter.collider)
  }

  _update(delta, elapsed) {
    for (const s of this._spinners) s.mesh.rotation.y += delta * s.rate
    for (const o of this._orbiters) o.update(delta, elapsed)
  }
}
