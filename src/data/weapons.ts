import type { WeaponDef, WeaponMod } from '../types';

/**
 * Weapon catalogue. Stats listed are level-1 values. On each level-up a RANDOM
 * upgrade is drawn from the weapon's `mods` pool (which is larger than the level
 * cap, so runs differ), and applied on top of the base stats by the WeaponSystem.
 *
 * Effects are incremental and applied in the order taken; `repeatable` mods can
 * recur. `tint` mods recolor the weapon (an elemental infusion) for variety.
 */

// --- Shared upgrade building blocks ---
const dmg = (): WeaponMod => ({ id: 'dmg', text: '+25% damage', dmgMul: 1.25, repeatable: true, weight: 1.2 });
const dmgBig = (): WeaponMod => ({ id: 'dmgBig', text: '+55% damage', dmgMul: 1.55, weight: 0.7 });
const cd = (): WeaponMod => ({ id: 'cd', text: '-15% cooldown', cdMul: 0.85, repeatable: true });
const cdBig = (): WeaponMod => ({ id: 'cdBig', text: '-30% cooldown', cdMul: 0.7, weight: 0.6 });
const pierce = (): WeaponMod => ({ id: 'pierce', text: '+1 pierce', addPierce: 1, repeatable: true });
const count = (): WeaponMod => ({ id: 'count', text: '+1 projectile', addCount: 1, weight: 1.2 });
const speed = (): WeaponMod => ({ id: 'speed', text: '+30% projectile speed', speedMul: 1.3, repeatable: true });
const area = (): WeaponMod => ({ id: 'area', text: '+20% area', radiusMul: 1.2, repeatable: true });
const areaBig = (): WeaponMod => ({ id: 'areaBig', text: '+45% area', radiusMul: 1.45, weight: 0.7 });
const orbCount = (): WeaponMod => ({ id: 'orbCount', text: '+1 orbiting projectile', addCount: 1, weight: 1.2 });

// Elemental infusions: recolor + a status effect on hit (see GameScene.applyElement).
const elFrost = (): WeaponMod => ({ id: 'el-frost', text: 'Frost infusion — chills & slows enemies hit', dmgMul: 1.05, tint: 0x9fe8ff, element: 'frost' });
const elFlame = (): WeaponMod => ({ id: 'el-flame', text: 'Flame infusion — sets enemies ablaze (burn)', dmgMul: 1.1, tint: 0xff8a3a, element: 'flame' });
const elVenom = (): WeaponMod => ({ id: 'el-venom', text: 'Venom infusion — lingering poison damage', dmgMul: 1.05, tint: 0x8aff5a, element: 'venom' });
const elShadow = (): WeaponMod => ({ id: 'el-shadow', text: 'Shadow infusion — curses foes to take +30% damage', dmgMul: 1.1, tint: 0xc08aff, element: 'shadow' });
const elHoly = (): WeaponMod => ({ id: 'el-holy', text: 'Radiant infusion — smites nearby foes on hit', dmgMul: 1.1, tint: 0xfff0a0, element: 'holy' });

// Type-specific scalars (read as inst.count by their handlers).
const jumpMod = (): WeaponMod => ({ id: 'jump', text: '+1 chain jump', addCount: 1, repeatable: true, weight: 1.2 });
const summonMod = (): WeaponMod => ({ id: 'summon', text: '+1 summon', addCount: 1, weight: 1.1 });
const strikeMod = (): WeaponMod => ({ id: 'strike', text: '+1 strike', addCount: 1, repeatable: true, weight: 1.1 });

const projPool = (...extra: WeaponMod[]): WeaponMod[] => [dmg(), dmgBig(), cd(), cdBig(), count(), pierce(), speed(), ...extra];
const auraPool = (...extra: WeaponMod[]): WeaponMod[] => [dmg(), dmgBig(), cd(), cdBig(), area(), areaBig(), ...extra];
const orbitPool = (...extra: WeaponMod[]): WeaponMod[] => [dmg(), dmgBig(), orbCount(), area(), areaBig(), speed(), ...extra];

export const WEAPONS: Record<string, WeaponDef> = {
  // --- Projectile weapons ---
  bolt: {
    id: 'bolt', name: 'Arcane Bolt', type: 'projectile', textureKey: 'bolt-cyan',
    description: 'Fires a homing bolt at the nearest foe.',
    maxLevel: 6, damage: 8, cooldownMs: 850, projectileSpeed: 360, pierce: 0, count: 1,
    evolvesInto: 'bolt-evo', requiresPassive: 'passive-might',
    mods: projPool(elFlame(), elShadow()),
  },
  spark: {
    id: 'spark', name: 'Holy Spark', type: 'projectile', textureKey: 'bolt-gold',
    description: 'Scatters fast sparks in a spread.',
    maxLevel: 6, damage: 5, cooldownMs: 1100, projectileSpeed: 420, pierce: 0, count: 3,
    evolvesInto: 'spark-evo', requiresPassive: 'passive-multishot',
    mods: projPool(elHoly(), elFrost()),
  },
  fireball: {
    id: 'fireball', name: 'Fireball', type: 'projectile', textureKey: 'bolt-red',
    description: 'A slow, heavy orb that burns through foes.',
    maxLevel: 6, damage: 22, cooldownMs: 1500, projectileSpeed: 240, pierce: 1, count: 1,
    evolvesInto: 'fireball-evo', requiresPassive: 'passive-vitality',
    mods: projPool(elVenom(), elShadow()),
  },
  knife: {
    id: 'knife', name: 'Throwing Knives', type: 'projectile', textureKey: 'knife',
    description: 'Rapid-fire blades hurled at the nearest foe.',
    maxLevel: 6, damage: 5, cooldownMs: 450, projectileSpeed: 520, pierce: 0, count: 2,
    mods: projPool(elFrost(), elFlame()),
  },
  shadow: {
    id: 'shadow', name: 'Shadow Orb', type: 'projectile', textureKey: 'bolt-violet',
    description: 'A dark orb that drifts through the swarm.',
    maxLevel: 6, damage: 9, cooldownMs: 1000, projectileSpeed: 300, pierce: 2, count: 1,
    mods: projPool(elVenom(), elHoly()),
  },
  lightning: {
    id: 'lightning', name: 'Chain Bolt', type: 'projectile', textureKey: 'bolt-white',
    description: 'A piercing arc of lightning.',
    maxLevel: 6, damage: 7, cooldownMs: 700, projectileSpeed: 640, pierce: 3, count: 1,
    mods: projPool(elFrost(), elShadow()),
  },

  // --- Aura weapons ---
  aura: {
    id: 'aura', name: 'Frost Aura', type: 'aura', textureKey: 'icon-frost',
    description: 'A chilling field damages nearby enemies.',
    maxLevel: 6, damage: 4, cooldownMs: 500, radius: 90,
    evolvesInto: 'aura-evo', requiresPassive: 'passive-haste',
    mods: auraPool(elFlame(), elVenom()),
  },
  halo: {
    id: 'halo', name: 'Sacred Flame', type: 'aura', textureKey: 'icon-flame',
    description: 'A searing halo that scorches the close swarm.',
    maxLevel: 6, damage: 6, cooldownMs: 380, radius: 70,
    mods: auraPool(elHoly(), elVenom()),
  },
  venom: {
    id: 'venom', name: 'Venom Cloud', type: 'aura', textureKey: 'icon-venom',
    description: 'A wide toxic cloud that erodes the horde.',
    maxLevel: 6, damage: 3, cooldownMs: 600, radius: 120,
    mods: auraPool(elFrost(), elFlame()),
  },

  // --- Orbit weapons ---
  blade: {
    id: 'blade', name: 'Orbit Blades', type: 'orbit', textureKey: 'blade',
    description: 'Blades orbit you, slicing what they touch.',
    maxLevel: 6, damage: 10, cooldownMs: 9999, radius: 70, count: 2,
    evolvesInto: 'blade-evo', requiresPassive: 'passive-swift',
    mods: orbitPool(elFlame(), elFrost()),
  },
  tome: {
    id: 'tome', name: 'Spirit Tomes', type: 'orbit', textureKey: 'tome',
    description: 'Sacred tomes circle you at a wide radius.',
    maxLevel: 6, damage: 8, cooldownMs: 9999, radius: 95, count: 2,
    mods: orbitPool(elHoly(), elShadow()),
  },
  sawblade: {
    id: 'sawblade', name: 'Whirling Saw', type: 'orbit', textureKey: 'sawblade',
    description: 'A heavy saw grinds in a tight orbit.',
    maxLevel: 6, damage: 16, cooldownMs: 9999, radius: 55, count: 1,
    mods: orbitPool(elVenom(), elFlame()),
  },

  // --- New behaviors (beyond the original three archetypes) ---
  boomerang: {
    id: 'boomerang', name: 'Boomerang', type: 'boomerang', textureKey: 'boomerang',
    description: 'A blade that flies out and curves back, hitting twice.',
    maxLevel: 6, damage: 11, cooldownMs: 1100, projectileSpeed: 380, pierce: 99, count: 1,
    mods: [dmg(), dmgBig(), cd(), cdBig(), count(), speed(), elFlame(), elFrost()],
  },
  chain: {
    id: 'chain', name: 'Chain Lightning', type: 'chain', textureKey: 'icon-chain',
    description: 'A bolt that arcs between nearby enemies.',
    maxLevel: 6, damage: 10, cooldownMs: 950, count: 3, jumpRange: 200,
    evolvesInto: 'chain-evo', requiresPassive: 'passive-velocity',
    mods: [dmg(), dmgBig(), cd(), cdBig(), jumpMod(), jumpMod(), elFrost(), elShadow()],
  },
  nova: {
    id: 'nova', name: 'Shockwave', type: 'nova', textureKey: 'icon-nova',
    description: 'A ring of force that pulses out, knocking enemies back.',
    maxLevel: 6, damage: 14, cooldownMs: 1600, radius: 140,
    mods: [dmg(), dmgBig(), cd(), cdBig(), area(), areaBig(), elFrost(), elFlame()],
  },
  storm: {
    id: 'storm', name: 'Meteor Storm', type: 'storm', textureKey: 'icon-storm',
    description: 'Calls down meteors at random points around you.',
    maxLevel: 6, damage: 24, cooldownMs: 2200, radius: 64, count: 3,
    evolvesInto: 'storm-evo', requiresPassive: 'passive-rage',
    mods: [dmg(), dmgBig(), area(), areaBig(), strikeMod(), cd(), elFlame(), elShadow()],
  },
  beam: {
    id: 'beam', name: 'Death Ray', type: 'beam', textureKey: 'icon-beam',
    description: 'A continuous beam that tracks the nearest foe.',
    maxLevel: 6, damage: 4, cooldownMs: 120, beamLength: 280, beamWidth: 34, radius: 1,
    evolvesInto: 'beam-evo', requiresPassive: 'passive-area',
    mods: [dmg(), dmgBig(), cd(), elFrost(), elShadow(), elHoly(), area()],
  },
  turret: {
    id: 'turret', name: 'Sentry Turret', type: 'turret', textureKey: 'icon-turret',
    description: 'Deploys a turret that auto-fires for a while.',
    maxLevel: 6, damage: 9, cooldownMs: 4000, count: 1, durationMs: 8000, pierce: 1,
    evolvesInto: 'turret-evo', requiresPassive: 'passive-armor',
    mods: [dmg(), dmgBig(), cd(), summonMod(), summonMod(), elFlame(), elShadow()],
  },
  companion: {
    id: 'companion', name: 'Spirit Familiar', type: 'companion', textureKey: 'icon-pet',
    description: 'A familiar that orbits you and fires at foes.',
    maxLevel: 6, damage: 8, cooldownMs: 900, projectileSpeed: 420, count: 1, pierce: 0,
    mods: [dmg(), dmgBig(), cd(), cdBig(), summonMod(), speed(), elVenom(), elHoly()],
  },
  singularity: {
    id: 'singularity', name: 'Singularity', type: 'singularity', textureKey: 'icon-singularity',
    description: 'A black hole that drags enemies in and grinds them.',
    maxLevel: 6, damage: 7, cooldownMs: 3200, radius: 120, durationMs: 2600, pullForce: 240,
    evolvesInto: 'singularity-evo', requiresPassive: 'passive-magnet',
    mods: [dmg(), dmgBig(), area(), areaBig(), cd(), elVenom(), elFrost()],
  },

  // --- Evolutions (granted via chest; never offered directly, never leveled) ---
  'bolt-evo': {
    id: 'bolt-evo', name: 'Arcane Storm', type: 'projectile', textureKey: 'bolt-cyan',
    description: 'A relentless storm of homing arcane shards.',
    maxLevel: 1, damage: 26, cooldownMs: 480, projectileSpeed: 440, pierce: 3, count: 4,
    evolvedFrom: 'bolt', mods: [],
  },
  'spark-evo': {
    id: 'spark-evo', name: 'Holy Tempest', type: 'projectile', textureKey: 'bolt-gold',
    description: 'A blinding fan of holy light.',
    maxLevel: 1, damage: 12, cooldownMs: 700, projectileSpeed: 480, pierce: 2, count: 9,
    evolvedFrom: 'spark', mods: [],
  },
  'fireball-evo': {
    id: 'fireball-evo', name: 'Inferno', type: 'projectile', textureKey: 'bolt-red',
    description: 'Twin meteors that incinerate everything.',
    maxLevel: 1, damage: 60, cooldownMs: 1100, projectileSpeed: 280, pierce: 4, count: 2,
    evolvedFrom: 'fireball', mods: [],
  },
  'aura-evo': {
    id: 'aura-evo', name: 'Blizzard', type: 'aura', textureKey: 'icon-frost',
    description: 'A vast, freezing storm engulfs the field.',
    maxLevel: 1, damage: 16, cooldownMs: 340, radius: 150,
    evolvedFrom: 'aura', mods: [],
  },
  'blade-evo': {
    id: 'blade-evo', name: 'Death Spiral', type: 'orbit', textureKey: 'blade',
    description: 'A whirling wall of six razor blades.',
    maxLevel: 1, damage: 30, cooldownMs: 9999, radius: 95, count: 6,
    evolvedFrom: 'blade', mods: [],
  },
  'chain-evo': {
    id: 'chain-evo', name: 'Tempest', type: 'chain', textureKey: 'icon-chain',
    description: 'A storm of lightning that leaps across the whole swarm.',
    maxLevel: 1, damage: 22, cooldownMs: 600, count: 7, jumpRange: 270,
    evolvedFrom: 'chain', mods: [],
  },
  'storm-evo': {
    id: 'storm-evo', name: 'Cataclysm', type: 'storm', textureKey: 'icon-storm',
    description: 'A relentless barrage of devastating meteors.',
    maxLevel: 1, damage: 44, cooldownMs: 1700, radius: 90, count: 6,
    evolvedFrom: 'storm', mods: [],
  },
  'beam-evo': {
    id: 'beam-evo', name: 'Annihilation Ray', type: 'beam', textureKey: 'icon-beam',
    description: 'A vast, searing beam that vaporizes everything in line.',
    maxLevel: 1, damage: 8, cooldownMs: 90, beamLength: 440, beamWidth: 62, radius: 1,
    evolvedFrom: 'beam', mods: [],
  },
  'turret-evo': {
    id: 'turret-evo', name: 'War Machine', type: 'turret', textureKey: 'icon-turret',
    description: 'Three heavy turrets that lay down withering fire.',
    maxLevel: 1, damage: 16, cooldownMs: 3000, count: 3, durationMs: 11000, pierce: 2,
    evolvedFrom: 'turret', mods: [],
  },
  'singularity-evo': {
    id: 'singularity-evo', name: 'Event Horizon', type: 'singularity', textureKey: 'icon-singularity',
    description: 'A colossal black hole no enemy can escape.',
    maxLevel: 1, damage: 14, cooldownMs: 2600, radius: 185, durationMs: 3600, pullForce: 360,
    evolvedFrom: 'singularity', mods: [],
  },
};

/** Weapon the player always starts with (overridden by character choice). */
export const STARTING_WEAPON = 'bolt';

/** Base weapons that can be offered as new picks (excludes evolutions). */
export const OFFERABLE_WEAPONS = Object.values(WEAPONS).filter((w) => !w.evolvedFrom);

/** Evolution recipes derived from weapon defs. */
export interface EvolutionRecipe {
  baseId: string;
  requiresPassive: string;
  resultId: string;
}
export const EVOLUTIONS: EvolutionRecipe[] = Object.values(WEAPONS)
  .filter((w) => w.evolvesInto && w.requiresPassive)
  .map((w) => ({
    baseId: w.id,
    requiresPassive: w.requiresPassive!,
    resultId: w.evolvesInto!,
  }));
