import * as THREE from 'three'
import { makeLabelSprite } from '../utils/labels.js'

/** A checkered pylon with a lamp and a label. Shared by the race courses and the target range. */
export function buildBeacon(scene, position, { label, sub = 'HOLD POSITION TO START', color = 0xffb35c }) {
  const group = new THREE.Group()
  group.position.copy(position)
  const css = '#' + color.toString(16).padStart(6, '0')
  const metal = new THREE.MeshStandardMaterial({ color: 0xb8c2cf, metalness: 0.8, roughness: 0.35 })
  const glow = new THREE.MeshBasicMaterial({ color })

  const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 14, 8), metal)
  group.add(pylon)
  const base = new THREE.Mesh(new THREE.TorusGeometry(4, 0.3, 8, 40), glow)
  base.rotation.x = Math.PI / 2
  base.position.y = -7
  group.add(base)
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.6), new THREE.MeshBasicMaterial({ map: checkerTexture(css), side: THREE.DoubleSide }))
  flag.position.set(3.2, 5.2, 0)
  group.add(flag)
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 10), glow.clone())
  lamp.position.y = 7.6
  group.add(lamp)
  const light = new THREE.PointLight(color, 120, 40, 2)
  light.position.y = 8
  light.layers.enableAll()
  group.add(light)
  const text = makeLabelSprite(label, { color: css, width: 18, sub })
  text.position.y = 13
  group.add(text)
  scene.add(group)
  return { group, flag, lamp, color: new THREE.Color(color) }
}

/** Idle animation for a beacon: a waving flag and a breathing lamp. */
export function animateBeacon(beacon, elapsed) {
  beacon.flag.rotation.y = Math.sin(elapsed * 2.2) * 0.25
  const pulse = 0.6 + 0.4 * Math.sin(elapsed * 4)
  beacon.lamp.material.color.copy(beacon.color).multiplyScalar(0.6 + 0.4 * pulse)
}

function checkerTexture(css) {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 40
  const ctx = c.getContext('2d')
  for (let y = 0; y < 5; y++) for (let x = 0; x < 8; x++) {
    ctx.fillStyle = (x + y) % 2 ? '#0a0a0c' : css
    ctx.fillRect(x * 8, y * 8, 8, 8)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
