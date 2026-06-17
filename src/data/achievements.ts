import type { AchievementDef } from '../types';

/**
 * Achievements evaluated at the end of each run. Earning one can unlock characters
 * or stages (ids referenced in characters.ts / stages.ts via their `unlockId`).
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'ach-survive5',
    name: 'Through the Night',
    description: 'Survive for 5 minutes.',
    check: (s) => s.timeSec >= 300,
    unlocks: ['char-mage'],
  },
  {
    id: 'ach-level20',
    name: 'Ascendant',
    description: 'Reach level 20 in a single run.',
    check: (s) => s.level >= 20,
    unlocks: ['char-ranger'],
  },
  {
    id: 'ach-boss',
    name: 'Giant Slayer',
    description: 'Defeat a boss.',
    check: (s) => s.bossKills >= 1,
    unlocks: ['char-vampire'],
  },
  {
    id: 'ach-kills1000',
    name: 'Swarm Breaker',
    description: 'Slay 1000 enemies in one run.',
    check: (s) => s.kills >= 1000,
    unlocks: ['char-warden'],
  },
  {
    id: 'ach-survive10',
    name: 'Deeper Dark',
    description: 'Survive for 10 minutes.',
    check: (s) => s.timeSec >= 600,
    unlocks: ['stage-crypt'],
  },
  {
    id: 'ach-victory',
    name: 'Dawnbringer',
    description: 'Clear a stage.',
    check: (s) => s.victory,
    unlocks: ['stage-wastes'],
  },
  {
    id: 'ach-level10',
    name: 'Adept',
    description: 'Reach level 10 in a run.',
    check: (s) => s.level >= 10,
  },
  {
    id: 'ach-kills250',
    name: 'Cleaver',
    description: 'Slay 250 enemies in one run.',
    check: (s) => s.kills >= 250,
  },
  {
    id: 'ach-twobosses',
    name: 'Boss Hunter',
    description: 'Defeat 2 bosses in one run.',
    check: (s) => s.bossKills >= 2,
  },
  {
    id: 'ach-gold400',
    name: 'Treasure Hunter',
    description: 'Collect 400 gold in one run.',
    check: (s) => s.gold >= 400,
  },
  {
    id: 'ach-survive8',
    name: 'Night Owl',
    description: 'Survive for 8 minutes.',
    check: (s) => s.timeSec >= 480,
  },
  {
    id: 'ach-explorer',
    name: 'Wanderer',
    description: 'Play all three stages.',
    check: (_s, meta) => Object.keys(meta.bestPerStage).length >= 3,
  },
  {
    id: 'ach-veteran',
    name: 'Veteran',
    description: 'Finish 10 runs.',
    check: (_s, meta) => meta.runs >= 10,
  },
  {
    id: 'ach-rich',
    name: 'Hoarder',
    description: 'Earn 2000 lifetime gold.',
    check: (_s, meta) => meta.totalGold >= 2000,
  },
];
