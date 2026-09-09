import Experience from '../Experience.js'
import { formatRaceTime } from './HUD.js'

/** The leaderboard card after a race or a range session. Pauses the run until dismissed. */
export default class RaceResults {
  constructor() {
    const exp = Experience.getInstance()
    this.game = exp.game
    const $ = (id) => document.getElementById(id)
    this.el = { root: $('race-dialog'), tag: $('race-result-tag'), title: $('race-result-title'), time: $('race-result-time'), note: $('race-result-note'), board: $('race-board'), again: $('race-again') }
    this.isOpen = false

    $('race-again').addEventListener('click', () => this.close(true))
    $('race-continue').addEventListener('click', () => this.close(false))
    exp.input.onKey('Enter', () => { if (this.isOpen) this.close(false) })
    this.game.events.on('race-finish', (result) => setTimeout(() => this.show(result), 700))
    this.game.events.on('range-finish', (result) => setTimeout(() => this.showScore(result), 700))
  }

  show(result) {
    this.el.tag.textContent = '// TIME TRIAL · RESULTS'
    this.el.again.textContent = '[ RACE AGAIN ]'
    this.el.title.textContent = `${result.courseName} COMPLETE`
    this.el.time.textContent = formatRaceTime(result.time)
    this.el.note.textContent = result.isBest ? 'NEW RECORD' : `RANK #${result.rank} · BEST ${formatRaceTime(result.best)}`
    this.el.note.className = result.isBest ? 'race-note good' : 'race-note'
    this.el.board.innerHTML = result.board.map((entry, i) => {
      const date = new Date(entry.date)
      const when = isNaN(date) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      const mine = Math.abs(entry.time - result.time) < 1e-9 && i === result.rank - 1
      return `<li class="${mine ? 'mine' : ''}"><span>#${i + 1}</span><b>${formatRaceTime(entry.time)}</b><span>${when}</span></li>`
    }).join('')
    this._open()
  }

  showScore(result) {
    this.el.tag.textContent = '// TARGET RANGE · RESULTS'
    this.el.again.textContent = '[ SHOOT AGAIN ]'
    this.el.title.textContent = 'TARGET RANGE COMPLETE'
    this.el.time.textContent = `${result.score.toLocaleString()} PTS`
    this.el.note.textContent = (result.isBest ? 'NEW RECORD' : `RANK #${result.rank} · BEST ${result.best.toLocaleString()} PTS`) + ` · ${result.hits} HITS · ${result.accuracy}% ACCURACY`
    this.el.note.className = result.isBest ? 'race-note good' : 'race-note'
    this.el.board.innerHTML = result.board.map((entry, i) => {
      const date = new Date(entry.date)
      const when = isNaN(date) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      const mine = entry.score === result.score && i === result.rank - 1
      return `<li class="${mine ? 'mine' : ''}"><span>#${i + 1}</span><b>${entry.score.toLocaleString()} PTS · ${entry.accuracy}%</b><span>${when}</span></li>`
    }).join('')
    this._open()
  }

  _open() {
    this.el.root.classList.remove('hidden')
    if (!this.isOpen) this.game.setOverlay(true)
    this.isOpen = true
  }

  close(again) {
    if (!this.isOpen) return
    this.isOpen = false
    this.el.root.classList.add('hidden')
    this.game.setOverlay(false)
    this.game.closeActivityResults(again)
  }
}
