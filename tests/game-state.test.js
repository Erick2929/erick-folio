import { test } from 'node:test'
import assert from 'node:assert/strict'
import GameState from '../sources/javascript/Game/GameState.js'

const OBJECTIVES = [
  { id: 'scan-origin', label: 'Scan ORIGIN', required: true },
  { id: 'scan-salesforce', label: 'Scan SALESFORCE', required: true },
  { id: 'dock-tec', label: 'Dock at TEC STATION', required: true },
  { id: 'fragments', label: 'Collect fragments', required: false },
]

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v) },
    data,
  }
}

function makeGame(overrides = {}) {
  return new GameState({
    objectives: OBJECTIVES,
    fragmentsTotal: 10,
    storage: memoryStorage(),
    ...overrides,
  })
}

test('a new game starts on the title screen with nothing completed', () => {
  const g = makeGame()
  assert.equal(g.state, 'title')
  assert.equal(g.horizonOpen, false)
  assert.equal(g.fragments, 0)
  assert.equal(g.objectivesDone, 0)
})

test('launching starts play and resets clocks', () => {
  const g = makeGame()
  g.start()
  assert.equal(g.state, 'playing')
  assert.equal(g.shipTime, 0)
  assert.equal(g.earthTime, 0)
})

test('clocks advance only while playing and earth time is dilated', () => {
  const g = makeGame()
  g.tick(1, 5)
  assert.equal(g.shipTime, 0)
  g.start()
  g.tick(1, 5)
  assert.equal(g.shipTime, 1)
  assert.equal(g.earthTime, 5)
})

test('pausing freezes the clocks until resumed', () => {
  const g = makeGame()
  g.start()
  g.pause()
  g.tick(1, 1)
  assert.equal(g.shipTime, 0)
  g.resume()
  g.tick(1, 1)
  assert.equal(g.shipTime, 1)
})

test('completing an objective emits an event and only counts once', () => {
  const g = makeGame()
  g.start()
  let events = 0
  g.events.on('objective', () => events++)
  assert.equal(g.completeObjective('scan-origin'), true)
  assert.equal(g.completeObjective('scan-origin'), false)
  assert.equal(events, 1)
  assert.equal(g.objectivesDone, 1)
})

test('the horizon opens once every required objective is complete', () => {
  const g = makeGame()
  g.start()
  let opened = 0
  g.events.on('horizon-open', () => opened++)
  g.completeObjective('scan-origin')
  g.completeObjective('scan-salesforce')
  assert.equal(g.horizonOpen, false)
  g.completeObjective('dock-tec')
  assert.equal(g.horizonOpen, true)
  assert.equal(opened, 1)
})

test('optional objectives do not gate the horizon but count toward completion', () => {
  const g = makeGame()
  g.start()
  g.completeObjective('fragments')
  assert.equal(g.horizonOpen, false)
  assert.equal(g.objectivesDone, 1)
})

test('collecting fragments increases the count and completes the fragment objective at the total', () => {
  const g = makeGame({ fragmentsTotal: 2, fragmentObjectiveId: 'fragments' })
  g.start()
  g.collectFragment({ id: 'a', skill: 'Go' })
  assert.equal(g.fragments, 1)
  assert.equal(g.isObjectiveDone('fragments'), false)
  g.collectFragment({ id: 'b', skill: 'React' })
  assert.equal(g.isObjectiveDone('fragments'), true)
  assert.deepEqual(g.collectedSkills, ['Go', 'React'])
})

test('entering a closed horizon throws the ship through a wormhole with an earth-time penalty', () => {
  const g = makeGame()
  g.start()
  let wormholes = 0
  g.events.on('wormhole', () => wormholes++)
  const before = g.earthTime
  g.enterHorizon()
  assert.equal(g.state, 'playing')
  assert.equal(wormholes, 1)
  assert.ok(g.earthTime > before)
})

test('entering an open horizon finishes the run with a summary and saves a best score', () => {
  const storage = memoryStorage()
  const g = makeGame({ storage })
  g.start()
  g.tick(90, 1)
  OBJECTIVES.forEach(o => g.completeObjective(o.id))
  g.collectFragment({ id: 'a', skill: 'Go' })
  let summary = null
  g.events.on('finale', (s) => { summary = s })
  g.enterHorizon()
  assert.equal(g.state, 'finale')
  assert.ok(summary)
  assert.equal(summary.fragments, 1)
  assert.equal(summary.fragmentsTotal, 10)
  assert.equal(summary.shipTime, 90)
  assert.ok(summary.score > 0)
  assert.equal(summary.isNewBest, true)
  assert.ok(storage.getItem(GameState.SAVE_KEY))
})

test('a slower second run is not a new best', () => {
  const storage = memoryStorage()
  const g1 = makeGame({ storage })
  g1.start()
  OBJECTIVES.forEach(o => g1.completeObjective(o.id))
  g1.tick(30, 1)
  g1.enterHorizon()
  const g2 = makeGame({ storage })
  g2.start()
  OBJECTIVES.forEach(o => g2.completeObjective(o.id))
  g2.tick(300, 1)
  let summary = null
  g2.events.on('finale', (s) => { summary = s })
  g2.enterHorizon()
  assert.equal(summary.isNewBest, false)
  assert.ok(summary.best.score >= summary.score)
})

test('score rewards objectives and fragments and a faster ship time', () => {
  const slow = makeGame()
  slow.start()
  slow.completeObjective('scan-origin')
  slow.collectFragment({ id: 'a', skill: 'Go' })
  slow.tick(600, 1)
  const fast = makeGame()
  fast.start()
  fast.completeObjective('scan-origin')
  fast.collectFragment({ id: 'a', skill: 'Go' })
  fast.tick(60, 1)
  assert.ok(fast.score > slow.score)
  assert.ok(slow.score >= 600)
})

test('a reboot is counted and costs earth time', () => {
  const g = makeGame()
  g.start()
  g.recordReboot()
  assert.equal(g.reboots, 1)
  assert.ok(g.earthTime > 0)
})

test('free flight keeps the world playable after the finale', () => {
  const g = makeGame()
  g.start()
  OBJECTIVES.forEach(o => g.completeObjective(o.id))
  g.enterHorizon()
  g.freeFlight()
  assert.equal(g.state, 'freeflight')
  g.tick(1, 1)
  assert.ok(g.shipTime > 0)
})

test('restarting returns every objective and counter to zero', () => {
  const g = makeGame()
  g.start()
  g.completeObjective('scan-origin')
  g.collectFragment({ id: 'a', skill: 'Go' })
  g.tick(10, 1)
  g.start()
  assert.equal(g.objectivesDone, 0)
  assert.equal(g.fragments, 0)
  assert.equal(g.shipTime, 0)
  assert.equal(g.horizonOpen, false)
})
