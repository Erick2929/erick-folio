# CLAUDE.md — Erick Siller Portfolio

## Project Overview
Three.js cyberpunk city flythrough — interactive 3D portfolio where you pilot a ship over a neon city. Built with Vite + Three.js.

## Stack
- **Three.js** `^0.171.0` — 3D scene, post-processing
- **GSAP** `^3.12.5` — UI animations (intro sequence)
- **Vite** `^5.4.0` — bundler/dev server

## Dev Commands
```bash
npm run dev      # start dev server (localhost:5173)
npm run build    # production build → dist/
npm run preview  # preview production build
```

## Architecture
```
sources/
  index.html
  style.css
  javascript/
    Experience.js      # Singleton — wires everything together
    Renderer.js        # WebGLRenderer + EffectComposer (bloom, gamma)
    Camera.js          # PerspectiveCamera, follows ship
    Sizes.js           # Viewport size + resize events
    Ticker.js          # requestAnimationFrame loop, emits 'tick'
    Events.js          # Keyboard/mouse event bus
    World/
      World.js         # Instantiates city, rain, ship
      City.js          # Buildings, windows (InstancedMesh), neons, lights
      Rain.js          # Particle rain system (Points)
      Ship.js          # Player ship mesh + WASD/arrow controls
    UI/
      Intro.js         # GSAP intro animation
    utils/
      maths.js         # lerp, clamp, randFloat, randInt
static/                # Public assets (textures, fonts — currently empty)
```

## Key Architecture Decisions

### Performance (post-optimization)
- **Windows**: `THREE.InstancedMesh` — 2 draw calls total (warm + cold pool) instead of 500-2000 individual meshes
- **Lights**: Max 8 lights total — 1 AmbientLight, 1 DirectionalLight, 6 PointLights. No shadows.
- **Buildings**: `MeshLambertMaterial` (no PBR). Max 80 buildings, city radius 180u.
- **Bloom**: `UnrealBloomPass` threshold=0.5 (was 0.1) — only true emissives glow. No bloom on dark geometry.
- **Rain**: 3,000 particles (was 8,000). CPU update loop in `Rain._update()`.
- **Shadows**: Disabled globally (`renderer.shadowMap.enabled = false`).

### Experience Singleton
`Experience.getInstance()` — all classes access shared state through this. No prop drilling.

### Tick priority system
`ticker.events.on('tick', cb, priority)` — lower number = earlier execution. Ship updates at priority 2, Rain at 5, Renderer at 998 (last).

## Performance Budget
Target: 60 FPS on integrated GPU (MacBook). Frame budget: <16ms.

## Controls
| Key | Action |
|-----|--------|
| W / ↑ | Thrust forward |
| S / ↓ | Brake / reverse |
| A / ← | Turn left |
| D / → | Turn right |
| Q / Space | Ascend |
| E / Shift | Descend |
| Shift | Boost (2x speed) |

## Deployment
- Target: static hosting (Netlify / Vercel / GitHub Pages)
- Build output: `dist/` — fully static, no server needed
- Run `npm run build` then deploy `dist/`

## Backlog

### P0 — Critical
- [x] Portfolio content — About, Projects, Contact panels via HUD nav buttons (`index.html`)
- [x] Interactive HUD — Nav panels + portfolio content accessible from bottom HUD (`index.html`, `style.css`, `UI/HUD.js`)
- [x] SEO + Open Graph — Title, description, og:image, og:title (`index.html`)

### P1 — High Impact
- [x] Intro personalizada — Real stack in boot sequence (`UI/Intro.js`)
- [x] Neon signs with text — Canvas texture signs with real text (`City.js`)
- [x] Audio ambience — Synth ambient loop + engine hum + rain (`World/Audio.js`)
- [x] HUD telemetry — Real-time speed, altitude, velocity from Ship (`UI/HUD.js`)

### P2 — Visual Polish
- [ ] Engine trail particles — Particle trail behind ship engines (`World/Ship.js`)
- [x] Blinking windows — Random window flicker adds city life (`City.js`)
- [x] Skybox / stars — Starfield Points with fog:false (`City.js`)
- [ ] Rooftop variety — Helipads, blinking antenna lights (`City.js`)

### P3 — Nice-to-have
- [x] Fullscreen button — In top-right HUD corner (`index.html`, `UI/HUD.js`)
- [ ] Mobile / touch controls — Touch joystick for mobile (`UI/TouchControls.js`)
- [ ] Screenshot / share — canvas.toDataURL capture (`UI/`)
- [ ] LOD buildings — Simplified far geometry for low-end GPUs (`City.js`)
- [ ] Gamepad support — Gamepad API controller support (`Ship.js`)
