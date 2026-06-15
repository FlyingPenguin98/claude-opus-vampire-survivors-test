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
  {
    id: 'passive-armor',
    name: 'Iron Skin',
    description: '+2 armor (reduces damage taken).',
    icon: 'sawblade',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.armor += 2;
    },
  },
  {
    id: 'passive-crit',
    name: 'Keen Edge',
    description: '+8% critical hit chance.',
    icon: 'knife',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.critChance = Math.min(1, run.critChance + 0.08);
    },
  },
  {
    id: 'passive-area',
    name: 'Resonance',
    description: '+12% area of effect.',
    icon: 'icon-flame',
    kind: 'passive',
    badge: 'Passive',
    apply: (run, weapons) => {
      run.areaMult *= 1.12;
      weapons.refreshDerivedStats();
    },
  },
  {
    id: 'passive-growth',
    name: 'Wisdom',
    description: '+15% experience gained.',
    icon: 'gem-gold',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.xpMult *= 1.15;
    },
  },
  {
    id: 'passive-regen',
    name: 'Recovery',
    description: '+0.6 HP regenerated per second.',
    icon: 'gem-green',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.regenPerSec += 0.6;
    },
  },
  {
    id: 'passive-luck',
    name: 'Fortune',
    description: '+25% gold and treasure chance.',
    icon: 'coin',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.luck *= 1.25;
    },
  },
  {
    id: 'passive-velocity',
    name: 'Propulsion',
    description: '+20% projectile speed.',
    icon: 'bolt-white',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.projectileSpeedMult *= 1.2;
    },
  },
  {
    id: 'passive-titan',
    name: "Titan's Heart",
    description: '+35 max HP and heal 35.',
    icon: 'icon-venom',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.maxHp += 35;
      run.hp = Math.min(run.maxHp, run.hp + 35);
    },
  },
  {
    id: 'passive-rage',
    name: 'Battle Rage',
    description: '+16% damage for all weapons.',
    icon: 'bolt-red',
    kind: 'passive',
    badge: 'Passive',
    apply: (run) => {
      run.damageMult *= 1.16;
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
