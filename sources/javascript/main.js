import Experience from './Experience.js'

// The only module-level side effect in the app lives here, so every other module stays
// importable in any order (and Vite's HMR cannot evaluate the app twice).
new Experience()
