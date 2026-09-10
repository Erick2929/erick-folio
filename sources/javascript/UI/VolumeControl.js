/**
 * Volume sliders bound to the audio engine. Full mode shows master, music and effects plus a
 * mute button; compact mode shows the master slider only. Every instance stays in sync through
 * the engine's 'volume' event, so the title screen, HUD and pause menu never disagree.
 */
export default class VolumeControl {
  constructor(container, audio, { compact = false } = {}) {
    this.audio = audio
    this.container = container
    container.classList.add('volume-control')
    const rows = compact ? [['master', 'VOLUME']] : [['master', 'VOLUME'], ['music', 'MUSIC'], ['sfx', 'EFFECTS']]
    container.innerHTML = rows.map(([key, label]) => `
      <label class="vol-row">
        <span class="vol-label">${label}</span>
        <input type="range" min="0" max="100" step="5" data-vol="${key}" aria-label="${label} volume">
        <span class="vol-value"></span>
      </label>`).join('') + (compact ? '' : '<button type="button" class="btn vol-mute">[ MUTE ]</button>')

    this.inputs = [...container.querySelectorAll('input[type=range]')]
    for (const input of this.inputs) {
      input.addEventListener('input', () => {
        audio.unlock()
        audio.setVolume(input.dataset.vol, input.valueAsNumber / 100)
      })
      input.addEventListener('change', () => input.blur())
    }
    this.mute = container.querySelector('.vol-mute')
    this.mute?.addEventListener('click', () => { audio.unlock(); audio.toggleMute() })

    audio.events.on('volume', () => this.sync())
    this.sync()
  }

  sync() {
    for (const input of this.inputs) {
      const value = Math.round(this.audio.volumes[input.dataset.vol] * 100)
      if (document.activeElement !== input) input.value = value
      input.nextElementSibling.textContent = value + '%'
    }
    if (this.mute) this.mute.textContent = this.audio.muted ? '[ UNMUTE ]' : '[ MUTE ]'
    this.container.classList.toggle('muted', this.audio.muted)
  }
}
