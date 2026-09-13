// Everything the site knows about Erick, sourced from his LinkedIn profile and résumé.
// The world layout at the bottom maps this data onto the game: each career chapter is a
// world orbiting the singularity, each skill is a fragment the player can collect.

export const PROFILE = {
  name: 'ERICK SILLER',
  fullName: 'Erick Francisco Siller Ojeda',
  headline: 'AI Engineering MTS @ Salesforce · M.S. in Artificial Intelligence student @ Tec de Monterrey',
  role: 'SOFTWARE ENGINEER · AI SYSTEMS · BUILDER',
  pitch: 'Software engineer who ships end to end: frontend, backend and the AI in between. Shipping since 2020, AI engineering at Salesforce, AI evaluation at Regrello, a 4.0 GPA in computer science, and a master\'s in AI in progress.',
  location: 'Monterrey, Nuevo León, México',
  workMode: 'Remote',
  connections: '500+',
  about: [
    "I'm a software engineer focused on building scalable applications and finding the right solutions to complex problems.",
    "I have an entrepreneurial background and enjoy driving projects from concept to delivery, especially when they have a positive community impact.",
    "I love digging into all sorts of tech across systems and overall software engineering. Outside of work, I spend my time on DIY projects and 3D printing.",
  ],
  topSkills: ['React.js', 'JavaScript', 'TypeScript', 'Express.js', 'SQL'],
  honors: [
    {
      title: 'HackMTY 2022 · 1st place',
      detail: 'My first hackathon, and the largest student hackathon in Latin America. Won it with DropNot, a water-flow monitor built in 24 hours during the Nuevo León water shortage, as Team CodeBeasts.',
      link: 'https://conecta.tec.mx/es/noticias/monterrey/educacion/ganan-hackathon-con-solucion-al-desabasto-de-agua',
    },
  ],
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
    summary: "Member of Technical Staff on Salesforce's AI engineering team, joined through the acquisition of Regrello. Backend engineering in Go with ownership of software architecture decisions.",
    highlights: [
      'Joined Salesforce with the Regrello team when it was acquired, continuing on AI engineering.',
      'Backend work in Go with ownership of software architecture decisions.',
    ],
    skills: ['Go', 'Software Architecture', 'AI Engineering', 'Scalable Systems'],
  },
  {
    id: 'regrello',
    company: 'Regrello',
    role: 'Software Engineer · AI Quality Assurance',
    period: 'Dec 2024 — Oct 2025',
    location: 'Monterrey · Hybrid',
    summary: 'Software engineering focused on AI evaluation and testing: building the framework that proved the AI features worked before they shipped.',
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
    company: 'Freelance Developer',
    role: 'Side projects · Software design & product',
    period: 'Aug 2020 — Jun 2023',
    location: 'Monterrey · Remote',
    summary: 'Where it all started: freelance work and side projects while studying, getting my feet wet in software design and product by building complete solutions end to end for real clients.',
    highlights: [
      'Wore every hat on small builds: backend, frontend and product owner.',
      'Learned to scope, design and ship a product from concept to delivery, not just write the code.',
      'Almost three years of client and side-project work that led straight into the Softtek internship.',
    ],
    skills: ['JavaScript', 'SQL', 'Express.js', 'Node.js', 'Backend', 'Frontend', 'Product Ownership'],
  },
]

export const EDUCATION = [
  {
    id: 'tec-bsc',
    school: 'Tecnológico de Monterrey · Campus Monterrey',
    degree: 'B.S. in Computer Science and Technology',
    period: '2020 — Jun 2024',
    summary: 'Graduated in June 2024 with a 4.0 GPA, studying while already working as a developer.',
    highlights: [
      'GPA 4.0 / 4.0.',
      'Home of HackMTY, the hackathon I won in 2022. Look around the station.',
    ],
    skills: ['Computer Science'],
  },
  {
    id: 'tec-msc',
    school: 'Tecnológico de Monterrey',
    degree: 'M.S. in Artificial Intelligence',
    period: 'Late 2024 — May 2027 (expected)',
    summary: "Started the master's at the same time as the Regrello job: studying artificial intelligence by night while shipping AI systems by day.",
    highlights: [
      'In progress, aiming to graduate in May 2027.',
      'Runs in parallel with full-time engineering work.',
    ],
    skills: ['Artificial Intelligence'],
  },
]

export const PROJECTS = [
  {
    id: 'dropnot',
    name: 'DropNot · HackMTY 2022',
    role: '1st place · Team CodeBeasts',
    period: 'Sep 2022',
    summary: 'Won HackMTY 2022, the Tec de Monterrey hackathon run by its ACM student chapter with Major League Hacking, with DropNot: a device that logs household water flow so people can see, and cut, the water they waste. Built in 24 hours in the middle of the Nuevo León water shortage.',
    highlights: [
      'Fun fact: it was my first hackathon ever, and HackMTY is the largest student hackathon in Latin America.',
      'First place among 100+ teams and 400+ students from five regions, judged on challenges from Banorte, Blue Yonder and Chubb.',
      'Team CodeBeasts: Jorge González, Erick Siller, Ramiro Garza and Víctor Ramírez.',
      'The pitch: if people could see how much water they use, the shortage might never have happened, so the tool had to be simple, clear and affordable.',
    ],
    link: 'https://conecta.tec.mx/es/noticias/monterrey/educacion/ganan-hackathon-con-solucion-al-desabasto-de-agua',
    linkLabel: 'READ THE STORY →',
    skills: ['Hackathons', 'IoT'],
  },
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
      id: 'salesforce', kind: 'planet', name: 'SALESFORCE', objectiveId: 'scan-salesforce', order: 7,
      position: polar(20, 118, 6), radius: 13, scanRange: 26,
      palette: { base: '#0b3b6e', bands: '#1f7fc4', atmosphere: 0x3fa9ff, emissive: 0x081a33 },
      data: EXPERIENCE[0], required: true, label: 'Scan SALESFORCE',
    },
    {
      id: 'regrello', kind: 'planet', name: 'REGRELLO', objectiveId: 'scan-regrello', order: 5,
      position: polar(130, 178, -8), radius: 11, scanRange: 24,
      palette: { base: '#3a0f4a', bands: '#8a3fb0', atmosphere: 0xc76bff, emissive: 0x1a0626 },
      data: EXPERIENCE[1], required: true, label: 'Scan REGRELLO',
    },
    {
      id: 'softtek', kind: 'planet', name: 'SOFTTEK', objectiveId: 'scan-softtek', order: 4,
      position: polar(235, 240, 4), radius: 15, scanRange: 28, ring: true,
      palette: { base: '#0d3f3a', bands: '#1fa393', atmosphere: 0x3ff0d6, emissive: 0x06201c },
      data: EXPERIENCE[2], required: true, label: 'Scan SOFTTEK',
      moon: {
        id: 'softtek-intern', kind: 'moon', name: 'SOFTTEK · INTERN', objectiveId: 'scan-softtek-intern', order: 2,
        orbitRadius: 30, radius: 4.5, scanRange: 14, speed: 0.12,
        palette: { base: '#2b3a3a', bands: '#4f6b6b', atmosphere: 0x9fe8dc, emissive: 0x0a1414 },
        data: EXPERIENCE[3], required: true, label: 'Scan SOFTTEK moon',
      },
      satellites: [{
        id: 'matchpoint', kind: 'satellite', name: 'MATCHPOINT SAT', objectiveId: 'scan-matchpoint',
        orbitRadius: 44, radius: 2.2, scanRange: 12, speed: -0.18, label: 'MATCHPOINT', color: 0xffd27a,
        data: PROJECTS[1], required: false,
      }],
    },
    {
      id: 'independent', kind: 'planet', name: 'ORIGIN', objectiveId: 'scan-origin', order: 1,
      position: polar(320, 315, -4), radius: 12, scanRange: 32, belt: { inner: 24, outer: 46, count: 150 },
      palette: { base: '#4a2a0f', bands: '#b0672a', atmosphere: 0xffa25c, emissive: 0x2a1204 },
      data: EXPERIENCE[4], required: true, label: 'Scan ORIGIN',
    },
  ],
  station: {
    id: 'tec', kind: 'station', name: 'TEC STATION', objectiveId: 'dock-tec', order: 3,
    position: polar(80, 210, 78), radius: 14, scanRange: 30,
    data: EDUCATION[0], required: true, label: 'Dock at TEC STATION',
    moon: {
      id: 'tec-msc', kind: 'moon', name: "TEC · MASTER'S", objectiveId: 'scan-tec-msc', order: 6,
      orbitRadius: 32, radius: 4, scanRange: 14, speed: 0.1, angle: 2.4, tilt: 0.5,
      palette: { base: '#0f2a4a', bands: '#2f7fbf', atmosphere: 0x8fd3ff, emissive: 0x081a33 },
      data: EDUCATION[1], required: true, label: "Scan the TEC moon · master's",
    },
    satellites: [{
      id: 'hackmty', kind: 'trophy', name: 'HACKMTY TROPHY', objectiveId: 'scan-hackmty',
      orbitRadius: 46, radius: 2.4, scanRange: 12, speed: 0.16, angle: 0.4, tilt: -0.35, label: '?', revealLabel: 'HACKMTY 2022', color: 0xffd700,
      data: PROJECTS[0], required: false,
    }],
  },
  /**
   * Start on the rim in empty space. The nose points above and to the right of the singularity so
   * the black hole sits clear of the ship in the lower-left of the first frame and the first
   * tutorial star reads against dark sky.
   */
  spawn: { position: polar(298, 410, 24), lift: 130, side: 150 },
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
        // One wide, gentle lap around the outside of the system, then a spiral in to a finish
        // near the singularity, high above the disk where the pull is still mild.
        gates: [
          { position: polar(300, 372, 12), radius: 12 },
          { position: polar(265, 378, 26), radius: 12 },
          { position: polar(230, 366, 40), radius: 12 },
          { position: polar(195, 352, 30), radius: 12 },
          { position: polar(160, 356, 10), radius: 12 },
          { position: polar(125, 348, -10), radius: 12 },
          { position: polar(90, 342, 10), radius: 12 },
          { position: polar(55, 348, 30), radius: 12 },
          { position: polar(20, 334, 24), radius: 12 },
          { position: polar(350, 284, 24), radius: 12 },
          { position: polar(325, 205, 32), radius: 12 },
          { position: polar(305, 150, 36), radius: 12 },
          { position: polar(275, 92, 38), radius: 14 },
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

/**
 * Objectives in the order the mission log lists them. Required ones tell the story and must be
 * logged in this order (see GameState); the rest are free side content.
 */
export const OBJECTIVES = [
  { id: 'scan-origin', label: 'Scan ORIGIN', required: true },
  { id: 'scan-softtek-intern', label: 'Scan the SOFTTEK moon · intern', required: true },
  { id: 'dock-tec', label: 'Dock at TEC STATION · B.S. graduation', required: true },
  { id: 'scan-softtek', label: 'Scan SOFTTEK', required: true },
  { id: 'scan-regrello', label: 'Scan REGRELLO', required: true },
  { id: 'scan-tec-msc', label: "Scan the TEC moon · master's", required: true },
  { id: 'scan-salesforce', label: 'Scan SALESFORCE', required: true },
  { id: 'scan-matchpoint', label: 'Scan the MATCHPOINT satellite', required: false },
  { id: 'scan-hackmty', label: 'Find the artifact orbiting TEC STATION', required: false },
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
  { label: 'ENGINEERING', skills: ['Software Architecture', 'Scalable Systems', 'Test Automation', 'CI/CD', 'Computer Science', 'IoT'] },
  { label: 'LEADERSHIP', skills: ['Team Leadership', 'Product Ownership', 'Entrepreneurship', 'Hackathons'] },
  { label: 'OFF THE CLOCK', skills: ['3D Printing', 'DIY Builder'] },
]
