import * as THREE from 'three'
import Experience from '../Experience.js'
import { lerp, clamp } from '../utils/maths.js'

export default class Ship {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker
    this.camera = exp.camera

    // State
    this.velocity = new THREE.Vector3()
    this._forward = new THREE.Vector3()
    this.rotationY = 0
    this.rotationVel = 0
    this.boost = false

    this.keys = {}
    this._setupInput()
    this._createMesh()
    this.camera.followTarget(this.mesh)

    this.ticker.events.on('tick', (delta) => this._update(delta), 2)
  }

  _createMesh() {
    this.mesh = new THREE.Group()
    this.mesh.position.set(0, 8, 0)

    // Body - main hull
    const bodyGeo = new THREE.ConeGeometry(0.6, 2.5, 6)
    bodyGeo.rotateX(-Math.PI / 2)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111822,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x001122,
      emissiveIntensity: 0.3
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    this.mesh.add(body)

    // Wings
    const wingGeo = new THREE.BoxGeometry(3, 0.08, 0.8)
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0a1520,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x001133,
      emissiveIntensity: 0.2
    })
    const wings = new THREE.Mesh(wingGeo, wingMat)
    wings.position.z = 0.3
    this.mesh.add(wings)

    // Engine glow (back)
    const engineGeo = new THREE.CylinderGeometry(0.15, 0.25, 0.4, 8)
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x00aaff,
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.9
    })
    const engine = new THREE.Mesh(engineGeo, engineMat)
    engine.position.set(0, 0, 1.2)
    engine.rotation.x = Math.PI / 2
    this.mesh.add(engine)

    // Two side engines
    for (const side of [-0.8, 0.8]) {
      const sideEngine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 0.3, 6),
        new THREE.MeshStandardMaterial({
          color: 0x00ccff,
          emissive: 0x00ccff,
          emissiveIntensity: 2,
          transparent: true,
          opacity: 0.8
        })
      )
      sideEngine.position.set(side, 0, 1.0)
      sideEngine.rotation.x = Math.PI / 2
      this.mesh.add(sideEngine)
    }

    // Cockpit glass
    const cockpitGeo = new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5)
    cockpitGeo.rotateX(-Math.PI)
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x002244,
      emissive: 0x001133,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.6,
      metalness: 0.5
    })
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat)
    cockpit.position.set(0, 0.15, -0.5)
    this.mesh.add(cockpit)

    // Engine light
    this.engineLight = new THREE.PointLight(0x00aaff, 3, 8)
    this.engineLight.position.set(0, 0, 1.5)
    this.mesh.add(this.engineLight)

    this.scene.add(this.mesh)
  }

  _setupInput() {
    window.addEventListener('keydown', e => { this.keys[e.code] = true })
    window.addEventListener('keyup', e => { this.keys[e.code] = false })
  }

  _update(delta) {
    const speed = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 28 : 14
    const turnSpeed = 1.6
    const vertSpeed = 8

    // Rotation
    let turnInput = 0
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) turnInput += 1
    if (this.keys['KeyD'] || this.keys['ArrowRight']) turnInput -= 1

    this.rotationVel = lerp(this.rotationVel, turnInput * turnSpeed, delta * 5)
    this.rotationY += this.rotationVel * delta
    this.mesh.rotation.y = this.rotationY

    // Bank (tilt on turns)
    this.mesh.rotation.z = this.rotationVel * 0.25

    // Forward/back movement
    let thrust = 0
    if (this.keys['KeyW'] || this.keys['ArrowUp']) thrust = 1
    if (this.keys['KeyS'] || this.keys['ArrowDown']) thrust = -0.4

    this._forward.set(Math.sin(this.rotationY), 0, Math.cos(this.rotationY))
    const forward = this._forward

    const targetVelX = forward.x * thrust * speed
    const targetVelZ = forward.z * thrust * speed

    this.velocity.x = lerp(this.velocity.x, targetVelX, delta * 3)
    this.velocity.z = lerp(this.velocity.z, targetVelZ, delta * 3)

    // Vertical
    let vertInput = 0
    if (this.keys['KeyQ'] || this.keys['Space']) vertInput = 1
    if (this.keys['KeyE'] || this.keys['ShiftLeft']) vertInput = -1
    this.velocity.y = lerp(this.velocity.y, vertInput * vertSpeed, delta * 4)

    // Apply velocity
    this.mesh.position.x += this.velocity.x * delta
    this.mesh.position.y += this.velocity.y * delta
    this.mesh.position.z += this.velocity.z * delta

    // Clamp altitude
    this.mesh.position.y = clamp(this.mesh.position.y, 2, 60)

    // Nose pitch when moving vertically
    this.mesh.rotation.x = lerp(this.mesh.rotation.x, -this.velocity.y * 0.04, delta * 6)

    // Engine pulse
    const t = Date.now() * 0.003
    const speed2 = this.velocity.length()
    this.engineLight.intensity = 2 + Math.sin(t * 5) * 0.5 + speed2 * 0.15
  }
}
