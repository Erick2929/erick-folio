import { test } from 'node:test'
import assert from 'node:assert/strict'
import Range from '../sources/javascript/Game/Range.js'

function memoryStorage() {
  const data = {}
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v) } }
}
const make = (storage = memoryStorage()) => new Range({ storage, duration: 10 })

test('a session counts down before the clock starts', () => {
  const r = make()
  r.start()
  assert.equal(r.state, 'countdown')
  r.update(1)
  assert.equal(r.timeLeft, 10)
  r.update(2.5)
  assert.equal(r.state, 'running')
})

test('hits score base points times the combo, and destroying targets grows the combo', () => {
  const r = make()
  r.start(); r.update(3.1)
  assert.equal(r.registerHit(100, true), 100)
  assert.equal(r.combo, 2)
  assert.equal(r.registerHit(100, false), 200)
  assert.equal(r.combo, 2)
  assert.equal(r.registerHit(250, true), 500)
  assert.equal(r.combo, 3)
  assert.equal(r.score, 800)
})

test('the combo decays after two seconds without a hit and never exceeds four', () => {
  const r = make()
  r.start(); r.update(3.1)
  for (let i = 0; i < 6; i++) r.registerHit(100, true)
  assert.equal(r.combo, 4)
  r.update(1)
  assert.equal(r.combo, 4)
  r.update(1.5)
  assert.equal(r.combo, 1)
})

test('the session finishes when time runs out with accuracy and a persisted leaderboard', () => {
  const storage = memoryStorage()
  const r = make(storage)
  let result = null
  r.events.on('finish', (res) => { result = res })
  r.start(); r.update(3.1)
  r.registerShot(); r.registerShot(); r.registerShot(); r.registerShot()
  r.registerHit(100, true); r.registerHit(100, true); r.registerHit(100, true)
  r.update(11)
  assert.equal(r.state, 'finished')
  assert.equal(result.hits, 3)
  assert.equal(result.shots, 4)
  assert.equal(result.accuracy, 75)
  assert.equal(result.isBest, true)
  assert.equal(result.rank, 1)
  assert.equal(make(storage).leaderboard()[0].score, result.score)
})

test('the leaderboard keeps the five highest scores in order', () => {
  const storage = memoryStorage()
  for (const n of [2, 9, 4, 7, 1, 8, 3]) {
    const r = make(storage)
    r.start(); r.update(3.1)
    for (let i = 0; i < n; i++) r.registerHit(100, false)
    r.update(11)
  }
  assert.deepEqual(make(storage).leaderboard().map(e => e.score), [900, 800, 700, 400, 300])
})

test('aborting records nothing and returns to idle', () => {
  const storage = memoryStorage()
  const r = make(storage)
  r.start(); r.update(3.1); r.registerHit(100, true)
  r.abort()
  assert.equal(r.state, 'idle')
  assert.equal(make(storage).leaderboard().length, 0)
})
