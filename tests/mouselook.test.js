import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mouseLook } from '../sources/javascript/Input.js'

test('moving the mouse right yaws right and moving it up pitches up', () => {
  const right = mouseLook(100, 0, 0.002)
  assert.ok(right.yaw < 0)
  assert.equal(right.pitch, 0)
  const up = mouseLook(0, -100, 0.002)
  assert.ok(up.pitch > 0)
  assert.equal(up.yaw, 0)
})

test('rotation is proportional to mouse travel and sensitivity', () => {
  const a = mouseLook(50, 0, 0.001)
  const b = mouseLook(100, 0, 0.001)
  const c = mouseLook(100, 0, 0.002)
  assert.ok(Math.abs(b.yaw - 2 * a.yaw) < 1e-12)
  assert.ok(Math.abs(c.yaw - 2 * b.yaw) < 1e-12)
})

test('a single frame of movement is capped so a mouse jump cannot flip the ship', () => {
  const big = mouseLook(100000, 100000, 0.002)
  assert.ok(Math.abs(big.yaw) <= 0.35 && Math.abs(big.pitch) <= 0.35)
})
