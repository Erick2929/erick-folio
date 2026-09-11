import * as THREE from 'three'
import { fbm } from '../utils/noise.js'

const ATMOSPHERE_VERTEX = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const ATMOSPHERE_FRAGMENT = /* glsl */`
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = clamp(1.0 + dot(vNormal, vView), 0.0, 1.0);
    float glow = pow(f, uPower);
    gl_FragColor = vec4(uColor * glow * uIntensity, glow);
  }
`

/** Fresnel rim glow on a back-face shell around a body. */
export function atmosphere(radius, color, power, intensity) {
  const material = new THREE.ShaderMaterial({
    vertexShader: ATMOSPHERE_VERTEX,
    fragmentShader: ATMOSPHERE_FRAGMENT,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uPower: { value: power },
      uIntensity: { value: intensity },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  })
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), material)
}

/** A banded, noisy planet texture from two CSS colours. Deterministic per seed. */
export function planetTexture(baseCss, bandsCss, seed) {
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(w, h)
  const base = cssToRgb(baseCss)
  const bands = cssToRgb(bandsCss)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w
      const ny = y / h
      const warp = fbm(nx * 6, ny * 3, seed, 3) * 0.6
      const band = 0.5 + 0.5 * Math.sin((ny * 11 + warp) * Math.PI * 2)
      const detail = fbm(nx * 14, ny * 14, seed + 5, 4)
      const mix = Math.min(1, Math.max(0, band * 0.7 + detail * 0.5 - 0.2))
      const shade = 0.8 + detail * 0.4
      const i = (y * w + x) * 4
      image.data[i] = (base[0] + (bands[0] - base[0]) * mix) * shade
      image.data[i + 1] = (base[1] + (bands[1] - base[1]) * mix) * shade
      image.data[i + 2] = (base[2] + (bands[2] - base[2]) * mix) * shade
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.anisotropy = 4
  return texture
}

/** A translucent Saturn-style ring. */
export function planetRing(planetRadius, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 4
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 256, 0)
  const css = hexToCss(color)
  gradient.addColorStop(0, 'rgba(255,255,255,0)')
  gradient.addColorStop(0.15, css)
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.25)')
  gradient.addColorStop(0.55, css)
  gradient.addColorStop(0.8, 'rgba(255,255,255,0.15)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 4)
  for (let x = 0; x < 256; x += 3) {
    ctx.fillStyle = `rgba(0,0,0,${0.15 + 0.35 * fbm(x * 0.08, 0, 7)})`
    ctx.fillRect(x, 0, 2, 4)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  const inner = planetRadius * 1.45
  const outer = planetRadius * 2.5
  const geometry = new THREE.RingGeometry(inner, outer, 128, 1)
  const uv = geometry.attributes.uv
  const pos = geometry.attributes.position
  for (let i = 0; i < uv.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i))
    uv.setXY(i, (r - inner) / (outer - inner), 0.5)
  }
  geometry.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    map: texture, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false,
  }))
  mesh.rotation.x = 0.22
  mesh.rotation.z = 0.1
  return mesh
}

export const cssToRgb = (css) => {
  const v = css.replace('#', '')
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}

export const hexToCss = (hex) => '#' + hex.toString(16).padStart(6, '0')
