# CLAUDE.md — Erick Siller · Event Horizon

## Project Overview
A playable portfolio. The visitor pilots a ship around a black hole; every chapter of Erick's
career is a world in orbit. Scan the worlds, dock at the education station, collect skill
fragments, then cross the event horizon for the finale (stats + contact). The CV is also readable
without playing through the HUD panels. Side content: a time trial through 15 gates, a hidden
slingshot course around the singularity, fuel cells that grant boost overdrive, achievements and a
photo mode. Built with Vite + three.js, no framework.

## Stack
- **three.js** `^0.171` — scene, custom shaders, EffectComposer post-processing
- **Vite** `^5.4` — dev server / bundler
- **Node test runner** — behavioural tests for the pure game logic (`npm test`)
- GSAP is still a dependency but no longer imported.

## Commands
```bash
npm run dev      # dev server (Vite picks 5173 or the next free port; opens the browser)
npm run build    # production build → dist/
npm run preview  # serve dist/
npm test         # node --test tests/*.test.js
```

## Architecture
```
sources/
  index.html, style.css          # title screen, HUD, CV panels, dialog, pause, finale, touch UI
  javascript/
    main.js                      # the only module-level side effect: new Experience()
    Experience.js                # composition root / singleton (window.experience in the browser)
    Input.js                     # keyboard + pointer-drag + touch → yaw / pitch / thrust / boost / pulse
    Camera.js                    # cinematic orbit (title) and lagging chase camera (FOV kick, shake)
    Renderer.js                  # composer: world → LensPass → ship composite → bloom → cinematic → output
    Render/                      # LensShader (gravitational lensing + shadow), CinematicShader, LayerRenderPass
    data/profile.js              # ALL content: profile, experience, education, projects, skills, world LAYOUT, OBJECTIVES
    Game/
      physics.js                 # pure helpers: gravity, time dilation, scanner progress, disk heat
      GameState.js               # pure rules: objectives, fragments, clocks, score, persistence (localStorage)
      Boost.js                   # pure boost reserve: drain, release-to-recharge, lock at empty, overdrive
      Race.js                    # pure time-trial rules: countdown, ordered gates, clock, per-course leaderboard
      Range.js                   # pure target-range rules: timer, combo scoring, accuracy, score board
      Achievements.js            # pure persisted unlockables (12 definitions)
      Scanner.js                 # proximity scan / docking / race-beacon progress (8 s cooldown per target)
      Game.js                    # glue: world + ship + rules + audio + effects; emits UI events
    World/
      World.js                   # assembles everything, spawn/rim points, fragment placement
      BlackHole.js               # accretion disk shader, disk light, gravity + heat queries
      Planets.js                 # career planets (procedural textures, Fresnel atmosphere), moon, satellite
      Station.js                 # TEC STATION (education)
      Asteroids.js               # instanced debris belt with analytic collision
      Fragments.js               # instanced skill crystals + hidden ones
      RaceCourse.js              # race beacons (scannables of kind 'race') and gate rings per course
      Beacon.js                  # shared pylon builder for race/range beacons
      Targets.js, Blaster.js     # range targets with hit testing; the ship's bolt pool
      FuelCells.js               # magnetised boost pickups that respawn after 45 s
      Ship.js                    # quaternion flight model, BoostReserve, hull, collisions (0.6 s debris grace), horizon crossing
      EngineTrail.js, Burst.js, Starfield.js, Nebula.js, SpaceDust.js
    Audio/AudioEngine.js         # ambient track + procedural Web Audio SFX (engine, boost, alarms, pickups)
    UI/
      Intro.js (title), HUD.js (telemetry, race clock, countdown), Radar.js, Panels.js (CV), Dialog.js (log entry),
      RaceResults.js (leaderboard card), Finale.js, PauseMenu.js (courses + achievements), TouchControls.js
static/audio/ambient.mp3
tests/                           # physics + GameState behaviour tests (node --test)
```

## Key Decisions
- **Content lives in one place.** Edit `data/profile.js` to update the CV; the panels, scan
  dialogs, fragments and objectives are all generated from it.
- **Two render layers.** Layer 0 = world (gets lensed and can fall into the shadow). Layer 1 =
  ship + trail, composited after the lens pass so the ship is never bent or hidden. Lights must
  `layers.enableAll()` to light both passes. `LayerRenderPass` suppresses `scene.background` on
  the composite pass because three.js force-clears whenever a background colour is set.
- **The shadow is painted in screen space.** No black sphere is rendered; `LensShader` bends the
  frame with the thin-lens equation and paints the shadow + photon ring. `uShadow` is the shadow
  radius in units of screen height.
- **Pure game logic.** `Game/physics.js` and `Game/GameState.js` never import three or touch the
  DOM so they run under `node --test`. Keep rules there; keep rendering out of them.
- **Overlays pause the run.** Panels, the log dialog and the pause menu call `game.setOverlay()`;
  the world keeps animating but clocks, input and hazards freeze.
- **`main.js` is the entry.** Never put `new Experience()` back in `Experience.js`: with the
  import cycle (every module imports Experience) Vite's HMR evaluates the module twice.

## Controls
| Key | Action |
|-----|--------|
| W / S | Thrust / brake |
| A / D (or ← →) | Yaw |
| ↑ / ↓ (or Q / E) | Pitch |
| Shift / Space | Boost. 6 s reserve, recharges only while released, locks at empty until 25% |
| F / left click | Fire the blaster (touch: hold FIRE; a quick tap pulses instead) |
| R | Scanner pulse (lights up nearby fragments) |
| H | Photo mode (hides the HUD) |
| Esc / P | Pause menu: restart, start time trial or target range, abort, sound, achievements · M mute · G fullscreen · Enter launch/continue |
| Mouse drag | Steer (trackpad friendly) |
| Touch | Drag left half to steer · THRUST / BOOST / BRAKE hold · PULSE tap · CRUISE toggle |

## Side Content and How to Reach It
- **Time trial**: the amber checkered beacon ahead of the spawn (`LAYOUT.race.courses.trial`). Hold
  position next to it to accept; 15 gates around the whole system; results card with a local top-5
  leaderboard (`localStorage` key `event-horizon:races`). Also startable from the pause menu.
- **Slingshot** (hidden): a second beacon at `polar(140°, 96)` on the far side of the singularity.
  Six gates hugging the photon sphere above and below the disk. Own leaderboard.
- **Target range**: the red beacon at `LAYOUT.range.beacon` (also from the pause menu). A 60 s
  session: debris (100), drones (250, two hits) and cores (500) spawn ahead of the ship; a combo
  up to ×4 grows with each kill and fades after 2 s. Rules in `Game/Range.js` (tested), targets
  in `World/Targets.js`, bolts in `World/Blaster.js`. Score board under `event-horizon:range`.
  The blaster works anywhere: belt rocks shatter and come back after 25 s.
- **Fuel cells**: 14 cyan capsules (`LAYOUT.fuelCells`). Contact refills boost and grants 15 s of
  overdrive; they respawn after 45 s.
- **Achievements**: `Game/Achievements.js` (15), listed in the pause menu, toasted on unlock, persisted
  under `event-horizon:achievements`. Triggers live in `Game.js`.
- **Hidden fragments**: four, positions in `HIDDEN_FRAGMENTS` / `World._hiddenFragments`.
- **Photo mode**: H toggles `body.photo`, which hides the HUD and touch UI.

## Mobile / Touch
- Touch mode is decided by `utils/device.js` (`pointer: coarse` or multi-touch); `?touch=1` / `?touch=0`
  force it for testing on a desktop browser. It adds `body.touch`, which switches the title hints,
  pause hints and the whole HUD layout (`body.touch …` rules in `style.css`, safe-area aware).
- `UI/TouchControls.js`: floating stick on the left 55% of the screen (`#touch-steer`), hold
  buttons THRUST / BOOST / BRAKE, tap PULSE, and a CRUISE toggle (auto-thrust). Thrust resolution
  is the pure `touchThrust()` in `Input.js` (tested).
- The six CV buttons collapse into a `CV ▾` menu on touch; the mission list, clocks and role line
  hide on phones (`max-height: 520px` or `max-width: 600px`); a rotate hint shows in portrait.
- Touch devices render at pixel ratio 1 (`Sizes.js`) because bloom and the lens pass dominate.
- iPhone Safari has no fullscreen API, so the ⛶ button hides itself when unsupported.

## Tuning Knobs
- Flight feel: constants at the top of `World/Ship.js` (speeds, yaw/pitch rates); boost seconds,
  recharge and relock threshold in the `BoostReserve` constructed there.
- Audio levels: `AudioEngine.setFlight` (engine hum sits at ~10% of its original level).
- Gravity: `BlackHole.gravity` (`mu`, `cap`) and `LAYOUT.blackHole.rs`.
- Look: bloom in `Renderer._setupPostProcessing`, disk intensity in `BlackHole._createDisk`,
  photon ring in `Render/shaders.js`, exposure in `Renderer._setup`.
- Time dilation: `Game/physics.js` (`DILATION_CAP`).
- World placement: `LAYOUT` in `data/profile.js` (polar coordinates around the singularity).

## Deployment
Static hosting. `npm run build` then deploy `dist/`. `og-image.png` is referenced but not yet created.

## Backlog
- [ ] Add `static/og-image.png` for link previews
- [ ] Ghost replay of the best time-trial lap
- [ ] Mobile: joystick tuning and a landscape prompt
- [ ] Optional: settings for invert-pitch and reduced motion
- [ ] Optional: a replay/ghost of the best run
