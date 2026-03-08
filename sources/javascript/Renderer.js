import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js'
import Experience from './Experience.js'

export default class Renderer {
  constructor() {
    const exp = Experience.getInstance()
    this.canvas = exp.canvas
    this.scene = exp.scene
    this.camera = exp.camera
    this.sizes = exp.sizes
    this.ticker = exp.ticker

    this._setup()
    this._setupPostProcessing()

    this.sizes.events.on('resize', () => this._resize())
    this.ticker.events.on('tick', () => this._render(), 998)
  }

  _setup() {
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    })
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)
    this.instance.toneMapping = THREE.ACESFilmicToneMapping
    this.instance.toneMappingExposure = 0.8
    this.instance.shadowMap.enabled = false
  }

  _setupPostProcessing() {
    this.composer = new EffectComposer(this.instance)

    const renderPass = new RenderPass(this.scene, this.camera.instance)
    this.composer.addPass(renderPass)

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.sizes.width, this.sizes.height),
      0.8,  // strength: reduced from 1.2
      0.5,  // radius
      0.5   // threshold: raised from 0.1 — only bright emissives bloom now
    )
    this.composer.addPass(this.bloomPass)

    const gammaPass = new ShaderPass(GammaCorrectionShader)
    this.composer.addPass(gammaPass)
  }

  _resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)
    this.composer.setSize(this.sizes.width, this.sizes.height)
    this.camera.instance.aspect = this.sizes.ratio
    this.camera.instance.updateProjectionMatrix()
  }

  _render() {
    this.composer.render()
  }
}
