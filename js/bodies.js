// ─────────────────────────────────────────────────────────────────────────────
// THE ONE CONFIG FILE for every object in the scene.
//
//   page:     true  → clickable, gets an article page at content/<slug>.md
//             false → label-only (cannot be clicked)
//   tagline:  shown on hover and used as the page headline (a `title:` line in
//             the page's front matter overrides it)
//   order of PAGES below = reading order (prev / next arrows, numbering)
//
// Sizes and distances are NOT to scale: bodies are enlarged and orbits are
// compressed so everything is visible at once.
// ─────────────────────────────────────────────────────────────────────────────

export const BODIES = [
  { slug: 'sun',     name: 'Sun',     page: true, tagline: 'The Original Star',
    radius: 6,    orbit: 0,   texture: 'textures/2k_sun.jpg', emissive: true },

  { slug: 'mercury', name: 'Mercury', page: true, tagline: 'The Speedster',
    radius: 0.8,  orbit: 14,  texture: 'textures/2k_mercury.jpg',          tilt: 0.03 },
  { slug: 'venus',   name: 'Venus',   page: true, tagline: 'The Hothead',
    radius: 1.3,  orbit: 20,  texture: 'textures/2k_venus_atmosphere.jpg', tilt: 3.1 },
  { slug: 'earth',   name: 'Earth',   page: true, tagline: 'The Overexposed Star',
    radius: 1.4,  orbit: 27,  texture: 'textures/2k_earth_daymap.jpg',     tilt: 0.41 },
  { slug: 'mars',    name: 'Mars',    page: true, tagline: 'The Comeback Kid',
    radius: 1.0,  orbit: 34,  texture: 'textures/2k_mars.jpg',             tilt: 0.44 },
  { slug: 'jupiter', name: 'Jupiter', page: true, tagline: 'The Heavyweight',
    radius: 3.6,  orbit: 56,  texture: 'textures/2k_jupiter.jpg',          tilt: 0.05 },
  { slug: 'saturn',  name: 'Saturn',  page: true, tagline: 'The Ringed Diva',
    radius: 3.0,  orbit: 74,  texture: 'textures/2k_saturn.jpg',           tilt: 0.47, rings: true },
  { slug: 'titan',   name: 'Titan',   page: true, tagline: 'The Understudy',
    radius: 0.55, orbit: 7.5, parent: 'saturn', texture: 'procedural:titan', moonLabel: true },
  { slug: 'uranus',  name: 'Uranus',  page: true, tagline: 'The Eccentric',
    radius: 2.0,  orbit: 90,  texture: 'textures/2k_uranus.jpg',           tilt: 1.71 },
  { slug: 'neptune', name: 'Neptune', page: true, tagline: 'The Recluse',
    radius: 1.95, orbit: 104, texture: 'textures/2k_neptune.jpg',          tilt: 0.49 },

  // ── label-only objects ──
  { slug: 'ganymede', name: 'Ganymede', page: false, radius: 0.5, orbit: 6.5, parent: 'jupiter',
    texture: 'textures/2k_moon.jpg', tint: 0xc9b9a6, moonLabel: true },
  { slug: 'ceres', name: 'Ceres', page: false, radius: 0.35, orbit: 42.5, angle: 0.8, texture: 'textures/2k_moon.jpg', tint: 0x9a948c, moonLabel: true },
  { slug: 'vesta', name: 'Vesta', page: false, radius: 0.3,  orbit: 41,   angle: 3.7, texture: 'textures/2k_moon.jpg', tint: 0xb3a999, moonLabel: true },
];

// Particle belts (label-only)
export const BELTS = [
  { name: 'Asteroid Belt', inner: 39, outer: 46, count: 2600, color: 0xb9a88f, size: 0.22, opacity: 0.7, labelAngle: -0.55 },
  { name: 'Kuiper Belt',   inner: 114, outer: 138, count: 4200, color: 0xbfd6f2, size: 0.3, opacity: 0.35, labelAngle: 2.2 },
];

// A distant star (label-only, not to scale)
export const BETELGEUSE = { name: 'Betelgeuse', note: '~550 light-years away · not to scale', position: [-300, -20, -420] };

export const PAGES = BODIES.filter(b => b.page);
export const bySlug = Object.fromEntries(BODIES.map(b => [b.slug, b]));
