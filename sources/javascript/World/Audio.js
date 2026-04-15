export default class Audio {
  constructor() {
    this._audio = new window.Audio('/audio/ambient.mp3')
    this._audio.loop = true
    this._audio.volume = 0
    this._audio.preload = 'auto'
  }

  start() {
    this._fadeIn()
  }

  _fadeIn(targetVolume = 0.35, duration = 4000) {
    const steps = 60
    const stepTime = duration / steps
    const stepVolume = targetVolume / steps
    let current = 0

    this._audio.play().catch(() => {
      // Autoplay blocked — will start on first user interaction
      const resume = () => {
        this._audio.play()
        this._fadeIn(targetVolume, duration)
        window.removeEventListener('pointerdown', resume)
        window.removeEventListener('keydown', resume)
      }
      window.addEventListener('pointerdown', resume, { once: true })
      window.addEventListener('keydown', resume, { once: true })
    })

    const tick = setInterval(() => {
      current++
      this._audio.volume = Math.min(targetVolume, stepVolume * current)
      if (current >= steps) clearInterval(tick)
    }, stepTime)
  }

  setVolume(v) {
    this._audio.volume = Math.max(0, Math.min(1, v))
  }

  dispose() {
    this._audio.pause()
    this._audio.src = ''
  }
}
