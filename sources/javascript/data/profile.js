// Everything the site knows about Erick, sourced from his LinkedIn profile and résumé.
// The world layout at the bottom maps this data onto the game: each career chapter is a
// world orbiting the singularity, each skill is a fragment the player can collect.

export const PROFILE = {
  name: 'ERICK SILLER',
  fullName: 'Erick Francisco Siller Ojeda',
  headline: 'AI Engineering MTS @ Salesforce · M.S. in Artificial Intelligence student @ Tec de Monterrey',
  role: 'SOFTWARE ENGINEER · AI SYSTEMS · BUILDER',
  location: 'Monterrey, Nuevo León, México',
  workMode: 'Remote',
  connections: '500+',
  about: [
    "I'm a software engineer focused on building scalable applications and finding the right solutions to complex problems.",
    "I have an entrepreneurial background and enjoy driving projects from concept to delivery, especially when they have a positive community impact.",
    "I love digging into all sorts of tech across systems and overall software engineering. Outside of work, I spend my time on DIY projects and 3D printing.",
  ],
  topSkills: ['React.js', 'JavaScript', 'TypeScript', 'Express.js', 'SQL'],
  proficient: ['JavaScript', 'TypeScript', 'Python', 'Node.js', 'Go', 'React', 'Next.js'],
  links: {
    linkedin: 'https://www.linkedin.com/in/ericksiller/',
    github: 'https://github.com/Erick2929',
    site: 'https://www.ericksiller.com/',
    email: 'ericksillero@gmail.com',
  },
}

export const EXPERIENCE = [
  {
    id: 'salesforce',
    company: 'Salesforce',
    role: 'Member of Technical Staff · AI Engineering',
    period: 'Nov 2025 — Present',
    location: 'Mexico City · Remote',
    summary: 'Joined Salesforce through the acquisition of Regrello. AI engineering work in Go with ownership of software architecture decisions.',
    highlights: [
      'Member of Technical Staff on an AI engineering team after Regrello was acquired by Salesforce.',
      'Backend work in Go with a focus on software architecture.',
    ],
    skills: ['Go', 'Software Architecture', 'AI Engineering', 'Scalable Systems'],
  },
  {
    id: 'regrello',
    company: 'Regrello',
    role: 'Software Engineer · AI Quality Assurance',
    period: 'Dec 2024 — Oct 2025',
    location: 'Monterrey · Hybrid',
    summary: 'Software engineering focused on AI evaluation and testing.',
    highlights: [
      'Architected an AI-powered test automation framework in TypeScript and Go: 40% faster test execution, 60% more coverage.',
      'Built and maintained 20+ end-to-end suites across API, UI and integration testing, cutting production bugs by 35%.',
      'Brought continuous testing into the CI/CD pipeline, reducing time-to-detect issues by 45%.',
      'Pioneered AI-driven test generation that surfaced 25% more edge cases than hand-written scenarios.',
    ],
    skills: ['AI Evaluation', 'Test Automation', 'Go', 'CI/CD'],
  },
  {
    id: 'softtek',
    company: 'Softtek',
    role: 'Software Engineer',
    period: 'Jul 2024 — Nov 2024',
    location: 'Monterrey · Remote',
    summary: 'Came back as a full-time Software Engineer, specializing in frontend.',
    highlights: [
      'Key frontend developer on 4+ projects, building responsive interfaces with React and TypeScript.',
      'Expanded into backend with 10+ Google Cloud Functions in Python and FastAPI.',
      'Introduced shadcn/ui, cutting component development time by 30%.',
      'Brought Kanban boards and daily stand-ups to the innovation team, improving delivery times by 40%.',
    ],
    skills: ['React', 'TypeScript', 'Next.js', 'Python', 'FastAPI', 'Google Cloud'],
  },
  {
    id: 'softtek-intern',
    company: 'Softtek',
    role: 'Software Engineer Intern',
    period: 'Jun 2023 — Feb 2024',
    location: 'Monterrey · Remote',
    summary: 'Software developer intern, specializing in frontend with React and TypeScript.',
    highlights: [
      'Lead frontend developer on an internal tool that used LLMs and generative AI to accelerate programming, cutting coding time by 50%.',
      'Designed and shipped 20+ global UX/UI components a month, saving the team about 10 hours of coding per week.',
      'Drove team dynamics through brainstorming, knowledge sharing and a culture of continuous learning.',
    ],
    skills: ['Team Leadership', 'LLM Integration', 'UI Engineering'],
  },
  {
    id: 'independent',
    company: 'Independent',
    role: 'Software Engineer · Freelance',
    period: 'Aug 2020 — Jun 2023',
    location: 'Monterrey · Remote',
    summary: 'Started my software engineering career as an independent contractor, building end-to-end software solutions.',
    highlights: [
      'Wore multiple hats as backend developer, frontend developer and product owner.',
      'Delivered complete products from concept to delivery for clients over almost three years.',
    ],
    skills: ['JavaScript', 'SQL', 'Express.js', 'Node.js', 'Backend', 'Frontend', 'Product Ownership'],
  },
]

export const EDUCATION = [
  {
    id: 'tec-msc',
    school: 'Tecnológico de Monterrey',
    degree: 'M.S. in Artificial Intelligence',
    period: 'In progress',
    detail: 'Graduate studies in artificial intelligence alongside full-time engineering work.',
    skills: ['Artificial Intelligence', 'Computer Science'],
  },
  {
    id: 'tec-bsc',
    school: 'Tecnológico de Monterrey · Campus Monterrey',
    degree: 'B.S. in Computer Science and Technology',
    period: 'Graduated June 2024',
    detail: 'GPA 4.0 / 4.0',
    skills: [],
  },
]

export const PROJECTS = [
  {
    id: 'matchpoint',
    name: 'MatchpointMX',
    role: 'Product Owner & Lead Developer',
    period: 'Jun 2024 — Aug 2024',
    summary: 'Paddle tennis tournament management platform serving 200+ active users.',
    highlights: [
      'Led a team of 3 developers from idea to a live platform.',
      'Tournament publishing feature grew hosted events by 75% in the first 3 months.',
      'Frontend in Next.js and Mantine with 20+ reusable components; backend on Firebase.',
    ],
    link: 'https://matchpointmx.com',
    skills: ['Firebase', 'Mantine'],
  },
  {
    id: 'event-horizon',
    name: 'Event Horizon',
    role: 'This site',
    period: '2026',
    summary: 'The playable portfolio you are flying through: a three.js black hole with screen-space gravitational lensing, custom flight physics and procedural audio.',
    highlights: [],
    link: PROFILE.links.github + '/erick-folio',
    skills: ['Three.js / WebGL'],
  },
]

/** Fragments that are not tied to a world. Rewards for exploring. */
export const HIDDEN_FRAGMENTS = [
  { id: 'hidden-3dprint', skill: '3D Printing', hint: 'Somewhere in the debris around Origin.', position: [0, 0, 0] },
  { id: 'hidden-diy', skill: 'DIY Builder', hint: 'Behind the station, where nobody looks.', position: [0, 0, 0] },
  { id: 'hidden-webgl', skill: 'Three.js / WebGL', hint: 'Straight up from the singularity.', position: [0, 130, 0] },
  { id: 'hidden-entrepreneur', skill: 'Entrepreneurship', hint: 'Skimming the photon sphere.', position: [30, 16, 0] },
]

const polar = (angleDeg, radius, y) => {
  const a = (angleDeg * Math.PI) / 180
  return [Math.cos(a) * radius, y, Math.sin(a) * radius]
}

// Frame around ORIGIN (the spawn world): `outward` points away from the singularity,
// `side` is the horizontal direction to its right. Used to place the start of the time trial.
const ORIGIN_POS = polar(320, 315, -4)
const originLen = Math.hypot(ORIGIN_POS[0], ORIGIN_POS[2])
const OUTWARD = [ORIGIN_POS[0] / originLen, 0, ORIGIN_POS[2] / originLen]
const SIDE = [OUTWARD[2], 0, -OUTWARD[0]]
const nearOrigin = (out, side, up) => [
  ORIGIN_POS[0] + OUTWARD[0] * out + SIDE[0] * side,
  ORIGIN_POS[1] + up,
  ORIGIN_POS[2] + OUTWARD[2] * out + SIDE[2] * side,
]
const TRIAL_BEACON = nearOrigin(34, -40, 14)
const SLINGSHOT_BEACON = polar(140, 96, 24)

/**
 * Spatial layout of the run. Positions are world units; the singularity sits at the origin.
 * Older chapters orbit farther out, the present sits deep in the gravity well.
 */
export const LAYOUT = {
  blackHole: { rs: 16, diskInner: 26, diskOuter: 74, tilt: [0.3, 0, 0.12] },
  worlds: [
    {
      id: 'salesforce', kind: 'planet', name: 'SALESFORCE', objectiveId: 'scan-salesforce',
      position: polar(20, 118, 6), radius: 13, scanRange: 26,
      palette: { base: '#0b3b6e', bands: '#1f7fc4', atmosphere: 0x3fa9ff, emissive: 0x081a33 },
      data: EXPERIENCE[0], required: true, label: 'Scan SALESFORCE',
    },
    {
      id: 'regrello', kind: 'planet', name: 'REGRELLO', objectiveId: 'scan-regrello',
      position: polar(130, 178, -8), radius: 11, scanRange: 24,
      palette: { base: '#3a0f4a', bands: '#8a3fb0', atmosphere: 0xc76bff, emissive: 0x1a0626 },
      data: EXPERIENCE[1], required: true, label: 'Scan REGRELLO',
    },
    {
      id: 'softtek', kind: 'planet', name: 'SOFTTEK', objectiveId: 'scan-softtek',
      position: polar(235, 240, 4), radius: 15, scanRange: 28, ring: true,
      palette: { base: '#0d3f3a', bands: '#1fa393', atmosphere: 0x3ff0d6, emissive: 0x06201c },
      data: EXPERIENCE[2], required: true, label: 'Scan SOFTTEK',
      moon: {
        id: 'softtek-intern', kind: 'moon', name: 'SOFTTEK · INTERN', objectiveId: 'scan-softtek-intern',
        orbitRadius: 30, radius: 4.5, scanRange: 14, speed: 0.12,
        palette: { base: '#2b3a3a', bands: '#4f6b6b', atmosphere: 0x9fe8dc, emissive: 0x0a1414 },
        data: EXPERIENCE[3], required: true, label: 'Scan SOFTTEK moon',
      },
      satellite: {
        id: 'matchpoint', kind: 'satellite', name: 'MATCHPOINT SAT', objectiveId: 'scan-matchpoint',
        orbitRadius: 44, radius: 2.2, scanRange: 12, speed: -0.18,
        data: PROJECTS[0], required: false, label: 'Scan MATCHPOINT satellite',
      },
    },
    {
      id: 'independent', kind: 'planet', name: 'ORIGIN', objectiveId: 'scan-origin',
      position: polar(320, 315, -4), radius: 12, scanRange: 32, belt: { inner: 24, outer: 46, count: 150 },
      palette: { base: '#4a2a0f', bands: '#b0672a', atmosphere: 0xffa25c, emissive: 0x2a1204 },
      data: EXPERIENCE[4], required: true, label: 'Scan ORIGIN',
    },
  ],
  station: {
    id: 'tec', kind: 'station', name: 'TEC STATION', objectiveId: 'dock-tec',
    position: polar(80, 210, 78), radius: 14, scanRange: 30,
    data: EDUCATION, required: true, label: 'Dock at TEC STATION',
  },
  spawn: { worldId: 'independent', offset: 48 },
  bounds: 560,
  /**
   * Time-trial courses. Gate positions are world units; `local: true` gates are expressed in the
   * accretion disk's tilted frame (y = disk normal) so they sit safely above or below the plasma.
   */
  race: {
    courses: {
      trial: {
        name: 'TIME TRIAL',
        beacon: TRIAL_BEACON,
        beaconLabel: 'TIME TRIAL',
        hidden: false,
        gates: [
          { position: nearOrigin(20, -70, 16), radius: 9 },
          { position: polar(300, 290, 26), radius: 9 },
          { position: polar(270, 262, 40), radius: 9 },
          { position: polar(250, 265, 14), radius: 9 },
          { position: polar(212, 222, 36), radius: 9 },
          { position: polar(170, 205, 58), radius: 9 },
          { position: polar(110, 200, 70), radius: 9 },
          { position: polar(95, 215, 130), radius: 9 },
          { position: polar(80, 210, 93), radius: 6, axis: 'y' },
          { position: polar(70, 200, 40), radius: 9 },
          { position: polar(40, 128, 26), radius: 9 },
          { position: polar(0, 62, 16), radius: 9, local: true },
          { position: polar(300, 66, -18), radius: 9, local: true },
          { position: polar(325, 200, 0), radius: 9 },
          { position: TRIAL_BEACON, radius: 11 },
        ],
      },
      slingshot: {
        name: 'SLINGSHOT',
        beacon: SLINGSHOT_BEACON,
        beaconLabel: 'SLINGSHOT',
        hidden: true,
        gates: [
          { position: polar(160, 60, 14), radius: 8, local: true },
          { position: polar(230, 32, 10), radius: 8, local: true },
          { position: polar(320, 30, -10), radius: 8, local: true },
          { position: polar(50, 34, 12), radius: 8, local: true },
          { position: polar(120, 62, 20), radius: 8, local: true },
          { position: SLINGSHOT_BEACON, radius: 10 },
        ],
      },
    },
  },
  /** The target range: a timed shooting session started at its own beacon. */
  range: { beacon: polar(258, 285, 26), duration: 60 },
  /** Fuel cells: refill the boost reserve and grant overdrive. Spread along the likely routes. */
  fuelCells: [
    polar(335, 300, 10), polar(285, 275, 30), polar(258, 250, 20), polar(195, 215, 50),
    polar(150, 210, 20), polar(120, 205, 60), polar(85, 215, 110), polar(60, 170, 30),
    polar(30, 150, 20), polar(350, 100, 24), polar(300, 140, -20), polar(240, 150, -10),
    polar(180, 130, 10), polar(100, 130, 40),
  ],
}

/** Objectives in the order the mission log lists them. */
export const OBJECTIVES = [
  { id: 'scan-origin', label: 'Scan ORIGIN', required: true },
  { id: 'scan-softtek', label: 'Scan SOFTTEK', required: true },
  { id: 'scan-softtek-intern', label: 'Scan the SOFTTEK moon', required: true },
  { id: 'scan-regrello', label: 'Scan REGRELLO', required: true },
  { id: 'scan-salesforce', label: 'Scan SALESFORCE', required: true },
  { id: 'dock-tec', label: 'Dock at TEC STATION', required: true },
  { id: 'scan-matchpoint', label: 'Scan the MATCHPOINT satellite', required: false },
  { id: 'race', label: 'Finish the time trial', required: false },
  { id: 'range', label: 'Post a target range score', required: false },
  { id: 'fragments', label: 'Recover every skill fragment', required: false },
]

/** Skill matrix for the SKILLS panel. Every fragment in the game belongs to one of these groups. */
export const SKILL_GROUPS = [
  { label: 'LANGUAGES', skills: ['JavaScript', 'TypeScript', 'Python', 'Go', 'SQL'] },
  { label: 'FRONTEND', skills: ['React', 'Next.js', 'UI Engineering', 'Frontend', 'Mantine', 'Three.js / WebGL'] },
  { label: 'BACKEND', skills: ['Node.js', 'Express.js', 'FastAPI', 'Backend', 'Firebase', 'Google Cloud'] },
  { label: 'AI', skills: ['AI Engineering', 'AI Evaluation', 'LLM Integration', 'Artificial Intelligence'] },
  { label: 'ENGINEERING', skills: ['Software Architecture', 'Scalable Systems', 'Test Automation', 'CI/CD', 'Computer Science'] },
  { label: 'LEADERSHIP', skills: ['Team Leadership', 'Product Ownership', 'Entrepreneurship'] },
  { label: 'OFF THE CLOCK', skills: ['3D Printing', 'DIY Builder'] },
]
