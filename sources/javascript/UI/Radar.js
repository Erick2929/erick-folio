import * as THREE from 'three'

const _pos = new THREE.Vector3()
const _fwd = new THREE.Vector3()

/** Top-down radar centred on the ship with the ship's heading pointing up. */
export default class Radar {
  constructor(canvas, { range = 460 } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.range = range
    this.size = canvas.width
  }

  draw({ ship, world, target, elapsed }) {
    const ctx = this.ctx
    const size = this.size
    const half = size / 2
    const scale = (half - 10) / this.range
    ctx.clearRect(0, 0, size, size)

    ship.getForward(_fwd)
    const yaw = Math.atan2(_fwd.x, _fwd.z)
    const cos = Math.cos(yaw)
    const sin = Math.sin(yaw)
    const toScreen = (x, z) => {
      const dx = x - ship.position.x
      const dz = z - ship.position.z
      const rx = dx * cos - dz * sin
      const rz = dx * sin + dz * cos
      return [half + rx * scale, half - rz * scale]
    }

    ctx.strokeStyle = 'rgba(236,228,211,0.08)'
    ctx.lineWidth = 1
    for (const r of [0.33, 0.66, 1]) {
      ctx.beginPath()
      ctx.arc(half, half, (half - 10) * r, 0, Math.PI * 2)
      ctx.stroke()
    }

    const bh = world.blackHole
    const [bx, by] = toScreen(bh.position.x, bh.position.z)
    const diskR = Math.max(6, bh.diskOuter * scale)
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, diskR)
    grad.addColorStop(0, 'rgba(0,0,0,1)')
    grad.addColorStop(0.35, 'rgba(242,165,65,0.9)')
    grad.addColorStop(1, 'rgba(242,165,65,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(bx, by, diskR, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(bx, by, Math.max(2.5, bh.rs * scale), 0, Math.PI * 2)
    ctx.fill()

    for (const s of world.scannables) {
      s.getPosition(_pos)
      const [x, y] = toScreen(_pos.x, _pos.z)
      if (x < 4 || y < 4 || x > size - 4 || y > size - 4) continue
      const css = '#' + s.color.toString(16).padStart(6, '0')
      ctx.fillStyle = css
      if (s.kind === 'station') {
        ctx.fillRect(x - 3, y - 3, 6, 6)
      } else if (s.kind === 'race') {
        ctx.beginPath()
        ctx.moveTo(x, y - 5)
        ctx.lineTo(x + 4, y + 3)
        ctx.lineTo(x - 4, y + 3)
        ctx.closePath()
        ctx.fill()
      } else {
        ctx.beginPath()
        ctx.arc(x, y, Math.max(2, s.radius * scale), 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.fillStyle = '#ff5c5c'
    for (const t of world.targets?.active ?? []) {
      const [x, y] = toScreen(t.position.x, t.position.z)
      if (x < 4 || y < 4 || x > size - 4 || y > size - 4) continue
      ctx.beginPath()
      ctx.arc(x, y, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = 'rgba(159,242,255,0.9)'
    for (const c of world.fuelCells?.cells ?? []) {
      if (!c.active) continue
      if (c.group.position.distanceTo(ship.position) > 240) continue
      const [x, y] = toScreen(c.group.position.x, c.group.position.z)
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
    }

    ctx.fillStyle = 'rgba(236,228,211,0.7)'
    for (const f of world.fragments.all) {
      if (f.collected) continue
      if (f.position.distanceTo(ship.position) > 180) continue
      const [x, y] = toScreen(f.position.x, f.position.z)
      ctx.fillRect(x - 1, y - 1, 2, 2)
    }

    if (target) {
      target.getPosition(_pos)
      let [x, y] = toScreen(_pos.x, _pos.z)
      const dx = x - half
      const dy = y - half
      const d = Math.hypot(dx, dy)
      const max = half - 8
      if (d > max) { x = half + (dx / d) * max; y = half + (dy / d) * max }
      const pulse = 4 + 2 * Math.sin(elapsed * 5)
      ctx.strokeStyle = '#f2a541'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(x, y, pulse + 3, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.moveTo(half, half - 7)
    ctx.lineTo(half - 5, half + 5)
    ctx.lineTo(half + 5, half + 5)
    ctx.closePath()
    ctx.fill()
  }
}
