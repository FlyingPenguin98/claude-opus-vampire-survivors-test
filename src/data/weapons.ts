import type { WeaponDef } from '../types';

/**
 * Weapon catalogue. Stats listed are level-1 values; the WeaponSystem applies
 * per-level scaling when a weapon is leveled up (see WeaponSystem.applyLevel).
 */
export const WEAPONS: Record<string, WeaponDef> = {
  bolt: {
    id: 'bolt',
    name: 'Arcane Bolt',
    type: 'projectile',
    textureKey: 'bolt-cyan',
    description: 'Fires a homing bolt at the nearest foe.',
    maxLevel: 6,
    damage: 8,
    cooldownMs: 850,
    projectileSpeed: 360,
    pierce: 0,
    count: 1,
    levelText: [
      '',
      '+1 projectile',
      '+40% damage',
      '+1 pierce',
      '+1 projectile, -15% cooldown',
      '+60% damage',
    ],
  },
  spark: {
    id: 'spark',
    name: 'Holy Spark',
    type: 'projectile',
    textureKey: 'bolt-gold',
    description: 'Scatters fast sparks in a spread.',
    maxLevel: 6,
    damage: 5,
    cooldownMs: 1100,
    projectileSpeed: 420,
    pierce: 0,
    count: 3,
    levelText: [
      '',
      '+2 projectiles',
      '+30% damage',
      '+2 projectiles',
      '-20% cooldown',
      '+1 pierce, +40% damage',
    ],
  },
  aura: {
    id: 'aura',
    name: 'Frost Aura',
    type: 'aura',
    // Small UI icon; the in-world field uses the large 'aura-field' texture directly.
    textureKey: 'icon-frost',
    description: 'A chilling field damages nearby enemies.',
    maxLevel: 6,
    damage: 4,
    cooldownMs: 500,
    radius: 90,
    levelText: [
      '',
      '+25% radius',
      '+50% damage',
      '+20% radius',
      '-20% tick time',
      '+70% damage',
    ],
  },
  blade: {
    id: 'blade',
    name: 'Orbit Blades',
    type: 'orbit',
    textureKey: 'blade',
    description: 'Blades orbit you, slicing what they touch.',
    maxLevel: 6,
    damage: 10,
    cooldownMs: 9999, // orbit weapons are persistent, not cooldown-fired
    radius: 70,
    count: 2,
    levelText: [
      '',
      '+1 blade',
      '+40% damage',
      '+1 blade, +15% radius',
      '+50% damage',
      '+2 blades',
    ],
  },
};

/** Weapon the player always starts with. */
export const STARTING_WEAPON = 'bolt';
