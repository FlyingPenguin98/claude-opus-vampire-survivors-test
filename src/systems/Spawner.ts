import Phaser from 'phaser';
import { SPAWN } from '../config/GameConfig';
import { ENEMIES, BOSS } from '../data/enemies';
import { WAVES, BOSS_TIME_SEC } from '../data/waves';
import type { WaveDef } from '../types';
import type { Enemy } from '../entities/Enemy';

/**
 * Time-driven enemy spawner. Selects the active wave from the schedule, spawns
 * batches just outside the camera view at a capped rate, and triggers the boss once.
 */
export class Spawner {
  private scene: Phaser.Scene;
  private enemies: Phaser.Physics.Arcade.Group;
  private targetPos: Phaser.Math.Vector2;

  private spawnTimer = 0;
  private bossSpawned = false;
  private onBoss?: (boss: Enemy) => void;

  constructor(
    scene: Phaser.Scene,
    enemies: Phaser.Physics.Arcade.Group,
    targetPos: Phaser.Math.Vector2,
    onBoss?: (boss: Enemy) => void
  ) {
    this.scene = scene;
    this.enemies = enemies;
    this.targetPos = targetPos;
    this.onBoss = onBoss;
  }

  private currentWave(elapsed: number): WaveDef {
    let wave = WAVES[0];
    for (const w of WAVES) {
      if (elapsed >= w.startSec) wave = w;
      else break;
    }
    return wave;
  }

  /** A point on a ring just outside the visible viewport, around the player. */
  private ringPoint(): { x: number; y: number } {
    const view = this.scene.cameras.main.worldView;
    const radius =
      Math.hypot(view.width, view.height) / 2 + SPAWN.spawnRingPadding;
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
    enemy.spawn(x, y, ENEMIES[defId], wave.hpMult, wave.speedMult, this.targetPos);
  }

  countActive(): number {
    return this.enemies.countActive(true);
  }

  update(delta: number, elapsed: number): void {
    // Boss trigger (once).
    if (!this.bossSpawned && elapsed >= BOSS_TIME_SEC) {
      this.bossSpawned = true;
      this.spawnBoss();
    }

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

  private spawnBoss(): void {
    const enemy = this.enemies.get() as Enemy | null;
    if (!enemy) return;
    const { x, y } = this.ringPoint();
    enemy.spawn(x, y, BOSS, 1, 1, this.targetPos, true);
    this.onBoss?.(enemy);
  }
}
