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
];
