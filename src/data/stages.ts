import type { StageDef, WaveDef } from '../types';

/**
 * Build a standard 8-step escalating wave schedule from three enemy tiers
 * (early / mid / late). Keeps stages distinct without duplicating boilerplate.
 */
function buildWaves(early: string[], mid: string[], late: string[]): WaveDef[] {
  const all = [...new Set([...early, ...mid, ...late])];
  return [
    { startSec: 0, enemyIds: early, spawnIntervalMs: 900, hpMult: 1, speedMult: 1, batchSize: 2 },
    { startSec: 25, enemyIds: early, spawnIntervalMs: 800, hpMult: 1, speedMult: 1, batchSize: 3 },
    { startSec: 55, enemyIds: [...early, ...mid], spawnIntervalMs: 740, hpMult: 1.15, speedMult: 1.05, batchSize: 3 },
    { startSec: 95, enemyIds: mid, spawnIntervalMs: 640, hpMult: 1.35, speedMult: 1.1, batchSize: 4 },
    { startSec: 140, enemyIds: [...mid, ...late], spawnIntervalMs: 540, hpMult: 1.7, speedMult: 1.14, batchSize: 4 },
    { startSec: 200, enemyIds: [...mid, ...late], spawnIntervalMs: 460, hpMult: 2.1, speedMult: 1.2, batchSize: 5 },
    { startSec: 280, enemyIds: late, spawnIntervalMs: 380, hpMult: 2.7, speedMult: 1.26, batchSize: 6 },
    { startSec: 380, enemyIds: all, spawnIntervalMs: 320, hpMult: 3.6, speedMult: 1.34, batchSize: 7 },
  ];
}

export const STAGES: Record<string, StageDef> = {
  meadow: {
    id: 'meadow',
    name: 'Moonlit Meadow',
    blurb: 'Rolling fields under a pale moon. A gentle place to begin.',
    tileKey: 'grass',
    tint: 0x1b2a55,
    tintAlpha: 0.12,
    waves: buildWaves(
      ['bat', 'zombie'],
      ['zombie', 'slime', 'hound'],
      ['skeleton', 'blob', 'wisp']
    ),
    bossSchedule: [
      { timeSec: 180, bossId: 'revenant' },
      { timeSec: 420, bossId: 'warlock' },
    ],
    durationSec: 600,
  },
  crypt: {
    id: 'crypt',
    name: 'Forgotten Crypt',
    blurb: 'Cold stone halls crawling with the restless dead.',
    tileKey: 'stone',
    tint: 0x12102a,
    tintAlpha: 0.28,
    waves: buildWaves(
      ['bat', 'skeleton'],
      ['skeleton', 'wisp', 'hound'],
      ['golem', 'blob', 'wisp']
    ),
    bossSchedule: [
      { timeSec: 150, bossId: 'warlock' },
      { timeSec: 420, bossId: 'behemoth' },
    ],
    durationSec: 600,
    unlockId: 'stage-crypt',
  },
  wastes: {
    id: 'wastes',
    name: 'Ashen Wastes',
    blurb: 'A scorched expanse where only the strongest endure.',
    tileKey: 'ash',
    tint: 0x3a1410,
    tintAlpha: 0.26,
    waves: buildWaves(
      ['hound', 'skeleton'],
      ['golem', 'wisp', 'hound'],
      ['brute', 'golem', 'blob']
    ),
    bossSchedule: [
      { timeSec: 150, bossId: 'behemoth' },
      { timeSec: 400, bossId: 'revenant' },
    ],
    durationSec: 540,
    unlockId: 'stage-wastes',
  },
};

export const DEFAULT_STAGE = 'meadow';
