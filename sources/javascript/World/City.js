import * as THREE from 'three'
import Experience from '../Experience.js'
import { randFloat, randInt } from '../utils/maths.js'

const NEON_COLORS = [
  0xff0080, // hot pink
  0x00f0ff, // cyan
  0xff6600, // orange
  0x9900ff, // purple
  0x00ff88, // green
  0xffff00, // yellow
]

const SIGN_TEXTS = ['CAFE', 'HOTEL', 'ERICK.DEV', 'NOODLES', 'TECH', 'BAR', 'CLUB', 'NET', 'RAMEN', 'SYS://']

const MAX_WARM_WINDOWS = 10000
const MAX_COLD_WINDOWS = 5000

export default class City {
  constructor() {
    const exp = Experience.getInstance()
    this.scene = exp.scene

    this._dummy = new THREE.Object3D()
    this._warmWindowCount = 0
    this._coldWindowCount = 0
    this._initWindowPools()

    this._createGround()
    this._createBuildings()
    this._createLights()
    this._createFog()
    this._createStars()

    this._warmWindows.count = this._warmWindowCount
    this._warmWindows.instanceMatrix.needsUpdate = true
    this._coldWindows.count = this._coldWindowCount
    this._coldWindows.instanceMatrix.needsUpdate = true

    this._initInstanceColors()
    this._startFlicker()
  }

  _initWindowPools() {
    const windowGeo = new THREE.PlaneGeometry(0.8, 0.9)
    const warmMat = new THREE.MeshBasicMaterial({ color: 0xffcc66 })
    this._warmWindows = new THREE.InstancedMesh(windowGeo, warmMat, MAX_WARM_WINDOWS)
    this._warmWindows.frustumCulled = false
    this.scene.add(this._warmWindows)

    const coldMat = new THREE.MeshBasicMaterial({ color: 0x44aaff })
    this._coldWindows = new THREE.InstancedMesh(windowGeo, coldMat, MAX_COLD_WINDOWS)
    this._coldWindows.frustumCulled = false
    this.scene.add(this._coldWindows)
  }

  _createGround() {
    const geo = new THREE.PlaneGeometry(600, 600, 20, 20)
    const mat = new THREE.MeshLambertMaterial({ color: 0x020408 })
    const ground = new THREE.Mesh(geo, mat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    this.scene.add(ground)

    const gridHelper = new THREE.GridHelper(600, 80, 0x002244, 0x001133)
    gridHelper.position.y = 0.02
    this.scene.add(gridHelper)
  }

  _createBuildings() {
    const citySize = 180
    const blockSize = 22
    const gap = 6
    const step = blockSize + gap

    let buildingCount = 0
    const maxBuildings = 80

    outer: for (let x = -citySize / 2; x < citySize / 2; x += step) {
      for (let z = -citySize / 2; z < citySize / 2; z += step) {
        if (Math.abs(x) < 30 && Math.abs(z) < 30) continue
        if (buildingCount >= maxBuildings) break outer
        this._placeBuilding(
          x + randFloat(0, blockSize * 0.6),
          z + randFloat(0, blockSize * 0.6)
        )
        buildingCount++
      }
    }
  }

  _placeBuilding(x, z) {
    const w = randFloat(4, 14)
    const d = randFloat(4, 14)
    const h = randFloat(8, 80)

    const geo = new THREE.BoxGeometry(w, h, d)
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(randFloat(0.02, 0.06), randFloat(0.04, 0.08), randFloat(0.06, 0.12)),
      emissive: new THREE.Color(0, randFloat(0.005, 0.02), randFloat(0.01, 0.04)),
    })
    const building = new THREE.Mesh(geo, mat)
    building.position.set(x, h / 2, z)
    this.scene.add(building)

    this._addWindows(x, h, z, w, d)
    if (Math.random() > 0.6) this._addNeonSign(x, h, z, w, d)
    if (Math.random() > 0.5) this._addRooftop(x, h, z, w, d)
  }

  _addWindows(bx, bh, bz, w, d) {
    const useWarm = Math.random() > 0.3
    const rows = Math.floor(bh / 3)

    const faces = [
      // front (+Z)
      {
        cols: Math.max(1, Math.floor(w / 2.5)), rotY: 0,
        getPos: (col, n, y) => {
          const lx = n > 1 ? (col / (n - 1) - 0.5) * (w - 1) : 0
          return [bx + lx, y, bz + d / 2 + 0.01]
        }
      },
      // back (-Z)
      {
        cols: Math.max(1, Math.floor(w / 2.5)), rotY: Math.PI,
        getPos: (col, n, y) => {
          const lx = n > 1 ? (col / (n - 1) - 0.5) * (w - 1) : 0
          return [bx + lx, y, bz - d / 2 - 0.01]
        }
      },
      // right (+X)
      {
        cols: Math.max(1, Math.floor(d / 2.5)), rotY: -Math.PI / 2,
        getPos: (col, n, y) => {
          const lz = n > 1 ? (col / (n - 1) - 0.5) * (d - 1) : 0
          return [bx + w / 2 + 0.01, y, bz + lz]
        }
      },
      // left (-X)
      {
        cols: Math.max(1, Math.floor(d / 2.5)), rotY: Math.PI / 2,
        getPos: (col, n, y) => {
          const lz = n > 1 ? (col / (n - 1) - 0.5) * (d - 1) : 0
          return [bx - w / 2 - 0.01, y, bz + lz]
        }
      },
    ]

    for (const face of faces) {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < face.cols; col++) {
          if (Math.random() > 0.55) continue
          if (useWarm && this._warmWindowCount >= MAX_WARM_WINDOWS) continue
          if (!useWarm && this._coldWindowCount >= MAX_COLD_WINDOWS) continue

          const worldY = (row / rows) * bh + 1.5
          const [px, py, pz] = face.getPos(col, face.cols, worldY)

          this._dummy.position.set(px, py, pz)
          this._dummy.rotation.set(0, face.rotY, 0)
          this._dummy.scale.set(1, 1, 1)
          this._dummy.updateMatrix()

          if (useWarm) {
            this._warmWindows.setMatrixAt(this._warmWindowCount++, this._dummy.matrix)
          } else {
            this._coldWindows.setMatrixAt(this._coldWindowCount++, this._dummy.matrix)
          }
        }
      }
    }
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

  _addNeonSign(x, h, z, w, d) {
    const color = NEON_COLORS[randInt(0, NEON_COLORS.length - 1)]
    const signW = randFloat(w * 0.4, w * 0.9)
    const signH = randFloat(0.5, 1.5)

    let mat
    if (Math.random() > 0.5) {
      const text = SIGN_TEXTS[randInt(0, SIGN_TEXTS.length - 1)]
      mat = new THREE.MeshBasicMaterial({
        map: this._makeTextTexture(text, color),
        transparent: true,
        side: THREE.DoubleSide
      })
    } else {
      mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    }

    const geo = new THREE.PlaneGeometry(signW, signH)
    const sign = new THREE.Mesh(geo, mat)
    sign.position.set(x, h + signH / 2 + randFloat(0, 3), z + d / 2 + 0.1)
    this.scene.add(sign)
  }

  _addRooftop(x, h, z, w, d) {
    if (Math.random() > 0.5) {
      const antennaGeo = new THREE.CylinderGeometry(0.05, 0.05, randFloat(2, 6), 4)
      const antennaMat = new THREE.MeshLambertMaterial({ color: 0x333333 })
      const antenna = new THREE.Mesh(antennaGeo, antennaMat)
      antenna.position.set(x + randFloat(-w / 3, w / 3), h + 2, z + randFloat(-d / 3, d / 3))
      this.scene.add(antenna)
    }
  }

  _createLights() {
    const ambient = new THREE.AmbientLight(0x020510, 0.5)
    this.scene.add(ambient)
    const moon = new THREE.DirectionalLight(0x223355, 0.4)
    moon.position.set(-50, 80, -30)
    this.scene.add(moon)
    const streetColors = [0xff0066, 0x0066ff, 0xff6600, 0x00ffaa, 0x9900ff, 0xff0080]
    const positions = [[-60, 3, -60], [60, 3, -60], [-60, 3, 60], [60, 3, 60], [0, 3, -80], [0, 3, 80]]
    for (let i = 0; i < 6; i++) {
      const light = new THREE.PointLight(streetColors[i], 2, 50)
      light.position.set(...positions[i])
      this.scene.add(light)
    }
  }

  _createFog() {
    this.scene.fog = new THREE.FogExp2(0x020408, 0.008)
    this.scene.background = new THREE.Color(0x020408)
  }

  _createStars() {
    const count = 1500
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.45
      const r = 400 + Math.random() * 100
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi) + 10
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({ color: 0xaaccff, size: 0.9, sizeAttenuation: true, transparent: true, opacity: 0.6, fog: false })
    this.scene.add(new THREE.Points(geo, mat))
  }

  _initInstanceColors() {
    const warmColor = new THREE.Color(0xffcc66)
    const coldColor = new THREE.Color(0x44aaff)
    for (let i = 0; i < this._warmWindowCount; i++) this._warmWindows.setColorAt(i, warmColor)
    for (let i = 0; i < this._coldWindowCount; i++) this._coldWindows.setColorAt(i, coldColor)
    if (this._warmWindowCount > 0) this._warmWindows.instanceColor.needsUpdate = true
    if (this._coldWindowCount > 0) this._coldWindows.instanceColor.needsUpdate = true
  }

  _startFlicker() {
    const dark = new THREE.Color(0x000000)
    const warmOn = new THREE.Color(0xffcc66)
    const coldOn = new THREE.Color(0x44aaff)
    const self = this

    function flicker() {
      const useWarm = Math.random() > 0.5
      const mesh = useWarm ? self._warmWindows : self._coldWindows
      const count = useWarm ? self._warmWindowCount : self._coldWindowCount
      const onColor = useWarm ? warmOn : coldOn
      if (count > 0) {
        const idx = randInt(0, count - 1)
        mesh.setColorAt(idx, Math.random() > 0.25 ? onColor : dark)
        mesh.instanceColor.needsUpdate = true
      }
      setTimeout(flicker, randInt(150, 1800))
    }

    for (let i = 0; i < 10; i++) {
      setTimeout(flicker, randInt(0, 2000))
    }
  }
}
