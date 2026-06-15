import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import type { EnemyDef } from '../types';
import type { FireEnemyShotFn } from '../systems/Spawner';

/**
 * A pooled enemy. Reconfigured per EnemyDef on spawn so a single pool can represent
 * every enemy type. Steering depends on the def's `behavior`; takes knockback on hit;
 * shooters/bosses fire projectiles via the provided callback.
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

  // Status effects (driven by elemental infusions; DoT ticked by GameScene).
  slowUntil = 0;
  slowFactor = 1;
  burnUntil = 0;
  burnDps = 0;
  poisonUntil = 0;
  poisonDps = 0;
  vulnUntil = 0;
  vulnMult = 1;
  nextDotTickAt = 0;

  private flashUntil = 0;
  private curSpeed = 0;
  private statusTinted = false;
  private knockbackUntil = 0;
  private knockbackResist = 0;
  private speedMult = 1;

  // Charger state.
  private chargeState: 'idle' | 'telegraph' | 'dash' = 'idle';
  private nextChargeAt = 0;
  private stateUntil = 0;
  private dashVx = 0;
  private dashVy = 0;

  // Shooter state.
  private nextShotAt = 0;
  private fireShot?: FireEnemyShotFn;

  constructor(scene: Phaser.Scene, x: number, y: number) {
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
    fireShot?: FireEnemyShotFn
  ): void {
    this.def = def;
    this.isBoss = !!def.boss;
    this.target = target;
    this.fireShot = fireShot;
    this.speedMult = speedMult;
    this.hp = def.hp * hpMult;
    this.maxHp = this.hp;
    this.speed = def.speed * speedMult;
    this.contactDamage = def.contactDamage;
    this.knockbackResist = def.knockbackResist ?? 0;
    this.nextHitAt = 0;
    this.nextBladeHitAt = 0;
    this.knockbackUntil = 0;
    this.slowUntil = 0;
    this.slowFactor = 1;
    this.burnUntil = 0;
    this.burnDps = 0;
    this.poisonUntil = 0;
    this.poisonDps = 0;
    this.vulnUntil = 0;
    this.vulnMult = 1;
    this.nextDotTickAt = 0;
    this.statusTinted = false;
    this.chargeState = 'idle';
    const now = this.scene.time.now;
    this.nextChargeAt = now + (def.chargeIntervalMs ?? 0);
    this.nextShotAt = now + (def.shootIntervalMs ?? 0);

    this.enableBody(true, x, y, true, true);
    this.setTexture(def.textureKey);
    this.setScale(GAME.spriteScale * (def.scale ?? 1));
    this.clearTint();
    this.setDepth(this.isBoss ? 35 : 20);
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

  /** Apply damage from an optional source point; returns true if lethal. */
  damage(amount: number, fromX?: number, fromY?: number): boolean {
    this.hp -= amount;
    this.setTintFill(0xffffff);
    this.flashUntil = this.scene.time.now + 60;

    // Knockback (bosses / resistant enemies shrug it off).
    if (fromX !== undefined && fromY !== undefined && this.knockbackResist < 1 && this.hp > 0) {
      const ang = Phaser.Math.Angle.Between(fromX, fromY, this.x, this.y);
      const force = 240 * (1 - this.knockbackResist);
      this.setVelocity(Math.cos(ang) * force, Math.sin(ang) * force);
      this.knockbackUntil = this.scene.time.now + 130;
    }
    return this.hp <= 0;
  }

  /** Multiplier on incoming damage (Shadow curse makes foes take more). */
  get damageTakenMult(): number {
    return this.scene.time.now < this.vulnUntil ? this.vulnMult : 1;
  }

  applySlow(factor: number, durMs: number): void {
    this.slowFactor = factor;
    this.slowUntil = this.scene.time.now + durMs;
  }

  applyBurn(dps: number, durMs: number): void {
    const now = this.scene.time.now;
    this.burnDps = now < this.burnUntil ? Math.max(this.burnDps, dps) : dps;
    this.burnUntil = now + durMs;
  }

  applyPoison(dps: number, durMs: number): void {
    const now = this.scene.time.now;
    this.poisonDps = now < this.poisonUntil ? Math.max(this.poisonDps, dps) : dps;
    this.poisonUntil = now + durMs;
  }

  applyVuln(mult: number, durMs: number): void {
    this.vulnMult = mult;
    this.vulnUntil = this.scene.time.now + durMs;
  }

  private statusTint(time: number): number | undefined {
    if (time < this.burnUntil) return 0xff8a3a;
    if (time < this.poisonUntil) return 0x8aff5a;
    if (time < this.slowUntil) return 0x9fd8ff;
    if (time < this.vulnUntil) return 0xc08aff;
    return undefined;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (this.flashUntil && time >= this.flashUntil) {
      this.clearTint();
      this.flashUntil = 0;
    }

    if (!this.target) return;

    // Current speed, reduced while chilled by Frost.
    this.curSpeed = time < this.slowUntil ? this.speed * this.slowFactor : this.speed;

    // Riding out a knockback impulse: don't override velocity.
    if (time < this.knockbackUntil) {
      this.setFlipX(this.target.x < this.x);
      return;
    }

    // Shooting is independent of movement (bosses chase + fire).
    if (this.def.shootIntervalMs && this.fireShot && time >= this.nextShotAt) {
      this.nextShotAt = time + this.def.shootIntervalMs;
      this.fireShot(this.x, this.y, this.target.x, this.target.y, this.def);
    }

    switch (this.def.behavior) {
      case 'charger':
        this.updateCharger(time);
        break;
      case 'shooter':
        this.updateShooter();
        break;
      default:
        this.steer(this.curSpeed);
        break;
    }

    this.setFlipX(this.target!.x < this.x);

    // Status colour feedback (don't fight the hit-flash or a charge telegraph).
    const charging = this.def.behavior === 'charger' && this.chargeState !== 'idle';
    if (!this.flashUntil && !charging) {
      const t = this.statusTint(time);
      if (t !== undefined) {
        this.setTint(t);
        this.statusTinted = true;
      } else if (this.statusTinted) {
        this.clearTint();
        this.statusTinted = false;
      }
    }
  }

  private steer(speed: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target!.x, this.target!.y);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private updateCharger(time: number): void {
    if (this.chargeState === 'dash') {
      this.setVelocity(this.dashVx, this.dashVy);
      if (time >= this.stateUntil) {
        this.chargeState = 'idle';
        this.nextChargeAt = time + (this.def.chargeIntervalMs ?? 2500);
        this.clearTint();
      }
      return;
    }
    if (this.chargeState === 'telegraph') {
      this.setVelocity(0, 0);
      // Blink red while winding up.
      this.setTint(time % 160 < 80 ? 0xff5a5a : 0xffffff);
      if (time >= this.stateUntil) {
        const ang = Phaser.Math.Angle.Between(this.x, this.y, this.target!.x, this.target!.y);
        const dashSpeed = (this.def.chargeSpeed ?? 320) * this.speedMult;
        this.dashVx = Math.cos(ang) * dashSpeed;
        this.dashVy = Math.sin(ang) * dashSpeed;
        this.chargeState = 'dash';
        this.stateUntil = time + 360;
        this.clearTint();
      }
      return;
    }
    // idle: chase normally, then wind up when it's time.
    this.steer(this.curSpeed);
    if (time >= this.nextChargeAt) {
      this.chargeState = 'telegraph';
      this.stateUntil = time + 420;
    }
  }

  private updateShooter(): void {
    const standoff = this.def.standoff ?? 220;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target!.x, this.target!.y);
    if (dist > standoff * 1.15) {
      this.steer(this.curSpeed);
    } else if (dist < standoff * 0.8) {
      this.steer(-this.curSpeed * 0.8); // back away
    } else {
      this.setVelocity(0, 0);
    }
  }

  kill(): void {
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
    this.target = undefined;
    this.fireShot = undefined;
  }
}
