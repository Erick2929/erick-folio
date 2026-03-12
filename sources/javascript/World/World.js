import City from './City.js'
import Rain from './Rain.js'
import Audio from './Audio.js'
import Experience from '../Experience.js'

export default class World {
  constructor() {
    this.city = new City()
    this.rain = new Rain()
    this.audio = new Audio()
  }
}
