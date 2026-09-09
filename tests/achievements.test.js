import { test } from 'node:test'
import assert from 'node:assert/strict'
import Achievements, { ACHIEVEMENTS } from '../sources/javascript/Game/Achievements.js'

function memoryStorage() {
  const data = {}
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v) } }
}

test('an achievement unlocks once and reports the definition', () => {
  const a = new Achievements({ storage: memoryStorage() })
  const unlocked = []
  a.events.on('unlock', (def) => unlocked.push(def.id))
  assert.equal(a.unlock('first-light'), true)
  assert.equal(a.unlock('first-light'), false)
  assert.deepEqual(unlocked, ['first-light'])
  assert.equal(a.has('first-light'), true)
  assert.equal(a.count, 1)
})

test('unknown ids are ignored', () => {
  const a = new Achievements({ storage: memoryStorage() })
  assert.equal(a.unlock('nope'), false)
  assert.equal(a.count, 0)
})

test('unlocks persist across sessions', () => {
  const storage = memoryStorage()
  new Achievements({ storage }).unlock('racer')
  const later = new Achievements({ storage })
  assert.equal(later.has('racer'), true)
})

test('the list exposes every definition with its unlocked state', () => {
  const a = new Achievements({ storage: memoryStorage() })
  a.unlock('skimmer')
  const list = a.list
  assert.equal(list.length, ACHIEVEMENTS.length)
  assert.equal(list.find(d => d.id === 'skimmer').unlocked, true)
  assert.equal(list.find(d => d.id === 'racer').unlocked, false)
})
