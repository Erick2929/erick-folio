import { test } from 'node:test'
import assert from 'node:assert/strict'
import BoostReserve from '../sources/javascript/Game/Boost.js'

const make = () => new BoostReserve({ boostSeconds: 6, rechargeSeconds: 5, relockAt: 0.25 })

test('boosting drains the reserve and locks it when empty', () => {
  const r = make()
  let out
  for (let i = 0; i < 70; i++) out = r.update(0.1, true)
  assert.equal(r.energy, 0)
  assert.equal(r.locked, true)
  assert.equal(out.boosting, false)
})

test('a locked reserve stays locked until it recharges to a quarter', () => {
  const r = make()
  for (let i = 0; i < 70; i++) r.update(0.1, true)
  for (let i = 0; i < 5; i++) r.update(0.1, false)
  assert.equal(r.locked, true)
  assert.equal(r.update(0.1, true).boosting, false)
  for (let i = 0; i < 10; i++) r.update(0.1, false)
  assert.equal(r.locked, false)
  assert.equal(r.update(0.1, true).boosting, true)
})

test('a refused press is reported once, not every frame', () => {
  const r = make()
  for (let i = 0; i < 70; i++) r.update(0.1, true)
  r.update(0.1, false)
  assert.equal(r.update(0.1, true).denied, true)
  assert.equal(r.update(0.1, true).denied, false)
  r.update(0.1, false)
  assert.equal(r.update(0.1, true).denied, true)
})

test('the reserve recharges while boost is released', () => {
  const r = make()
  for (let i = 0; i < 30; i++) r.update(0.1, true)
  const drained = r.energy
  for (let i = 0; i < 10; i++) r.update(0.1, false)
  assert.ok(r.energy > drained)
  for (let i = 0; i < 60; i++) r.update(0.1, false)
  assert.equal(r.energy, 1)
})

test('a fuel cell refills the reserve and grants overdrive that does not drain', () => {
  const r = make()
  for (let i = 0; i < 70; i++) r.update(0.1, true)
  r.refuel(15)
  assert.equal(r.energy, 1)
  assert.equal(r.locked, false)
  assert.equal(r.overdrive, 15)
  for (let i = 0; i < 100; i++) r.update(0.1, true)
  assert.equal(r.energy, 1)
  assert.ok(Math.abs(r.overdrive - 5) < 1e-6)
  for (let i = 0; i < 60; i++) r.update(0.1, true)
  assert.equal(r.overdrive, 0)
  assert.ok(r.energy < 1)
})
