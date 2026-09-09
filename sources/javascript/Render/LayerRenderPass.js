import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'

/**
 * A RenderPass that draws only one camera layer. Lets the composer render the world, lens it,
 * and then draw the ship on top so the ship is never bent or swallowed by the shadow.
 *
 * When `clear` is false the scene background is suppressed for the pass: three.js forces a
 * clear whenever a background colour is set, which would erase the frame underneath.
 */
export default class LayerRenderPass extends RenderPass {
  constructor(scene, camera, layer, { clear = true, clearDepth = false } = {}) {
    super(scene, camera)
    this.layer = layer
    this.clear = clear
    this.clearDepth = false
    this._clearDepthFirst = clearDepth
  }

  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    const mask = this.camera.layers.mask
    const background = this.scene.background
    this.camera.layers.set(this.layer)
    if (!this.clear) this.scene.background = null
    if (this._clearDepthFirst) {
      renderer.setRenderTarget(this.renderToScreen ? null : readBuffer)
      renderer.clearDepth()
    }
    super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive)
    this.scene.background = background
    this.camera.layers.mask = mask
  }
}
