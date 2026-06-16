import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import type { Enemy } from './Enemy';

/** A pooled weapon projectile with damage, optional piercing, and a lifetime. */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage = 0;
  pierce = 0;
  /** Elemental status applied on hit, if any. */
  element?: string;
  private dieAt = 0;
  /** Enemies already hit (so a piercing shot doesn't multi-hit the same target). */
  private hits = new Set<Enemy>();
  // Boomerang flight.
  private mode: 'straight' | 'boomerang' = 'straight';
  private owner?: { x: number; y: number };
  private speedVal = 0;
  private returnAt = 0;
  private returning = false;

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
    tint?: number,
    element?: string,
    lifetimeMs = 2200,
    mode: 'straight' | 'boomerang' = 'straight',
    owner?: { x: number; y: number }
  ): void {
    this.damage = damage;
    this.pierce = pierce;
    this.element = element;
    this.hits.clear();
    this.mode = mode;
    this.owner = owner;
    this.speedVal = speed;
    this.returning = false;
    this.returnAt = this.scene.time.now + lifetimeMs * 0.45;
    this.setTexture(texture);
    if (tint !== undefined) this.setTint(tint);
    else this.clearTint();
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
    if (this.mode === 'boomerang') {
      this.rotation += (delta / 1000) * 14;
      if (!this.returning && time >= this.returnAt) {
        this.returning = true;
        this.hits.clear(); // can hit foes again on the way back
      }
      if (this.returning && this.owner) {
        const ang = Phaser.Math.Angle.Between(this.x, this.y, this.owner.x, this.owner.y);
        this.scene.physics.velocityFromRotation(ang, this.speedVal, this.body!.velocity);
        if (Phaser.Math.Distance.Between(this.x, this.y, this.owner.x, this.owner.y) < 24) {
          this.kill();
          return;
        }
      }
    }
    if (time >= this.dieAt) this.kill();
  }

  kill(): void {
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
  }
}
