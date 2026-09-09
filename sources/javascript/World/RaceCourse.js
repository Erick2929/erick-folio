import * as THREE from 'three'
import Experience from '../Experience.js'
import { makeLabelSprite } from '../utils/labels.js'
import { buildBeacon, animateBeacon } from './Beacon.js'

const COLORS = { next: 0xffb35c, upcoming: 0x5b6470, passed: 0x4fd18a }
const _tmp = new THREE.Vector3()

/**
 * Race beacons and gate rings for every course. Gates stay hidden until a course is shown.
 * `courses` holds resolved world-space gate positions for the Race rules to consume.
 */
export default class RaceCourse {
  constructor(layout, blackHole) {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker
    this._blackHole = blackHole

    this.courses = {}
    this.beacons = []
    this._gateMeshes = {}
    this._beaconGroups = []
    this._activeCourse = null
    this._nextIndex = 0

    for (const [id, course] of Object.entries(layout.courses)) this._buildCourse(id, course)
    this.ticker.events.on('tick', (delta, elapsed) => this._update(delta, elapsed), 3)
  }

  _resolve(gate) {
    const p = new THREE.Vector3(...gate.position)
    return gate.local ? this._blackHole.group.localToWorld(p) : p
  }

  _buildCourse(id, course) {
    const gates = course.gates.map((g) => ({ position: this._resolve(g), radius: g.radius, axis: g.axis || null }))
    this.courses[id] = { name: course.name, gates }

    const group = new THREE.Group()
    group.visible = false
    this.scene.add(group)
    const meshes = gates.map((gate, i) => this._buildGate(group, gates, gate, i))
    this._gateMeshes[id] = { group, meshes }

    const beaconPos = new THREE.Vector3(...course.beacon)
    this._buildBeacon(beaconPos, course, id)
  }

  _buildGate(group, gates, gate, index) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(gate.radius, 0.45, 10, 56),
      new THREE.MeshBasicMaterial({ color: COLORS.upcoming, transparent: true, opacity: 0.85 })
    )
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(gate.radius * 0.96, 40),
      new THREE.MeshBasicMaterial({ color: COLORS.next, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
    )
    const holder = new THREE.Group()
    holder.position.copy(gate.position)
    holder.add(ring)
    holder.add(disc)

    if (gate.axis === 'y') {
      holder.rotation.x = Math.PI / 2
    } else {
      const prev = gates[index - 1]?.position ?? gates[index + 1]?.position ?? gate.position
      const next = gates[index + 1]?.position ?? gate.position
      _tmp.copy(next).sub(prev)
      if (_tmp.lengthSq() < 1e-6) _tmp.set(0, 0, 1)
      holder.lookAt(gate.position.clone().add(_tmp))
    }

    const label = makeLabelSprite(String(index + 1), { color: '#ffb35c', width: 7 })
    label.position.set(0, gate.radius + 3, 0)
    if (gate.axis === 'y') label.position.set(0, 0, -(gate.radius + 3))
    holder.add(label)
    group.add(holder)
    return { holder, ring, disc, label }
  }

  _buildBeacon(position, course, courseId) {
    this._beaconGroups.push(buildBeacon(this.scene, position, { label: course.beaconLabel, sub: course.hidden ? 'HIDDEN COURSE' : 'HOLD POSITION TO START' }))

    this.beacons.push({
      id: `race-${courseId}`, kind: 'race', courseId, name: course.name, objectiveId: null,
      scanRange: 16, radius: 4, data: null, required: false, label: course.name, color: 0xffb35c,
      getPosition: (out) => out.copy(position),
    })
  }

  showCourse(courseId) {
    this.hideCourse()
    const entry = this._gateMeshes[courseId]
    if (!entry) return
    entry.group.visible = true
    this._activeCourse = courseId
    this.setNextGate(0)
  }

  hideCourse() {
    if (!this._activeCourse) return
    this._gateMeshes[this._activeCourse].group.visible = false
    this._activeCourse = null
  }

  setNextGate(index) {
    if (!this._activeCourse) return
    this._nextIndex = index
    this._gateMeshes[this._activeCourse].meshes.forEach((m, i) => {
      const state = i < index ? 'passed' : i === index ? 'next' : 'upcoming'
      m.ring.material.color.setHex(COLORS[state])
      m.ring.material.opacity = state === 'upcoming' ? 0.5 : 0.95
      m.disc.material.opacity = state === 'next' ? 0.12 : 0
      m.label.material.opacity = state === 'passed' ? 0.3 : 0.95
    })
  }

  nextGatePosition(out) {
    const gate = this.courses[this._activeCourse]?.gates[this._nextIndex]
    return gate ? out.copy(gate.position) : null
  }

  _update(delta, elapsed) {
    for (const b of this._beaconGroups) animateBeacon(b, elapsed)
    if (!this._activeCourse) return
    const next = this._gateMeshes[this._activeCourse].meshes[this._nextIndex]
    if (next) {
      const s = 1 + 0.06 * Math.sin(elapsed * 6)
      next.ring.scale.setScalar(s)
      next.disc.material.opacity = 0.08 + 0.08 * Math.sin(elapsed * 6)
    }
  }
}
