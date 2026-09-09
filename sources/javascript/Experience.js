import * as THREE from 'three'
import Events from './Events.js'
import Sizes from './Sizes.js'
import Ticker from './Ticker.js'
import Input from './Input.js'
import AudioEngine from './Audio/AudioEngine.js'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import Ship from './World/Ship.js'
import World from './World/World.js'
import Game from './Game/Game.js'
import HUD from './UI/HUD.js'
import Panels from './UI/Panels.js'
import Dialog from './UI/Dialog.js'
import RaceResults from './UI/RaceResults.js'
import Finale from './UI/Finale.js'
import PauseMenu from './UI/PauseMenu.js'
import TouchControls from './UI/TouchControls.js'
import Intro from './UI/Intro.js'

/**
 * Composition root. Every system reaches shared state through `Experience.getInstance()`.
 * Construction order matters: the ship needs the camera, the world needs the ship,
 * the game needs the world, and the UI needs the game.
 */
export default class Experience {
  static instance

  static getInstance() { return Experience.instance }

  constructor() {
    if (Experience.instance) return Experience.instance
    Experience.instance = this
    window.experience = this

    this.canvas = document.querySelector('canvas.webgl')
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x020308)

    this.events = new Events()
    this.sizes = new Sizes()
    this.ticker = new Ticker()
    this.input = new Input(this.canvas)
    this.audio = new AudioEngine()
    this.camera = new Camera()
    this.renderer = new Renderer()
    this.ship = new Ship()
    this.world = new World()
    this.game = new Game()
    this.hud = new HUD()
    this.panels = new Panels()
    this.dialog = new Dialog()
    this.raceResults = new RaceResults()
    this.finale = new Finale()
    this.pauseMenu = new PauseMenu()
    this.touch = new TouchControls()
    this.intro = new Intro()

    const spawn = this.world.spawnPoint()
    this.ship.teleport(spawn.position, spawn.lookAt)

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.game.run.running && !this.pauseMenu.isOpen) this.pauseMenu.open()
    })
  }
}

