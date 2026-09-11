import { test } from 'node:test'
import assert from 'node:assert/strict'
import Tutorial, { TUTORIAL_STEPS } from '../sources/javascript/Game/Tutorial.js'

function memoryStorage() {
  const data = {}
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v) } }
}

test('flight school has three steps that teach thrust, steering and boost', () => {
  assert.equal(TUTORIAL_STEPS.length, 3)
  assert.deepEqual(TUTORIAL_STEPS.map(s => s.id), ['thrust', 'steer', 'boost'])
})

test('a new visitor has not seen flight school; starting it exposes the first step', () => {
  const t = new Tutorial({ storage: memoryStorage() })
  assert.equal(t.seen, false)
  assert.equal(t.state, 'idle')
  t.start()
  assert.equal(t.state, 'active')
  assert.equal(t.index, 0)
  assert.equal(t.step.id, 'thrust')
})

test('reaching a star advances, and the last star completes and remembers it', () => {
  const storage = memoryStorage()
  const t = new Tutorial({ storage })
  const events = []
  t.events.on('step', (i) => events.push(`step:${i}`))
  t.events.on('complete', () => events.push('complete'))
  t.start()
  t.update(false)
  assert.equal(t.index, 0)
  t.update(true)
  assert.equal(t.index, 1)
  t.update(true)
  assert.equal(t.index, 2)
  t.update(true)
  assert.equal(t.state, 'done')
  assert.deepEqual(events, ['step:1', 'step:2', 'complete'])
  assert.equal(new Tutorial({ storage }).seen, true)
})

test('skipping ends flight school and counts as seen', () => {
  const storage = memoryStorage()
  const t = new Tutorial({ storage })
  let skipped = 0
  t.events.on('skip', () => skipped++)
  t.start()
  t.skip()
  assert.equal(t.state, 'done')
  assert.equal(skipped, 1)
  assert.equal(new Tutorial({ storage }).seen, true)
})

test('flight school can be replayed after completion', () => {
  const t = new Tutorial({ storage: memoryStorage() })
  t.start(); t.update(true); t.update(true); t.update(true)
  t.start()
  assert.equal(t.state, 'active')
  assert.equal(t.index, 0)
})
