/**
 * All sound in the game: the ambient music track plus procedurally synthesized effects.
 *
 * Nothing plays until `unlock()` runs inside a user gesture (the Launch button). Effects are
 * short Web Audio graphs built on demand; the engine hum and boost roar are continuous voices
 * whose levels follow `setFlight()` every frame.
 */
const STORAGE_KEY = 'event-horizon:muted'

export default class AudioEngine {
  constructor() {
    this.ctx = null
    this.muted = readMuted()
    this._music = new window.Audio('./audio/ambient.mp3')
    this._music.loop = true
    this._music.preload = 'auto'
    this._music.volume = 0
    this._musicTarget = 0.32
    this._alarmOn = false
  }

  get ready() { return this.ctx !== null }

  /** Must be called from a user gesture. Safe to call more than once. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 1
    this.master.connect(this.ctx.destination)
    this._buildEngine()
    this._buildBoost()
    this._buildAlarm()
    this._startMusic()
  }

  toggleMute() {
    this.muted = !this.muted
    try { localStorage.setItem(STORAGE_KEY, this.muted ? '1' : '0') } catch { /* private mode */ }
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05)
    this._music.volume = this.muted ? 0 : this._musicTarget
    return this.muted
  }

  _startMusic() {
    const fade = () => {
      let step = 0
      const id = setInterval(() => {
        step++
        this._music.volume = this.muted ? 0 : Math.min(this._musicTarget, (this._musicTarget * step) / 60)
        if (step >= 60) clearInterval(id)
      }, 60)
    }
    this._music.play().then(fade).catch(() => {
      const resume = () => { this._music.play().then(fade).catch(() => {}) }
      window.addEventListener('pointerdown', resume, { once: true })
      window.addEventListener('keydown', resume, { once: true })
    })
  }

  _noiseBuffer(seconds = 1.5) {
    const length = Math.floor(this.ctx.sampleRate * seconds)
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
    return buffer
  }

  _buildEngine() {
    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 48
    const sub = this.ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.value = 24
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 180
    filter.Q.value = 2
    const gain = this.ctx.createGain()
    gain.gain.value = 0
    osc.connect(filter)
    sub.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    osc.start()
    sub.start()
    this._engine = { osc, sub, filter, gain }
  }

  _buildBoost() {
    const src = this.ctx.createBufferSource()
    src.buffer = this._noiseBuffer(2)
    src.loop = true
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 420
    filter.Q.value = 0.7
    const gain = this.ctx.createGain()
    gain.gain.value = 0
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start()
    this._boost = { src, filter, gain }
  }

  /**
   * Gravity-well warning. The tremolo (LFO) only shapes the tone inside its own gain stage;
   * a separate level envelope sits after it so the alarm is fully silent when it is off.
   */
  _buildAlarm() {
    const osc = this.ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = 220
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 600

    const tremolo = this.ctx.createGain()
    tremolo.gain.value = 0.5
    const lfo = this.ctx.createOscillator()
    lfo.frequency.value = 3
    const depth = this.ctx.createGain()
    depth.gain.value = 0.5
    lfo.connect(depth)
    depth.connect(tremolo.gain)

    const level = this.ctx.createGain()
    level.gain.value = 0

    osc.connect(filter)
    filter.connect(tremolo)
    tremolo.connect(level)
    level.connect(this.master)
    osc.start()
    lfo.start()
    this._alarm = { osc, level }
  }

  /** Per-frame: speed and boost in 0..1, plus how deep the ship sits in the gravity well (0..1). */
  setFlight(speed, boost, danger) {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this._engine.gain.gain.setTargetAtTime(0.004 + speed * 0.01, t, 0.1)
    this._engine.osc.frequency.setTargetAtTime(44 + speed * 40 + boost * 30, t, 0.15)
    this._engine.filter.frequency.setTargetAtTime(160 + speed * 500 + boost * 700, t, 0.15)
    this._boost.gain.gain.setTargetAtTime(boost * 0.05, t, 0.12)
    this._boost.filter.frequency.setTargetAtTime(380 + boost * 900, t, 0.2)
    this._alarm.level.gain.setTargetAtTime(danger > 0.05 ? 0.008 + danger * 0.03 : 0, t, 0.25)
    this._alarm.osc.frequency.setTargetAtTime(180 + danger * 160, t, 0.2)
  }

  _tone({ freq, type = 'sine', duration = 0.2, gain = 0.2, attack = 0.005, slide = null, delay = 0 }) {
    if (!this.ctx) return
    const t0 = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + duration)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(g)
    g.connect(this.master)
    osc.start(t0)
    osc.stop(t0 + duration + 0.05)
  }

  _noiseHit({ duration = 0.25, gain = 0.3, freq = 900, delay = 0 }) {
    if (!this.ctx) return
    const t0 = this.ctx.currentTime + delay
    const src = this.ctx.createBufferSource()
    src.buffer = this._noiseBuffer(duration + 0.1)
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(freq, t0)
    filter.frequency.exponentialRampToValueAtTime(80, t0 + duration)
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(gain, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    src.connect(filter)
    filter.connect(g)
    g.connect(this.master)
    src.start(t0)
    src.stop(t0 + duration + 0.1)
  }

  pickup(index = 0) {
    const base = 660 * Math.pow(2, (index % 5) / 12)
    this._tone({ freq: base, type: 'triangle', duration: 0.18, gain: 0.16 })
    this._tone({ freq: base * 1.5, type: 'sine', duration: 0.28, gain: 0.12, delay: 0.06 })
  }

  scanTick() {
    this._tone({ freq: 1200, type: 'square', duration: 0.04, gain: 0.03 })
  }

  scanComplete() {
    ;[523, 659, 784, 1046].forEach((f, i) => this._tone({ freq: f, type: 'triangle', duration: 0.35, gain: 0.14, delay: i * 0.09 }))
  }

  dock() {
    this._tone({ freq: 196, type: 'sine', duration: 0.6, gain: 0.2 })
    this._tone({ freq: 392, type: 'triangle', duration: 0.5, gain: 0.12, delay: 0.15 })
    this._noiseHit({ duration: 0.4, gain: 0.12, freq: 500, delay: 0.1 })
  }

  hit(strength = 1) {
    this._noiseHit({ duration: 0.3, gain: 0.25 * strength, freq: 1200 })
    this._tone({ freq: 90, type: 'sine', duration: 0.25, gain: 0.25 * strength, slide: 40 })
  }

  pulse() {
    this._tone({ freq: 880, type: 'sine', duration: 0.5, gain: 0.12, slide: 220 })
  }

  wormhole() {
    this._tone({ freq: 120, type: 'sawtooth', duration: 1.6, gain: 0.18, slide: 1400 })
    this._noiseHit({ duration: 1.2, gain: 0.2, freq: 3000 })
  }

  reboot() {
    this._tone({ freq: 400, type: 'square', duration: 0.5, gain: 0.12, slide: 60 })
    this._noiseHit({ duration: 0.7, gain: 0.25, freq: 2000 })
  }

  horizonOpen() {
    ;[262, 330, 392, 523, 659].forEach((f, i) => this._tone({ freq: f, type: 'sine', duration: 1.2, gain: 0.12, delay: i * 0.12 }))
  }

  finale() {
    this._tone({ freq: 55, type: 'sine', duration: 6, gain: 0.3, attack: 1.5 })
    this._tone({ freq: 110, type: 'triangle', duration: 6, gain: 0.12, attack: 2 })
    this._tone({ freq: 220, type: 'sine', duration: 5, gain: 0.08, attack: 3, slide: 880 })
  }

  boostDenied() {
    this._tone({ freq: 160, type: 'square', duration: 0.09, gain: 0.05 })
    this._tone({ freq: 120, type: 'square', duration: 0.12, gain: 0.05, delay: 0.1 })
  }

  fuel() {
    ;[440, 660, 880, 1320].forEach((f, i) => this._tone({ freq: f, type: 'triangle', duration: 0.25, gain: 0.12, delay: i * 0.05 }))
    this._noiseHit({ duration: 0.5, gain: 0.08, freq: 2400 })
  }

  countdown(n) {
    this._tone({ freq: n === 0 ? 880 : 440, type: 'square', duration: n === 0 ? 0.5 : 0.15, gain: 0.08 })
  }

  gate() {
    this._tone({ freq: 700, type: 'triangle', duration: 0.12, gain: 0.1 })
    this._tone({ freq: 1050, type: 'sine', duration: 0.2, gain: 0.08, delay: 0.05 })
  }

  raceFinish() {
    ;[523, 659, 784, 1046, 1318].forEach((f, i) => this._tone({ freq: f, type: 'triangle', duration: 0.5, gain: 0.12, delay: i * 0.08 }))
  }

  achievement() {
    ;[784, 988, 1175].forEach((f, i) => this._tone({ freq: f, type: 'sine', duration: 0.6, gain: 0.1, delay: i * 0.12 }))
  }

  shoot() {
    this._tone({ freq: 1400, type: 'square', duration: 0.07, gain: 0.05, slide: 320 })
  }

  targetHit() {
    this._tone({ freq: 520, type: 'triangle', duration: 0.08, gain: 0.07 })
  }

  targetDestroyed(combo = 1) {
    this._noiseHit({ duration: 0.25, gain: 0.14, freq: 1800 })
    this._tone({ freq: 330 * Math.pow(1.19, Math.min(combo, 4)), type: 'triangle', duration: 0.22, gain: 0.1 })
  }

  duckMusic(on) {
    this._music.volume = this.muted ? 0 : (on ? this._musicTarget * 0.35 : this._musicTarget)
  }
}

function readMuted() {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}
