import { test } from 'node:test'
import assert from 'node:assert/strict'
import Race from '../sources/javascript/Game/Race.js'

const COURSES = {
  trial: {
    name: 'TIME TRIAL',
    gates: [
      { position: { x: 0, y: 0, z: 0 }, radius: 8 },
      { position: { x: 100, y: 0, z: 0 }, radius: 8 },
      { position: { x: 200, y: 0, z: 0 }, radius: 8 },
    ],
  },
  sling: {
    name: 'SLINGSHOT',
    gates: [
      { position: { x: 0, y: 50, z: 0 }, radius: 8 },
      { position: { x: 0, y: 150, z: 0 }, radius: 8 },
    ],
  },
}

function memoryStorage() {
  const data = {}
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v) } }
}

const far = { x: 9999, y: 0, z: 0 }

function runCourse(race, courseId, gateDelays) {
  race.start(courseId)
  race.update(3.1, far)
  gateDelays.forEach((delay, i) => {
    race.update(delay, far)
    race.update(0, COURSES[courseId].gates[i].position)
  })
}

test('a race starts with a countdown and only runs once it reaches zero', () => {
  const race = new Race({ courses: COURSES, storage: memoryStorage() })
  race.start('trial')
  assert.equal(race.state, 'countdown')
  race.update(1, far)
  assert.equal(race.state, 'countdown')
  assert.equal(race.elapsed, 0)
  race.update(2.5, far)
  assert.equal(race.state, 'running')
})

test('gates must be passed in order', () => {
  const race = new Race({ courses: COURSES, storage: memoryStorage() })
  race.start('trial')
  race.update(3.1, far)
  race.update(0.1, COURSES.trial.gates[2].position)
  assert.equal(race.nextGate, 0)
  race.update(0.1, COURSES.trial.gates[0].position)
  assert.equal(race.nextGate, 1)
  race.update(0.1, COURSES.trial.gates[1].position)
  assert.equal(race.nextGate, 2)
})

test('passing the last gate finishes the race with the elapsed time and splits', () => {
  const race = new Race({ courses: COURSES, storage: memoryStorage() })
  let result = null
  race.events.on('finish', (r) => { result = r })
  runCourse(race, 'trial', [10, 10, 10])
  assert.equal(race.state, 'finished')
  assert.ok(result)
  assert.ok(Math.abs(result.time - 30) < 1e-9)
  assert.deepEqual(result.splits.map(Math.round), [10, 20, 30])
  assert.equal(result.isBest, true)
  assert.equal(result.rank, 1)
})

test('the leaderboard is sorted, capped at five and persisted per course', () => {
  const storage = memoryStorage()
  const times = [40, 25, 60, 30, 20, 50, 35]
  for (const t of times) {
    const race = new Race({ courses: COURSES, storage })
    runCourse(race, 'trial', [t, 0, 0])
  }
  const race = new Race({ courses: COURSES, storage })
  const board = race.leaderboard('trial')
  assert.deepEqual(board.map(e => Math.round(e.time)), [20, 25, 30, 35, 40])
  assert.equal(race.leaderboard('sling').length, 0)
})

test('a slower lap is not a new best but still reports its rank', () => {
  const storage = memoryStorage()
  const first = new Race({ courses: COURSES, storage })
  runCourse(first, 'trial', [20, 0, 0])
  const second = new Race({ courses: COURSES, storage })
  let result = null
  second.events.on('finish', (r) => { result = r })
  runCourse(second, 'trial', [45, 0, 0])
  assert.equal(result.isBest, false)
  assert.equal(result.rank, 2)
  assert.ok(Math.abs(result.best - 20) < 1e-9)
})

test('aborting returns to idle and records nothing', () => {
  const storage = memoryStorage()
  const race = new Race({ courses: COURSES, storage })
  let aborted = 0
  race.events.on('abort', () => aborted++)
  race.start('trial')
  race.update(5, far)
  race.abort()
  assert.equal(race.state, 'idle')
  assert.equal(aborted, 1)
  assert.equal(race.leaderboard('trial').length, 0)
  race.abort()
  assert.equal(aborted, 1)
})

test('reset after finishing clears the course for another attempt', () => {
  const race = new Race({ courses: COURSES, storage: memoryStorage() })
  runCourse(race, 'trial', [5, 5, 5])
  race.reset()
  assert.equal(race.state, 'idle')
  assert.equal(race.active, false)
  race.start('sling')
  assert.equal(race.course.name, 'SLINGSHOT')
})

test('countdown ticks are reported as whole seconds', () => {
  const race = new Race({ courses: COURSES, storage: memoryStorage() })
  const ticks = []
  race.events.on('countdown', (n) => ticks.push(n))
  race.start('trial')
  race.update(0.5, far)
  race.update(1, far)
  race.update(1, far)
  race.update(1, far)
  assert.deepEqual(ticks, [3, 2, 1])
})
