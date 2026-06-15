import type { CharacterDef } from '../types';

/**
 * Playable characters. Each is a palette-swapped hero sprite with a distinct
 * starting weapon and stat modifiers applied to RunState at run start. Locked
 * characters require the referenced achievement unlock id.
 */
export const CHARACTERS: Record<string, CharacterDef> = {
  knight: {
    id: 'knight',
    name: 'Knight',
    blurb: 'Balanced and sturdy. Starts with the Arcane Bolt.',
    spriteKey: 'player',
    startingWeapon: 'bolt',
    mods: {},
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    blurb: 'Glass cannon. +15% damage, -20 HP. Starts with Fireball.',
    spriteKey: 'player-mage',
    startingWeapon: 'fireball',
    mods: { damageMult: 1.15, maxHpAdd: -20, cooldownMult: 0.95 },
    unlockId: 'char-mage',
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    blurb: 'Fast and relentless. +15% speed, -10% cooldown. Starts with Knives.',
    spriteKey: 'player-ranger',
    startingWeapon: 'knife',
    mods: { moveSpeedMult: 1.15, cooldownMult: 0.9, maxHpAdd: -10 },
    unlockId: 'char-ranger',
  },
  vampire: {
    id: 'vampire',
    name: 'Vampire',
    blurb: 'Hungry hunter. +10% crit, +20% pickup. Starts with the Shadow Orb.',
    spriteKey: 'player-vampire',
    startingWeapon: 'shadow',
    mods: { critChance: 0.1, pickupRadiusMult: 1.2 },
    unlockId: 'char-vampire',
  },
  warden: {
    id: 'warden',
    name: 'Warden',
    blurb: 'Immovable bulwark. +60 HP, +2 armor, slower. Starts with Orbit Blades.',
    spriteKey: 'player-warden',
    startingWeapon: 'blade',
    mods: { maxHpAdd: 60, armor: 2, moveSpeedMult: 0.92 },
    unlockId: 'char-warden',
  },
};

export const DEFAULT_CHARACTER = 'knight';
