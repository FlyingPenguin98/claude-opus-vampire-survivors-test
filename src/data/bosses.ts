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
    hp: 1700,
    speed: 70,
    contactDamage: 20,
    xpValue: 120,
    goldChance: 1,
    behavior: 'chase',
    bodyRadius: 13,
    scale: 1.4,
    boss: true,
    chestChance: 1,
    shootIntervalMs: 2000,
    shotSpeed: 210,
    shotDamage: 12,
  },
  warlock: {
    id: 'warlock',
    name: 'Bone Warlock',
    textureKey: 'boss-warlock',
    hp: 2700,
    speed: 64,
    contactDamage: 20,
    xpValue: 160,
    goldChance: 1,
    behavior: 'chase',
    bodyRadius: 13,
    scale: 1.4,
    boss: true,
    chestChance: 1,
    shootIntervalMs: 1300,
    shotSpeed: 230,
    shotDamage: 12,
  },
  behemoth: {
    id: 'behemoth',
    name: 'Ashen Behemoth',
    textureKey: 'boss-behemoth',
    hp: 4100,
    speed: 60,
    contactDamage: 32,
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
