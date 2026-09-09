import Events from './Events.js'
import { isTouchDevice } from './utils/device.js'

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
    // Phones and tablets render at 1x: the post-processing chain is the expensive part.
    this.pixelRatio = Math.min(window.devicePixelRatio, isTouchDevice() ? 1 : 1.5)
    this.ratio = this.width / this.height
  }
}
