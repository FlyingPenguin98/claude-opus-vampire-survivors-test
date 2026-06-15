import Phaser from 'phaser';
import { GAME, SPAWN } from '../config/GameConfig';
import { ENEMIES } from '../data/enemies';
import { BOSSES } from '../data/bosses';
import type { StageDef, WaveDef, EnemyDef } from '../types';
import type { Enemy } from '../entities/Enemy';

/** Callback an enemy uses to fire a projectile at a point. */
export type FireEnemyShotFn = (x: number, y: number, tx: number, ty: number, def: EnemyDef) => void;

/**
 * Time-driven enemy spawner, parameterized by the active StageDef. Selects the
 * current wave from the stage schedule, spawns batches just outside the camera view
 * at a capped rate, and triggers each scheduled boss once.
 */
export class Spawner {
  private scene: Phaser.Scene;
  private enemies: Phaser.Physics.Arcade.Group;
  private targetPos: Phaser.Math.Vector2;
  private stage: StageDef;

  // Grace period before the first wave so the player isn't swarmed on spawn.
  private spawnTimer: number = SPAWN.initialDelayMs;
  private bossesFired = new Set<number>();
  private onBoss?: (boss: Enemy) => void;
  private fireShot: FireEnemyShotFn;

  constructor(
    scene: Phaser.Scene,
    enemies: Phaser.Physics.Arcade.Group,
    targetPos: Phaser.Math.Vector2,
    stage: StageDef,
    fireShot: FireEnemyShotFn,
    onBoss?: (boss: Enemy) => void
  ) {
    this.scene = scene;
    this.enemies = enemies;
    this.targetPos = targetPos;
    this.stage = stage;
    this.fireShot = fireShot;
    this.onBoss = onBoss;
  }

  private currentWave(elapsed: number): WaveDef {
    const waves = this.stage.waves;
    let wave = waves[0];
    for (const w of waves) {
      if (elapsed >= w.startSec) wave = w;
      else break;
    }
    return wave;
  }

  /** A point on a ring just outside the visible viewport. */
  private ringPoint(): { x: number; y: number } {
    const view = this.scene.cameras.main.worldView;
    const viewDiag = Math.hypot(view.width || GAME.width, view.height || GAME.height);
    const baseDiag = Math.hypot(GAME.width, GAME.height);
    const radius =
      Math.max(viewDiag, baseDiag) / 2 +
      SPAWN.spawnRingPadding +
      Phaser.Math.FloatBetween(0, 220);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    return {
      x: this.targetPos.x + Math.cos(angle) * radius,
      y: this.targetPos.y + Math.sin(angle) * radius,
    };
  }

  private spawnOne(defId: string, wave: WaveDef): void {
    if (this.countActive() >= SPAWN.maxAlive) return;
    const enemy = this.enemies.get() as Enemy | null;
    if (!enemy) return;
    const { x, y } = this.ringPoint();
    enemy.spawn(x, y, ENEMIES[defId], wave.hpMult, wave.speedMult, this.targetPos, this.fireShot);
  }

  /** Spawn a specific enemy at a position (used for splitter offspring). */
  spawnAt(defId: string, x: number, y: number, hpMult: number, speedMult: number): void {
    if (this.countActive() >= SPAWN.maxAlive) return;
    const def = ENEMIES[defId];
    if (!def) return;
    const enemy = this.enemies.get() as Enemy | null;
    if (!enemy) return;
    enemy.spawn(x, y, def, hpMult, speedMult, this.targetPos, this.fireShot);
  }

  countActive(): number {
    return this.enemies.countActive(true);
  }

  update(delta: number, elapsed: number): void {
    // Scheduled bosses (each fires once).
    this.stage.bossSchedule.forEach((entry, i) => {
      if (!this.bossesFired.has(i) && elapsed >= entry.timeSec) {
        this.bossesFired.add(i);
        this.spawnBoss(entry.bossId);
      }
    });

    const wave = this.currentWave(elapsed);
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = wave.spawnIntervalMs;
      for (let i = 0; i < wave.batchSize; i++) {
        const id = wave.enemyIds[Phaser.Math.Between(0, wave.enemyIds.length - 1)];
        this.spawnOne(id, wave);
      }
    }
  }

  private spawnBoss(bossId: string): void {
    const def = BOSSES[bossId];
    if (!def) return;
    const enemy = this.enemies.get() as Enemy | null;
    if (!enemy) return;
    const { x, y } = this.ringPoint();
    enemy.spawn(x, y, def, 1, 1, this.targetPos, this.fireShot);
    this.onBoss?.(enemy);
  }
}
