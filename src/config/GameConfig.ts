/**
 * Central tunable constants for the whole game. Keeping these in one place makes
 * balancing and resizing easy without hunting through systems.
 */
export const GAME = {
  /** Internal render resolution. The canvas scales to fit the window. */
  width: 960,
  height: 540,

  /** The playable world is larger than the viewport; the camera follows the player. */
  worldWidth: 4000,
  worldHeight: 4000,

  /** Pixel-art sprites are authored small and shown scaled up by this factor. */
  spriteScale: 3,

  backgroundColor: '#10101c',
} as const;

export const PLAYER = {
  maxHp: 100,
  speed: 200,
  /** Seconds of invulnerability after taking a hit. */
  invulnSeconds: 0.6,
  /** Base radius (world px) within which gems are pulled toward the player. */
  basePickupRadius: 90,
  /** Player collision body radius in source-sprite pixels. */
  bodyRadius: 5,
} as const;

export const XP = {
  /** XP required for level 2; each subsequent level scales by the curve below. */
  base: 5,
  growth: 1.32,
  /** Gem magnet acceleration once a gem is within pickup radius. */
  magnetSpeed: 520,
} as const;

export const SPAWN = {
  /** Hard cap on simultaneously-alive enemies for performance. */
  maxAlive: 320,
  /** Enemies spawn on a ring this far outside the visible viewport. */
  spawnRingPadding: 120,
  /** Grace period (ms) before the first enemies spawn at the start of a run. */
  initialDelayMs: 1500,
} as const;
