import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cursorSteer } from '../sources/javascript/Input.js'

test('a cursor resting near the centre steers nothing', () => {
  assert.deepEqual(cursorSteer(0, 0), { yaw: 0, pitch: 0 })
  assert.deepEqual(cursorSteer(0.08, -0.05), { yaw: 0, pitch: 0 })
})

test('cursor right of centre yaws right and cursor above centre climbs', () => {
  const right = cursorSteer(0.8, 0)
  assert.ok(right.yaw < 0, 'yaw negative turns right')
  assert.equal(right.pitch, 0)
  const up = cursorSteer(0, -0.8)
  assert.ok(up.pitch > 0, 'positive pitch climbs')
  assert.equal(up.yaw, 0)
})

test('steering ramps smoothly from the dead zone to full deflection', () => {
  const near = Math.abs(cursorSteer(0.3, 0).yaw)
  const mid = Math.abs(cursorSteer(0.6, 0).yaw)
  const full = Math.abs(cursorSteer(1, 0).yaw)
  assert.ok(near > 0 && near < mid && mid < full)
  assert.ok(Math.abs(full - 1) < 1e-9)
})

test('offsets beyond the screen edge are clamped', () => {
  assert.ok(Math.abs(cursorSteer(3, -3).yaw) <= 1)
  assert.ok(Math.abs(cursorSteer(3, -3).pitch) <= 1)
})
