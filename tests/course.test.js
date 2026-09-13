import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LAYOUT } from '../sources/javascript/data/profile.js'

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
const trial = LAYOUT.race.courses.trial

test('the time trial is one big lap that never dives into the gravity well', () => {
  for (const gate of trial.gates) {
    assert.equal(gate.local, undefined, 'trial gates are placed in world space')
    const r = Math.hypot(gate.position[0], gate.position[2])
    assert.ok(r >= 88, `gate too close to the singularity (r=${r.toFixed(0)})`)
  }
})

test('every trial gate keeps clear of planets, the station and the debris belt', () => {
  const bodies = LAYOUT.worlds.map(w => ({ name: w.name, position: w.position, clearance: w.radius + (w.belt ? w.belt.outer : 0) + 12 }))
  bodies.push({ name: 'station', position: LAYOUT.station.position, clearance: LAYOUT.station.radius + 30 })
  for (const gate of trial.gates) {
    for (const body of bodies) {
      assert.ok(dist(gate.position, body.position) >= body.clearance, `gate at ${gate.position.map(v => v.toFixed(0))} clips ${body.name}`)
    }
  }
})

test('trial gates are wide and the finish sits near the singularity above the disk', () => {
  assert.ok(trial.gates.every(g => g.radius >= 11))
  const finish = trial.gates[trial.gates.length - 1]
  const r = Math.hypot(finish.position[0], finish.position[2])
  assert.ok(r <= 110 && finish.position[1] >= 30)
})

test('consecutive gates are spaced for a cruising ship, not a slalom', () => {
  for (let i = 1; i < trial.gates.length; i++) {
    const d = dist(trial.gates[i - 1].position, trial.gates[i].position)
    assert.ok(d >= 60 && d <= 260, `gates ${i} and ${i + 1} are ${d.toFixed(0)} apart`)
  }
})
