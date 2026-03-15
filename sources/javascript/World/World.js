import Galaxy from './Galaxy.js'
import SpaceDust from './SpaceDust.js'
import Nebula from './Nebula.js'
import Audio from './Audio.js'
import ProjectDetector from './ProjectDetector.js'
import Experience from '../Experience.js'

export default class World {
  constructor() {
    const exp = Experience.getInstance()
    this.galaxy = new Galaxy()
    this.spaceDust = new SpaceDust()
    this.nebula = new Nebula()
    this.audio = new Audio()
    this.projectDetector = new ProjectDetector(this.galaxy, exp.ship)
  }
}
