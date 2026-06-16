import type { StageDef, WaveDef } from '../types';

/**
 * Build a standard 8-step escalating wave schedule from three enemy tiers
 * (early / mid / late). Keeps stages distinct without duplicating boilerplate.
 */
function buildWaves(early: string[], mid: string[], late: string[]): WaveDef[] {
  const all = [...new Set([...early, ...mid, ...late])];
  // Smoothed ramp: the old curve spiked hard at 140-200s (hp 1.7-2.1 @ 460-540ms),
  // colliding with the 180s boss. This eases that window so power can keep pace.
  return [
    { startSec: 0, enemyIds: early, spawnIntervalMs: 950, hpMult: 1.0, speedMult: 1.0, batchSize: 2 },
    { startSec: 30, enemyIds: early, spawnIntervalMs: 850, hpMult: 1.05, speedMult: 1.0, batchSize: 2 },
    { startSec: 70, enemyIds: [...early, ...mid], spawnIntervalMs: 780, hpMult: 1.15, speedMult: 1.03, batchSize: 3 },
    { startSec: 120, enemyIds: mid, spawnIntervalMs: 700, hpMult: 1.3, speedMult: 1.06, batchSize: 3 },
    { startSec: 170, enemyIds: mid, spawnIntervalMs: 640, hpMult: 1.45, speedMult: 1.08, batchSize: 3 },
    { startSec: 230, enemyIds: [...mid, ...late], spawnIntervalMs: 560, hpMult: 1.7, speedMult: 1.12, batchSize: 4 },
    { startSec: 300, enemyIds: late, spawnIntervalMs: 480, hpMult: 2.05, speedMult: 1.18, batchSize: 5 },
    { startSec: 400, enemyIds: all, spawnIntervalMs: 400, hpMult: 2.6, speedMult: 1.25, batchSize: 6 },
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
      { timeSec: 210, bossId: 'revenant' },
      { timeSec: 450, bossId: 'warlock' },
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
      { timeSec: 195, bossId: 'warlock' },
      { timeSec: 450, bossId: 'behemoth' },
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
      { timeSec: 195, bossId: 'behemoth' },
      { timeSec: 430, bossId: 'revenant' },
    ],
    durationSec: 540,
    unlockId: 'stage-wastes',
  },
};

export const DEFAULT_STAGE = 'meadow';
