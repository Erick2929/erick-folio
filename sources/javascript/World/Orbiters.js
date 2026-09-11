import * as THREE from 'three'
import { makeLabelSprite } from '../utils/labels.js'
import { planetTexture, atmosphere, hexToCss } from './planetVisuals.js'

/**
 * Things that circle a bigger body: moons (chapters), satellites (side projects) and trophies
 * (awards). Each factory returns { object, scannable, collider, update } so planets and the
 * station can host any mix of them.
 */
export function createMoon(scene, spec, center) {
  const texture = planetTexture(spec.palette.base, spec.palette.bands, 99 + spec.orbitRadius)
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(spec.radius, 24, 18),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 1, emissive: new THREE.Color(spec.palette.emissive) })
  )
  mesh.add(atmosphere(spec.radius * 1.2, spec.palette.atmosphere, 3.5, 0.9))
  const label = makeLabelSprite(spec.order ? `${spec.order} · ${spec.shortLabel || spec.name}` : (spec.shortLabel || spec.name), { color: hexToCss(spec.palette.atmosphere), width: 12 })
  label.position.y = spec.radius + 3
  mesh.add(label)
  scene.add(mesh)

  const orbit = { angle: spec.angle ?? 1.1, radius: spec.orbitRadius, speed: spec.speed, tilt: spec.tilt ?? 0.35 }
  const getPosition = (out) => out.copy(mesh.position)
  return {
    object: mesh,
    scannable: {
      id: spec.id, name: spec.name, kind: 'moon', objectiveId: spec.objectiveId, scanRange: spec.scanRange,
      radius: spec.radius, data: spec.data, required: spec.required, label: spec.label,
      color: spec.palette.atmosphere, order: spec.order, getPosition,
    },
    collider: { getPosition, radius: spec.radius, name: spec.name, damage: false },
    update(delta, elapsed) {
      orbit.angle += delta * orbit.speed
      mesh.position.set(center.x + Math.cos(orbit.angle) * orbit.radius, center.y + Math.sin(orbit.angle) * orbit.radius * Math.sin(orbit.tilt), center.z + Math.sin(orbit.angle) * orbit.radius)
      mesh.rotation.y += delta * 0.2
    },
  }
}

export function createSatellite(scene, spec, center) {
  const group = spec.kind === 'trophy' ? trophyMesh(spec.color) : satelliteMesh()
  let label = makeLabelSprite(spec.label, { color: hexToCss(spec.color), width: 11 })
  label.position.y = 3.6
  group.add(label)
  scene.add(group)

  const orbit = { angle: spec.angle ?? (spec.kind === 'trophy' ? 1.3 : 3.9), radius: spec.orbitRadius, speed: spec.speed, tilt: spec.tilt ?? (spec.kind === 'trophy' ? 0.4 : -0.5) }
  const getPosition = (out) => out.copy(group.position)
  const scannable = {
    id: spec.id, name: spec.name, kind: spec.kind, objectiveId: spec.objectiveId, scanRange: spec.scanRange,
    radius: spec.radius, data: spec.data, required: spec.required, label: spec.label, color: spec.color, getPosition,
    /** Easter-egg trophies show a "?" until scanned. */
    reveal() {
      if (!spec.revealLabel) return
      group.remove(label)
      label = makeLabelSprite(spec.revealLabel, { color: hexToCss(spec.color), width: 11 })
      label.position.y = 3.6
      group.add(label)
    },
  }
  return {
    object: group,
    scannable,
    collider: null,
    update(delta, elapsed) {
      orbit.angle += delta * orbit.speed
      group.position.set(center.x + Math.cos(orbit.angle) * orbit.radius, center.y + Math.sin(orbit.angle) * orbit.radius * Math.sin(orbit.tilt), center.z + Math.sin(orbit.angle) * orbit.radius)
      group.rotation.y += delta * (spec.kind === 'trophy' ? 0.8 : 0.6)
      if (group.userData.beacon) group.userData.beacon.material.color.setScalar(0.5 + 0.5 * Math.sin(elapsed * 6))
    },
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
