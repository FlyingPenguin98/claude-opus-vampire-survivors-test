import type { PowerupDef } from '../types';

/**
 * Permanent, gold-purchased meta upgrades. Each owned level is applied to a fresh
 * RunState at the start of every run (before character mods; HP is reset afterward).
 */
export const POWERUPS: Record<string, PowerupDef> = {
  'pow-hp': {
    id: 'pow-hp',
    name: 'Vitality',
    description: '+20 max HP per level.',
    icon: 'gem-green',
    maxLevel: 5,
    cost: (l) => 80 * (l + 1),
    apply: (run, l) => {
      run.maxHp += 20 * l;
    },
  },
  'pow-damage': {
    id: 'pow-damage',
    name: 'Power',
    description: '+6% damage per level.',
    icon: 'bolt-red',
    maxLevel: 5,
    cost: (l) => 100 * (l + 1),
    apply: (run, l) => {
      run.damageMult *= 1 + 0.06 * l;
    },
  },
  'pow-speed': {
    id: 'pow-speed',
    name: 'Agility',
    description: '+4% movement speed per level.',
    icon: 'blade',
    maxLevel: 5,
    cost: (l) => 70 * (l + 1),
    apply: (run, l) => {
      run.moveSpeedMult *= 1 + 0.04 * l;
    },
  },
  'pow-cooldown': {
    id: 'pow-cooldown',
    name: 'Alacrity',
    description: '-3% weapon cooldown per level.',
    icon: 'bolt-cyan',
    maxLevel: 5,
    cost: (l) => 110 * (l + 1),
    apply: (run, l) => {
      run.cooldownMult *= Math.pow(0.97, l);
    },
  },
  'pow-armor': {
    id: 'pow-armor',
    name: 'Plating',
    description: '+1 armor per level.',
    icon: 'sawblade',
    maxLevel: 5,
    cost: (l) => 90 * (l + 1),
    apply: (run, l) => {
      run.armor += l;
    },
  },
  'pow-magnet': {
    id: 'pow-magnet',
    name: 'Greed',
    description: '+10% pickup radius per level.',
    icon: 'gem-blue',
    maxLevel: 3,
    cost: (l) => 90 * (l + 1),
    apply: (run, l) => {
      run.pickupRadiusMult *= 1 + 0.1 * l;
    },
  },
  'pow-growth': {
    id: 'pow-growth',
    name: 'Insight',
    description: '+6% experience gained per level.',
    icon: 'gem-gold',
    maxLevel: 5,
    cost: (l) => 100 * (l + 1),
    apply: (run, l) => {
      run.xpMult *= 1 + 0.06 * l;
    },
  },
  'pow-luck': {
    id: 'pow-luck',
    name: 'Luck',
    description: '+12% gold & treasure chance per level.',
    icon: 'coin',
    maxLevel: 3,
    cost: (l) => 120 * (l + 1),
    apply: (run, l) => {
      run.luck *= 1 + 0.12 * l;
    },
  },
  'pow-regen': {
    id: 'pow-regen',
    name: 'Recovery',
    description: '+0.4 HP/sec regeneration per level.',
    icon: 'icon-venom',
    maxLevel: 3,
    cost: (l) => 130 * (l + 1),
    apply: (run, l) => {
      run.regenPerSec += 0.4 * l;
    },
  },
  'pow-revive': {
    id: 'pow-revive',
    name: 'Revival',
    description: 'Cheat death once per run.',
    icon: 'icon-frost',
    maxLevel: 1,
    cost: () => 600,
    apply: (run, l) => {
      run.revives += l;
    },
  },
};
