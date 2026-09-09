import * as THREE from 'three'
import Experience from '../Experience.js'
import BlackHole from './BlackHole.js'
import Starfield from './Starfield.js'
import Nebula from './Nebula.js'
import SpaceDust from './SpaceDust.js'
import Planets from './Planets.js'
import Station from './Station.js'
import Asteroids from './Asteroids.js'
import Fragments from './Fragments.js'
import Burst from './Burst.js'
import RaceCourse from './RaceCourse.js'
import FuelCells from './FuelCells.js'
import Targets from './Targets.js'
import Blaster from './Blaster.js'
import { buildBeacon, animateBeacon } from './Beacon.js'
import { LAYOUT, HIDDEN_FRAGMENTS, EDUCATION } from '../data/profile.js'

/** Assembles every object in the run and hands the ship what it needs to fly through them. */
export default class World {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.layout = LAYOUT
    this.bounds = LAYOUT.bounds

    this._lights()
    this.blackHole = new BlackHole(LAYOUT.blackHole)
    this.starfield = new Starfield()
    this.nebula = new Nebula()
    this.dust = new SpaceDust()
    this.planets = new Planets(LAYOUT.worlds)
    this.station = new Station(LAYOUT.station)

    const beltWorld = LAYOUT.worlds.find(w => w.belt)
    this.asteroids = beltWorld ? new Asteroids({ center: beltWorld.position, ...beltWorld.belt }) : null

    this.raceCourse = new RaceCourse(LAYOUT.race, this.blackHole)
    this.fuelCells = new FuelCells(LAYOUT.fuelCells)

    const rangePos = new THREE.Vector3(...LAYOUT.range.beacon)
    this.rangeBeacon = buildBeacon(this.scene, rangePos, { label: 'TARGET RANGE', sub: 'HOLD POSITION TO START', color: 0xff5c5c })
    exp.ticker.events.on('tick', (delta, elapsed) => animateBeacon(this.rangeBeacon, elapsed), 3)
    this.rangeScannable = {
      id: 'range-beacon', kind: 'range', name: 'TARGET RANGE', objectiveId: null, scanRange: 16, radius: 4,
      data: null, required: false, label: 'TARGET RANGE', color: 0xff5c5c, getPosition: (out) => out.copy(rangePos),
    }
    this.targets = new Targets()
    this.blaster = new Blaster(exp.ship)

    this.scannables = [...this.planets.scannables, this.station.scannable, ...this.raceCourse.beacons, this.rangeScannable]
    this.colliders = [...this.planets.colliders, ...this.station.colliders]

    this.fragments = new Fragments({ groups: this._fragmentGroups(), hidden: this._hiddenFragments() })
    this.bursts = new Burst()
    this.targets.bursts = this.bursts
    this.blaster.bursts = this.bursts

    exp.ship.setWorld(this)
  }

  _lights() {
    const hemi = new THREE.HemisphereLight(0x3a4a70, 0x140a04, 0.55)
    hemi.layers.enableAll()
    this.scene.add(hemi)
    const rim = new THREE.DirectionalLight(0x8fb4ff, 0.35)
    rim.position.set(-200, 300, -100)
    rim.layers.enableAll()
    this.scene.add(rim)
  }

  _fragmentGroups() {
    const groups = []
    LAYOUT.worlds.forEach((world, i) => {
      groups.push({
        worldId: world.id, center: world.position, radius: world.radius + 9,
        skills: world.data.skills, color: world.palette.atmosphere, tilt: 0.3 + i * 0.4, phase: i,
      })
      if (world.moon) {
        groups.push({
          worldId: world.moon.id, center: world.position, radius: world.radius + 17,
          skills: world.moon.data.skills, color: world.moon.palette.atmosphere, tilt: -0.6, phase: 0.5,
        })
      }
      if (world.satellite) {
        groups.push({
          worldId: world.satellite.id, center: world.position, radius: world.radius + 25,
          skills: world.satellite.data.skills, color: 0xffd27a, tilt: 1.2, phase: 2.2,
        })
      }
    })
    groups.push({
      worldId: LAYOUT.station.id, center: LAYOUT.station.position, radius: LAYOUT.station.radius + 12,
      skills: EDUCATION.flatMap(e => e.skills), color: 0x8fd3ff, tilt: 0.1, phase: 1,
    })
    return groups
  }

  _hiddenFragments() {
    const stationPos = new THREE.Vector3(...LAYOUT.station.position)
    const behindStation = stationPos.clone().addScaledVector(stationPos.clone().normalize(), 28)
    return HIDDEN_FRAGMENTS.map((h) => {
      if (h.id === 'hidden-3dprint' && this.asteroids) return { ...h, position: this.asteroids.hidingSpot() }
      if (h.id === 'hidden-diy') return { ...h, position: behindStation.toArray() }
      return h
    })
  }

  /** Where a run begins: outside the oldest chapter, nose pointed at the singularity. */
  spawnPoint() {
    const world = LAYOUT.worlds.find(w => w.id === LAYOUT.spawn.worldId)
    const pos = new THREE.Vector3(...world.position)
    const outward = pos.clone().normalize()
    const side = new THREE.Vector3(0, 1, 0).cross(outward).normalize()
    const spawn = pos.clone().addScaledVector(outward, LAYOUT.spawn.offset).addScaledVector(side, 30)
    spawn.y += 18
    // Aim past the planet's flank: straight ahead scans ORIGIN and clears its debris belt.
    const lookAt = pos.clone().addScaledVector(side, 26)
    lookAt.y = spawn.y
    return { position: spawn, lookAt }
  }

  /** A random safe spot on the rim of the system, facing inward. Used after wormhole slips. */
  rimPoint() {
    const angle = Math.random() * Math.PI * 2
    const r = 380
    const position = new THREE.Vector3(Math.cos(angle) * r, (Math.random() - 0.5) * 60, Math.sin(angle) * r)
    return { position, lookAt: new THREE.Vector3(0, 0, 0) }
  }
}
