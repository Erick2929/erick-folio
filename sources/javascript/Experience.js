import * as THREE from 'three'
import Events from './Events.js'
import Sizes from './Sizes.js'
import Ticker from './Ticker.js'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import Ship from './World/Ship.js'
import World from './World/World.js'
import Intro from './UI/Intro.js'
import HUD from './UI/HUD.js'

export default class Experience {
  static instance

  static getInstance() { return Experience.instance }

  constructor() {
    if (Experience.instance) return Experience.instance
    Experience.instance = this

    this.canvas = document.querySelector('canvas.webgl')
    this.scene = new THREE.Scene()

    this.events = new Events()
    this.sizes = new Sizes()
    this.ticker = new Ticker()
    this.camera = new Camera()
    this.renderer = new Renderer()
    this.ship = new Ship()
    this.world = new World()
    this.hud = new HUD()

    // Pause ticker until intro done
    this.ticker.dispose()
    this.intro = new Intro(() => {
      // Restart ticker after intro
      this.ticker._last = performance.now() * 0.001
      this.ticker._raf = requestAnimationFrame(this.ticker._bound)
      // Start audio only after user clicks Launch
      this.world.audio.start()
    })
  }
}

new Experience()
