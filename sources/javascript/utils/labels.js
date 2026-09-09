import * as THREE from 'three'

/** A camera-facing text label rendered from a canvas. `width` is its world-space width. */
export function makeLabelSprite(text, { color = '#ece4d3', width = 18, sub = '' } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = sub ? 160 : 96
  const ctx = canvas.getContext('2d')
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 18
  ctx.font = '600 44px "IBM Plex Mono", "JetBrains Mono", monospace'
  ctx.fillText(text, 256, sub ? 52 : 48)
  if (sub) {
    ctx.font = '400 26px "IBM Plex Mono", "JetBrains Mono", monospace'
    ctx.globalAlpha = 0.75
    ctx.fillText(sub, 256, 112)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0.9 })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(width, width * (canvas.height / canvas.width), 1)
  return sprite
}
