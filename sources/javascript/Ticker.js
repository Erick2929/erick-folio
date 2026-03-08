import Events from './Events.js'

export default class Ticker {
  constructor() {
    this.events = new Events()
    this.elapsed = 0
    this.delta = 0
    this._last = 0
    this._raf = null
    this._bound = this._tick.bind(this)
    this._raf = requestAnimationFrame(this._bound)
  }

  _tick(now) {
    const nowSecs = now * 0.001
    this.delta = Math.min(nowSecs - this._last, 1 / 30)
    this._last = nowSecs
    this.elapsed += this.delta
    this.events.trigger('tick', [this.delta, this.elapsed])
    this._raf = requestAnimationFrame(this._bound)
  }

  dispose() {
    cancelAnimationFrame(this._raf)
  }
}
