import * as THREE from 'three'
import Experience from './Experience.js'
import { lerp } from './utils/maths.js'

export default class Camera {
  constructor() {
    const exp = Experience.getInstance()
    this.sizes = exp.sizes
    this.scene = exp.scene
    this.ticker = exp.ticker

    this._offset = new THREE.Vector3(0, 3, -10)
    this._target = new THREE.Vector3()
    this._position = new THREE.Vector3()

    this._setup()
    this.ticker.events.on('tick', (delta) => this._update(delta), 7)
  }

  _setup() {
    this.instance = new THREE.PerspectiveCamera(60, this.sizes.ratio, 0.1, 2000)
    this.instance.position.set(0, 5, -10)
    this.scene.add(this.instance)

    Experience.getInstance().sizes.events.on('resize', () => {
      this.instance.aspect = this.sizes.ratio
      this.instance.updateProjectionMatrix()
    })
  }

  followTarget(mesh) {
    this._mesh = mesh
  }

  _update(delta) {
    if (!this._mesh) return

    // Get desired camera position behind the ship
    const shipPos = this._mesh.position
    const shipRot = this._mesh.rotation.y

    const offsetX = Math.sin(shipRot) * this._offset.z
    const offsetZ = Math.cos(shipRot) * this._offset.z

    this._target.set(
      shipPos.x + offsetX,
      shipPos.y + this._offset.y,
      shipPos.z + offsetZ
    )

    // Smooth follow
    const t = 1 - Math.pow(0.01, delta)
    this._position.lerp(this._target, t)
    this.instance.position.copy(this._position)
    this.instance.lookAt(
      shipPos.x,
      shipPos.y + 1,
      shipPos.z
    )
  }
}
