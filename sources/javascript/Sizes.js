import Events from './Events.js'

export default class Sizes {
  constructor() {
    this.events = new Events()
    this.measure()
    window.addEventListener('resize', () => {
      this.measure()
      this.events.trigger('resize')
    })
  }

  measure() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.pixelRatio = Math.min(window.devicePixelRatio, 2)
    this.ratio = this.width / this.height
  }
}
