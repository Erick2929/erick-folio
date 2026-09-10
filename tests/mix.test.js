import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mixLevels, clampVolume, stepVolume, DEFAULT_VOLUMES } from '../sources/javascript/Audio/mix.js'

test('defaults sit well below full scale so a maxed system volume is not painful', () => {
  assert.ok(DEFAULT_VOLUMES.master <= 0.6)
  const levels = mixLevels(DEFAULT_VOLUMES, 0.3)
  assert.ok(levels.music < 0.3)
  assert.ok(levels.sfx < 1)
})

test('master scales music and effects together', () => {
  const half = mixLevels({ master: 0.5, music: 1, sfx: 1 }, 0.3)
  const full = mixLevels({ master: 1, music: 1, sfx: 1 }, 0.3)
  assert.ok(Math.abs(half.music - full.music / 2) < 1e-9)
  assert.ok(Math.abs(half.sfx - full.sfx / 2) < 1e-9)
})

test('music and effects can be balanced independently', () => {
  const levels = mixLevels({ master: 1, music: 0.2, sfx: 0.8 }, 0.5)
  assert.ok(Math.abs(levels.music - 0.1) < 1e-9)
  assert.ok(Math.abs(levels.sfx - 0.8) < 1e-9)
})

test('mute silences everything and ducking only lowers the music', () => {
  assert.deepEqual(mixLevels({ master: 1, music: 1, sfx: 1, muted: true }, 0.3), { music: 0, sfx: 0 })
  const ducked = mixLevels({ master: 1, music: 1, sfx: 1, ducked: true }, 0.3)
  assert.ok(ducked.music < 0.3)
  assert.equal(ducked.sfx, 1)
})

test('volumes are clamped to 0..1 and bad input becomes 0', () => {
  assert.equal(clampVolume(1.7), 1)
  assert.equal(clampVolume(-0.2), 0)
  assert.equal(clampVolume(NaN), 0)
})

test('keyboard steps move in tenths and stop at the ends', () => {
  assert.equal(stepVolume(0.6, 0.1), 0.7)
  assert.equal(stepVolume(0.95, 0.1), 1)
  assert.equal(stepVolume(0.05, -0.1), 0)
  assert.equal(stepVolume(0.33, 0.1), 0.4)
})
