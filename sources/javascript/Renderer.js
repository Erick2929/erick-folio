import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import Experience from './Experience.js'
import LayerRenderPass from './Render/LayerRenderPass.js'
import { LensShader, CinematicShader } from './Render/shaders.js'
import { lerp } from './utils/maths.js'

export const WORLD_LAYER = 0
export const SHIP_LAYER = 1

const _view = new THREE.Vector3()
const _ndc = new THREE.Vector3()

/**
 * Owns the WebGL renderer and the post-processing chain:
 * world → gravitational lens → ship composite → bloom → cinematic grade → output.
 *
 * Other systems drive the look through `effects` (all 0..1): boost, damage, heat, flash, fade.
 */
export default class Renderer {
  constructor() {
    const exp = Experience.getInstance()
    this.canvas = exp.canvas
    this.scene = exp.scene
    this.camera = exp.camera
    this.sizes = exp.sizes
    this.ticker = exp.ticker

    this.effects = { boost: 0, damage: 0, heat: 0, flash: 0, fade: 0, lensGlow: 1 }
    /** When true the composer stops drawing (the finale card covers the canvas). */
    this.paused = false
    this._lensStrength = 0

    this._setup()
    this._setupPostProcessing()

    this.sizes.events.on('resize', () => this._resize())
    this.ticker.events.on('tick', (delta, elapsed) => this._render(delta, elapsed), 998)
  }

  _setup() {
    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
    })
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)
    this.instance.toneMapping = THREE.ACESFilmicToneMapping
    this.instance.toneMappingExposure = 0.95
    this.instance.shadowMap.enabled = false
  }

  _setupPostProcessing() {
    this.composer = new EffectComposer(this.instance)
    const cam = this.camera.instance

    this.composer.addPass(new LayerRenderPass(this.scene, cam, WORLD_LAYER, { clear: true }))

    this.lensPass = new ShaderPass(LensShader)
    this.composer.addPass(this.lensPass)

    this.composer.addPass(new LayerRenderPass(this.scene, cam, SHIP_LAYER, { clear: false, clearDepth: true }))

    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.sizes.width, this.sizes.height), 0.42, 0.4, 0.9)
    this.composer.addPass(this.bloomPass)

    this.cinematicPass = new ShaderPass(CinematicShader)
    this.composer.addPass(this.cinematicPass)

    this.composer.addPass(new OutputPass())
  }

  _resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)
    this.composer.setSize(this.sizes.width, this.sizes.height)
    this.composer.setPixelRatio(this.sizes.pixelRatio)
  }

  _updateLens(delta) {
    const u = this.lensPass.uniforms
    const blackHole = Experience.getInstance().world?.blackHole
    const cam = this.camera.instance
    let target = 0

    if (blackHole) {
      cam.updateMatrixWorld(true)
      cam.matrixWorldInverse.copy(cam.matrixWorld).invert()
      _view.copy(blackHole.position).applyMatrix4(cam.matrixWorldInverse)
      const dist = _view.length()
      if (_view.z < -0.5 && dist > 0.01) {
        _ndc.copy(blackHole.position).project(cam)
        u.uCenter.value.set(_ndc.x * 0.5 + 0.5, _ndc.y * 0.5 + 0.5)
        const angular = Math.asin(Math.min(blackHole.rs / dist, 0.999))
        const halfFov = Math.tan(THREE.MathUtils.degToRad(cam.fov) * 0.5)
        u.uShadow.value = (Math.tan(angular) / halfFov) * 0.5
        target = 1
      }
    }

    this._lensStrength = lerp(this._lensStrength, target, 1 - Math.pow(0.001, delta))
    u.uStrength.value = this._lensStrength
    u.uAspect.value = this.sizes.ratio
    u.uGlow.value = this.effects.lensGlow
  }

  _updateCinematic(delta, elapsed) {
    const u = this.cinematicPass.uniforms
    const e = this.effects
    u.uTime.value = elapsed
    u.uRadial.value = lerp(u.uRadial.value, e.boost * 0.09, 1 - Math.pow(0.01, delta))
    u.uAberration.value = lerp(u.uAberration.value, e.boost * 0.006 + e.heat * 0.01 + e.flash * 0.02, 1 - Math.pow(0.01, delta))
    u.uDamage.value = e.damage
    u.uHeat.value = e.heat
    u.uFlash.value = e.flash
    u.uFade.value = e.fade
  }

  _render(delta, elapsed) {
    if (this.paused) return
    this._updateLens(delta)
    this._updateCinematic(delta, elapsed)
    this.composer.render()
  }
}
