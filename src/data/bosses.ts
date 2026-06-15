import type { EnemyDef } from '../types';

/**
 * Boss catalogue. Bosses always chase, show a named health bar, and guarantee a
 * treasure chest on death. A boss with `shootIntervalMs` fires a barrage while it
 * closes in; a `charger` boss periodically dashes.
 */
export const BOSSES: Record<string, EnemyDef> = {
  revenant: {
    id: 'revenant',
    name: 'Revenant Lord',
    textureKey: 'boss',
    hp: 2600,
    speed: 70,
    contactDamage: 28,
    xpValue: 120,
    goldChance: 1,
    behavior: 'chase',
    bodyRadius: 13,
    scale: 1.4,
    boss: true,
    chestChance: 1,
    shootIntervalMs: 1700,
    shotSpeed: 210,
    shotDamage: 16,
  },
  warlock: {
    id: 'warlock',
    name: 'Bone Warlock',
    textureKey: 'boss-warlock',
    hp: 3600,
    speed: 64,
    contactDamage: 24,
    xpValue: 160,
    goldChance: 1,
    behavior: 'chase',
    bodyRadius: 13,
    scale: 1.4,
    boss: true,
    chestChance: 1,
    shootIntervalMs: 1150,
    shotSpeed: 230,
    shotDamage: 14,
  },
  behemoth: {
    id: 'behemoth',
    name: 'Ashen Behemoth',
    textureKey: 'boss-behemoth',
    hp: 5400,
    speed: 60,
    contactDamage: 40,
    xpValue: 220,
    goldChance: 1,
    behavior: 'charger',
    chargeIntervalMs: 2200,
    chargeSpeed: 430,
    knockbackResist: 1,
    bodyRadius: 14,
    scale: 1.6,
    boss: true,
    chestChance: 1,
  },
};
