import { test } from 'node:test'
import assert from 'node:assert/strict'
import { touchThrust } from '../sources/javascript/Input.js'

test('holding thrust flies forward', () => {
  assert.equal(touchThrust({ thrust: true }), 1)
})

test('cruise keeps the ship flying without holding thrust', () => {
  assert.equal(touchThrust({ cruise: true }), 1)
})

test('brake wins over thrust and cruise', () => {
  assert.equal(touchThrust({ thrust: true, cruise: true, brake: true }), -0.35)
})

test('nothing held means no thrust', () => {
  assert.equal(touchThrust({}), 0)
})
