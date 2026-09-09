import * as THREE from 'three'

const passVertex = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Screen-space gravitational lensing. Pixels near the singularity's projected position sample
 * the frame through the thin-lens equation (r' = r - θe²/r), which bends the far side of the
 * accretion disk into the arc above and below the shadow, then paints the shadow and photon ring.
 * `uShadow` is the shadow radius in units of screen height; `uCenter` is its UV position.
 */
export const LensShader = {
  uniforms: {
    tDiffuse: { value: null },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uShadow: { value: 0.0 },
    uAspect: { value: 1.0 },
    uStrength: { value: 0.0 },
    uGlow: { value: 1.0 },
  },
  vertexShader: passVertex,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 uCenter;
    uniform float uShadow;
    uniform float uAspect;
    uniform float uStrength;
    uniform float uGlow;
    varying vec2 vUv;

    void main() {
      vec2 d = vUv - uCenter;
      d.x *= uAspect;
      float r = length(d);
      vec2 dir = r > 1e-6 ? d / r : vec2(0.0, 1.0);

      float ring = uShadow * 1.5;
      float k = ring * ring * uStrength;
      float rSample = r - k / max(r, 1e-4);
      vec2 sd = dir * abs(rSample);
      sd.x /= uAspect;
      vec2 uv = clamp(uCenter + sd, vec2(0.0), vec2(1.0));
      vec3 col = texture2D(tDiffuse, uv).rgb;

      float edge = (r - uShadow) / max(uShadow, 1e-4);
      float visible = smoothstep(0.003, 0.02, uShadow) * uStrength * uGlow;
      float outside = step(0.0, edge);
      float photon = exp(-max(edge, 0.0) * 34.0) * outside;
      float halo = exp(-max(edge, 0.0) * 3.5) * outside;
      vec3 warm = vec3(1.0, 0.74, 0.45);
      col += warm * (photon * 1.4 + halo * 0.1) * visible;

      float s0 = max(uShadow * 0.985, 1e-5);
      float s1 = max(uShadow * 1.012, s0 + 1e-5);
      float shadow = 1.0 - smoothstep(s0, s1, r);
      col = mix(col, vec3(0.0), shadow * uStrength);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
}

/**
 * Final grade: radial blur and chromatic aberration when boosting, vignette, film grain,
 * red damage pulse, orange heat tint inside the disk, and white/black fades for the finale.
 */
export const CinematicShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uRadial: { value: 0 },
    uAberration: { value: 0 },
    uVignette: { value: 0.55 },
    uGrain: { value: 0.035 },
    uFlash: { value: 0 },
    uFade: { value: 0 },
    uDamage: { value: 0 },
    uHeat: { value: 0 },
  },
  vertexShader: passVertex,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uRadial;
    uniform float uAberration;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uFlash;
    uniform float uFade;
    uniform float uDamage;
    uniform float uHeat;
    varying vec2 vUv;

    vec3 sampleAberrated(vec2 uv, vec2 c) {
      vec2 off = c * uAberration;
      float r = texture2D(tDiffuse, uv + off).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - off).b;
      return vec3(r, g, b);
    }

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 c = vUv - 0.5;
      float rr = length(c);
      vec3 col;
      if (uRadial > 0.0005) {
        col = vec3(0.0);
        for (int i = 0; i < 8; i++) {
          float t = float(i) / 7.0;
          vec2 uv = vUv - c * uRadial * t * rr * 2.0;
          col += sampleAberrated(uv, c);
        }
        col /= 8.0;
      } else {
        col = sampleAberrated(vUv, c);
      }

      col = mix(col, col * vec3(1.3, 0.65, 0.3) + vec3(0.22, 0.07, 0.0), uHeat);

      float vig = 1.0 - smoothstep(0.32, 0.98, rr) * uVignette;
      col *= vig;
      col += vec3(0.7, 0.03, 0.0) * smoothstep(0.25, 0.85, rr) * uDamage;

      float g = (hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 100.0) - 0.5) * uGrain;
      col += g;

      col = mix(col, vec3(1.0), uFlash);
      col *= (1.0 - uFade);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
}
