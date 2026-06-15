import type { WaveDef } from '../types';

/**
 * Spawn schedule keyed by elapsed run time. The Spawner picks the latest wave whose
 * `startSec` has passed. Difficulty rises via enemy mix, stat multipliers, and batch size.
 */
export const WAVES: WaveDef[] = [
  { startSec: 0, enemyIds: ['bat'], spawnIntervalMs: 900, hpMult: 1, speedMult: 1, batchSize: 2 },
  { startSec: 25, enemyIds: ['bat', 'zombie'], spawnIntervalMs: 800, hpMult: 1, speedMult: 1, batchSize: 3 },
  { startSec: 55, enemyIds: ['zombie', 'slime'], spawnIntervalMs: 750, hpMult: 1.15, speedMult: 1.05, batchSize: 3 },
  { startSec: 90, enemyIds: ['bat', 'slime', 'skeleton'], spawnIntervalMs: 650, hpMult: 1.3, speedMult: 1.1, batchSize: 4 },
  { startSec: 130, enemyIds: ['zombie', 'skeleton'], spawnIntervalMs: 550, hpMult: 1.6, speedMult: 1.12, batchSize: 4 },
  { startSec: 175, enemyIds: ['bat', 'slime', 'skeleton'], spawnIntervalMs: 480, hpMult: 1.9, speedMult: 1.18, batchSize: 5 },
  { startSec: 230, enemyIds: ['zombie', 'slime', 'skeleton'], spawnIntervalMs: 400, hpMult: 2.4, speedMult: 1.22, batchSize: 6 },
  { startSec: 300, enemyIds: ['bat', 'zombie', 'slime', 'skeleton'], spawnIntervalMs: 340, hpMult: 3.2, speedMult: 1.3, batchSize: 7 },
];

/** Boss spawns once at this elapsed time. */
export const BOSS_TIME_SEC = 180;
