export default class Events {
  constructor() {
    this._callbacks = {}
  }

  on(name, callback, order = 0) {
    if (!this._callbacks[name]) this._callbacks[name] = []
    this._callbacks[name].push({ callback, order })
    this._callbacks[name].sort((a, b) => a.order - b.order)
    return this
  }

  off(name, callback) {
    if (!this._callbacks[name]) return this
    if (!callback) {
      delete this._callbacks[name]
    } else {
      this._callbacks[name] = this._callbacks[name].filter(c => c.callback !== callback)
    }
    return this
  }

  trigger(name, args = []) {
    if (!this._callbacks[name]) return this
    this._callbacks[name].forEach(({ callback }) => callback(...args))
    return this
  }
}
