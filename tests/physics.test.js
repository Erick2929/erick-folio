import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  gravityStrength,
  timeDilation,
  scannerProgress,
  diskHeat,
  DILATION_CAP,
} from '../sources/javascript/Game/physics.js'

const BH = { mu: 40000, rs: 16, cap: 45 }

test('gravity weakens with the square of the distance', () => {
  const near = gravityStrength(100, BH)
  const far = gravityStrength(200, BH)
  assert.ok(Math.abs(near / far - 4) < 1e-9)
})

test('gravity never exceeds the cap so the ship stays controllable', () => {
  assert.equal(gravityStrength(1, BH), BH.cap)
  assert.equal(gravityStrength(BH.rs, BH), BH.cap)
})

test('gravity is negligible far from the singularity', () => {
  assert.ok(gravityStrength(2000, BH) < 0.05)
})

test('time runs at the same rate far from the horizon', () => {
  assert.ok(Math.abs(timeDilation(10000, BH.rs) - 1) < 0.01)
})

test('time dilation grows as the ship approaches the horizon and is capped', () => {
  const d1 = timeDilation(BH.rs * 6, BH.rs)
  const d2 = timeDilation(BH.rs * 3, BH.rs)
  const d3 = timeDilation(BH.rs * 1.5, BH.rs)
  assert.ok(d1 < d2 && d2 < d3)
  assert.ok(timeDilation(BH.rs, BH.rs) <= DILATION_CAP)
  assert.ok(timeDilation(0, BH.rs) <= DILATION_CAP)
  assert.ok(timeDilation(BH.rs * 1.001, BH.rs) >= 1)
})

test('scanner fills to completion while the target stays in range', () => {
  let p = 0
  for (let i = 0; i < 30; i++) p = scannerProgress(p, true, 0.1, 2.5)
  assert.equal(p, 1)
})

test('scanner decays when the target leaves range and never goes negative', () => {
  let p = scannerProgress(0, true, 1, 2.5)
  const after = scannerProgress(p, false, 0.5, 2.5)
  assert.ok(after < p)
  assert.equal(scannerProgress(0.01, false, 10, 2.5), 0)
})

test('scanner progress is a fraction of the required duration', () => {
  assert.ok(Math.abs(scannerProgress(0, true, 1.25, 2.5) - 0.5) < 1e-9)
})

test('disk heat is zero outside the accretion disk and one deep inside it', () => {
  const disk = { inner: 26, outer: 72, halfThickness: 2.5 }
  assert.equal(diskHeat({ x: 100, y: 0, z: 0 }, disk), 0)
  assert.equal(diskHeat({ x: 10, y: 0, z: 0 }, disk), 0)
  assert.equal(diskHeat({ x: 50, y: 20, z: 0 }, disk), 0)
  assert.equal(diskHeat({ x: 50, y: 0, z: 0 }, disk), 1)
})

test('disk heat fades smoothly at the vertical edge of the disk', () => {
  const disk = { inner: 26, outer: 72, halfThickness: 2.5 }
  const mid = diskHeat({ x: 50, y: 1.25, z: 0 }, disk)
  assert.ok(mid > 0 && mid < 1)
})
