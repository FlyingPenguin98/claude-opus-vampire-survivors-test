import type { UpgradeChoice } from '../types';

/**
 * Passive (non-weapon) upgrade pool. Weapon "new" and "level up" choices are
 * generated dynamically by the UpgradeSystem from the player's current loadout.
 * Each passive can appear repeatedly across a run (stacking multipliers).
 */
export const PASSIVE_UPGRADES: UpgradeChoice[] = [
  {
    id: 'passive-might',
    name: 'Might',
    description: '+12% damage for all weapons.',
    icon: 'bolt-gold',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.damageMult *= 1.12;
    },
  },
  {
    id: 'passive-haste',
    name: 'Haste',
    description: '-8% weapon cooldown.',
    icon: 'bolt-cyan',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.cooldownMult *= 0.92;
    },
  },
  {
    id: 'passive-swift',
    name: 'Swiftness',
    description: '+10% movement speed.',
    icon: 'blade',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.moveSpeedMult *= 1.1;
    },
  },
  {
    id: 'passive-magnet',
    name: 'Lodestone',
    description: '+30% pickup radius.',
    icon: 'gem-blue',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.pickupRadiusMult *= 1.3;
    },
  },
  {
    id: 'passive-vitality',
    name: 'Vitality',
    description: '+20 max HP and heal 20.',
    icon: 'gem-green',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.maxHp += 20;
      run.hp = Math.min(run.maxHp, run.hp + 20);
    },
  },
  {
    id: 'passive-multishot',
    name: 'Duplicator',
    description: '+1 projectile to projectile weapons.',
    icon: 'bolt-violet',
    kind: 'passive',
    badge: 'Passive',
    apply: (run, weapons) => {
      run.projectileBonus += 1;
      weapons.refreshDerivedStats();
    },
  },
];

/** Always-available fallback so there is something to pick when pools are exhausted. */
export const HEAL_CHOICE: UpgradeChoice = {
  id: 'heal',
  name: 'Restoration',
  description: 'Recover 35 HP.',
  icon: 'gem-green',
  kind: 'heal',
  badge: 'Heal',
  apply: (run) => {
    run.hp = Math.min(run.maxHp, run.hp + 35);
  },
};
