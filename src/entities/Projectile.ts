import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import type { Enemy } from './Enemy';

/** A pooled weapon projectile with damage, optional piercing, and a lifetime. */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage = 0;
  pierce = 0;
  private dieAt = 0;
  /** Enemies already hit (so a piercing shot doesn't multi-hit the same target). */
  private hits = new Set<Enemy>();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Registration/physics handled by the owning Arcade Group (classType).
    super(scene, x, y, 'bolt-cyan');
    this.setDepth(30);
    this.setBlendMode(Phaser.BlendModes.ADD);
  }

  fire(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    pierce: number,
    texture: string,
    lifetimeMs = 2200
  ): void {
    this.damage = damage;
    this.pierce = pierce;
    this.hits.clear();
    this.setTexture(texture);
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    this.setScale(GAME.spriteScale * 0.5);
    this.setRotation(angle);
    this.dieAt = this.scene.time.now + lifetimeMs;
    this.scene.physics.velocityFromRotation(angle, speed, this.body!.velocity);
  }

  /** Register a hit; returns true if the projectile should now be removed. */
  onHit(enemy: Enemy): boolean {
    if (this.hits.has(enemy)) return false;
    this.hits.add(enemy);
    if (this.pierce > 0) {
      this.pierce -= 1;
      return false;
    }
    return true;
  }

  alreadyHit(enemy: Enemy): boolean {
    return this.hits.has(enemy);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (time >= this.dieAt) this.kill();
  }

  kill(): void {
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
  }
}
