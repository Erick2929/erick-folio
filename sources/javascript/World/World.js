import City from './City.js'
import Rain from './Rain.js'
import Audio from './Audio.js'
import ProjectDetector from './ProjectDetector.js'
import Experience from '../Experience.js'

export default class World {
  constructor() {
    const exp = Experience.getInstance()
    this.city = new City()
    this.rain = new Rain()
    this.audio = new Audio()
    this.projectDetector = new ProjectDetector(this.city, exp.ship)
  }
}
