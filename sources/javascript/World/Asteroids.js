import * as THREE from 'three'
import Experience from '../Experience.js'

const _pos = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _matrix = new THREE.Matrix4()
const _axis = new THREE.Vector3()

/**
 * A slowly orbiting debris belt around a world. Rocks are one InstancedMesh; their positions are
 * analytic (angle + time) so collision checks never need to read matrices back.
 */
export default class Asteroids {
  constructor({ center, inner, outer, count }) {
    const exp = Experience.getInstance()
    this.scene = exp.scene
    this.ticker = exp.ticker
    this.center = new THREE.Vector3(...center)
    this.count = count

    const geometry = new THREE.DodecahedronGeometry(1, 0)
    const position = geometry.attributes.position
    for (let i = 0; i < position.count; i++) {
      const jitter = 0.78 + Math.random() * 0.4
      position.setXYZ(i, position.getX(i) * jitter, position.getY(i) * jitter, position.getZ(i) * jitter)
    }
    geometry.computeVertexNormals()

    const material = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 1, metalness: 0.05, emissive: 0x0a0806 })
    this.mesh = new THREE.InstancedMesh(geometry, material, count)
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)

    this.rocks = []
    for (let i = 0; i < count; i++) {
      const radius = inner + Math.random() * (outer - inner)
      this.rocks.push({
        angle: Math.random() * Math.PI * 2,
        radius,
        y: (Math.random() - 0.5) * 12,
        size: 0.8 + Math.pow(Math.random(), 2) * 2.6,
        speed: (0.02 + 0.04 * (inner / radius)) * (Math.random() > 0.15 ? 1 : -1),
        spin: (Math.random() - 0.5) * 1.2,
        axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        tumble: Math.random() * Math.PI * 2,
        position: new THREE.Vector3(),
        hiddenUntil: -1,
      })
    }
    this._time = 0
    this._writeMatrices()
    this.ticker.events.on('tick', (delta) => this._update(delta), 3)
  }

  _writeMatrices() {
    this.rocks.forEach((rock, i) => {
      const a = rock.angle + this._time * rock.speed
      rock.position.set(this.center.x + Math.cos(a) * rock.radius, this.center.y + rock.y, this.center.z + Math.sin(a) * rock.radius)
      _quat.setFromAxisAngle(_axis.copy(rock.axis), rock.tumble + this._time * rock.spin)
      _scale.setScalar(rock.hiddenUntil > this._time ? 0.0001 : rock.size)
      _matrix.compose(rock.position, _quat, _scale)
      this.mesh.setMatrixAt(i, _matrix)
    })
    this.mesh.instanceMatrix.needsUpdate = true
  }

  _update(delta) {
    this._time += delta
    this._writeMatrices()
  }

  /** First rock overlapping a sphere at `point`, or null. Returns the push-out normal and depth. */
  /** Blows a rock apart for a while (blaster hits). Returns false if it was already gone. */
  shatter(rock) {
    if (rock.hiddenUntil > this._time) return false
    rock.hiddenUntil = this._time + 25
    return true
  }

  collide(point, radius, out) {
    for (const rock of this.rocks) {
      if (rock.hiddenUntil > this._time) continue
      const dist = rock.position.distanceTo(point)
      const limit = rock.size * 0.9 + radius
      if (dist < limit) {
        out.normal.copy(point).sub(rock.position).normalize()
        out.depth = limit - dist
        out.rock = rock
        return out
      }
    }
    return null
  }

  /** A gap in the belt where a hidden fragment can sit. */
  hidingSpot() {
    const a = 1.2
    return [this.center.x + Math.cos(a) * 36, this.center.y + 1, this.center.z + Math.sin(a) * 36]
  }
}
