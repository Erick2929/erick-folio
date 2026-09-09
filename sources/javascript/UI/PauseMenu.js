import Experience from '../Experience.js'
import { formatRaceTime } from './HUD.js'

/** Escape handling and the pause card: resume, restart, courses, sound, and the achievements list. */
export default class PauseMenu {
  constructor() {
    const exp = Experience.getInstance()
    this._exp = exp
    this.game = exp.game
    this.el = document.getElementById('pause')
    this.isOpen = false
    const $ = (id) => document.getElementById(id)

    $('btn-resume').addEventListener('click', () => this.close())
    $('btn-restart').addEventListener('click', () => { this.close(); this.game.restart() })
    $('btn-pause-sound').addEventListener('click', () => {
      exp.audio.unlock()
      exp.audio.toggleMute()
      exp.hud._syncSoundButton()
    })
    $('btn-race-trial').addEventListener('click', () => { this.close(); this.game.startRace('trial') })
    $('btn-range').addEventListener('click', () => { this.close(); this.game.startRange() })
    $('btn-abort-race').addEventListener('click', () => { this.close(); this.game.abortActivity() })
    exp.input.onKey('Escape', () => this._onEscape())
    exp.input.onKey('KeyP', () => this.toggle())
  }

  _onEscape() {
    const run = this.game.run
    if (run.state === 'title') return
    if (this._exp.dialog.isOpen) return this._exp.dialog.close()
    if (this._exp.raceResults?.isOpen) return this._exp.raceResults.close(false)
    if (this._exp.panels.isOpen) return this._exp.panels.close()
    if (run.state === 'finale') return
    this.toggle()
  }

  toggle() { this.isOpen ? this.close() : this.open() }

  open() {
    const run = this.game.run
    if (this.isOpen || run.state === 'title' || run.state === 'finale') return
    this.isOpen = true
    this._render()
    this.el.classList.remove('hidden')
    this.game.setOverlay(true)
  }

  close() {
    if (!this.isOpen) return
    this.isOpen = false
    this.el.classList.add('hidden')
    this.game.setOverlay(false)
  }

  _render() {
    const busy = this.game.activityRunning
    document.getElementById('btn-race-trial').classList.toggle('hidden', busy)
    document.getElementById('btn-range').classList.toggle('hidden', busy)
    document.getElementById('btn-abort-race').classList.toggle('hidden', !busy)

    const best = this.game.race.leaderboard('trial')[0]
    const sling = this.game.race.leaderboard('slingshot')[0]
    const range = this.game.range.leaderboard()[0]
    document.getElementById('pause-best').textContent = [
      best ? `TIME TRIAL BEST ${formatRaceTime(best.time)}` : 'TIME TRIAL · NO TIME SET',
      range ? `RANGE BEST ${range.score.toLocaleString()} PTS` : 'RANGE · NO SCORE SET',
      sling ? `SLINGSHOT BEST ${formatRaceTime(sling.time)}` : '',
    ].filter(Boolean).join(' · ')

    const list = this.game.achievements.list
    const grid = document.getElementById('achievements')
    grid.innerHTML = list.map((a) => `
      <div class="ach ${a.unlocked ? 'unlocked' : ''}">
        <span class="ach-name">${a.unlocked ? '◆' : '◇'} ${a.name}</span>
        <span class="ach-hint">${a.hint}</span>
      </div>`).join('')
    document.getElementById('achievements-count').textContent = `ACHIEVEMENTS ${this.game.achievements.count}/${this.game.achievements.total}`
  }
}
