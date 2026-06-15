import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import type { EnemyDef } from '../types';

/**
 * A pooled enemy. Reconfigured per EnemyDef on spawn so a single pool can represent
 * every enemy type. Steers toward the shared target (the player) each frame and
 * deals contact damage handled by GameScene's overlap callback.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  def!: EnemyDef;
  hp = 1;
  maxHp = 1;
  speed = 0;
  contactDamage = 0;
  isBoss = false;
  /** Next time (ms) this enemy may deal contact damage. */
  nextHitAt = 0;
  /** Next time (ms) an orbiting blade may damage this enemy again. */
  nextBladeHitAt = 0;
  /** Target the enemy chases; set by the spawner. */
  target?: Phaser.Math.Vector2;

  private flashUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Display-list / update-list / physics-body registration is handled by the
    // Arcade physics Group that creates these via classType — do not add here.
    super(scene, x, y, 'bat');
    this.setDepth(20);
  }

  spawn(
    x: number,
    y: number,
    def: EnemyDef,
    hpMult: number,
    speedMult: number,
    target: Phaser.Math.Vector2,
    isBoss = false
  ): void {
    this.def = def;
    this.isBoss = isBoss;
    this.target = target;
    this.hp = def.hp * hpMult;
    this.maxHp = this.hp;
    this.speed = def.speed * speedMult;
    this.contactDamage = def.contactDamage;
    this.nextHitAt = 0;
    this.nextBladeHitAt = 0;

    this.enableBody(true, x, y, true, true);
    this.setTexture(def.textureKey);
    this.setScale(isBoss ? GAME.spriteScale * 1.4 : GAME.spriteScale);
    this.setTint(0xffffff);
    this.clearTint();
    this.setDepth(isBoss ? 35 : 20);
    this.setActive(true).setVisible(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(
      def.bodyRadius,
      this.width / 2 - def.bodyRadius,
      this.height / 2 - def.bodyRadius
    );

    const animKey = `${def.textureKey}-move`;
    if (this.scene.anims.exists(animKey)) this.play(animKey);
  }

  /** Apply damage; returns true if this hit was lethal. */
  damage(amount: number): boolean {
    this.hp -= amount;
    // Brief white flash on hit.
    this.setTintFill(0xffffff);
    this.flashUntil = this.scene.time.now + 60;
    return this.hp <= 0;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (this.flashUntil && time >= this.flashUntil) {
      this.clearTint();
      this.flashUntil = 0;
    }

    if (!this.target) return;
    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      this.target.x,
      this.target.y
    );
    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    // Face the direction of travel.
    this.setFlipX(this.target.x < this.x);
  }

  kill(): void {
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
    this.target = undefined;
  }
}
