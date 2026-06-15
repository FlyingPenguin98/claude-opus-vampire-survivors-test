import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';

/** A pooled hostile projectile fired by shooter enemies/bosses. Damages the player. */
export class EnemyProjectile extends Phaser.Physics.Arcade.Sprite {
  damage = 0;
  private dieAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy-shot');
    this.setDepth(29);
    this.setBlendMode(Phaser.BlendModes.ADD);
  }

  fire(x: number, y: number, angle: number, speed: number, damage: number, lifetimeMs = 4000): void {
    this.damage = damage;
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    this.setTexture('enemy-shot');
    this.setScale(GAME.spriteScale * 0.5);
    this.setRotation(angle);
    this.dieAt = this.scene.time.now + lifetimeMs;
    this.scene.physics.velocityFromRotation(angle, speed, this.body!.velocity);
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
