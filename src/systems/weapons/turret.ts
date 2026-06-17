import Phaser from 'phaser';
import { GAME } from '../../config/GameConfig';
import type { WeaponInstance } from '../../types';
import type { WeaponBehavior, WeaponContext } from './WeaponBehavior';

interface Turret {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  expireAt: number;
  nextFireAt: number;
}

const FIRE_INTERVAL = 600;

/** Deploys stationary auto-firing turrets at the player's position. */
export class TurretBehavior implements WeaponBehavior {
  private turrets = new Map<string, Turret[]>();

  update(inst: WeaponInstance, ctx: WeaponContext, time: number, delta: number): void {
    let arr = this.turrets.get(inst.def.id);
    if (!arr) {
      arr = [];
      this.turrets.set(inst.def.id, arr);
    }
    inst.cooldownRemaining -= delta;
    if (inst.cooldownRemaining <= 0) {
      inst.cooldownRemaining = inst.cooldownMs * ctx.run.cooldownMult;
      const cap = Math.max(1, inst.count);
      const s = ctx.scene.add.image(ctx.player.x, ctx.player.y, 'turret').setDepth(14).setScale(GAME.spriteScale);
      arr.push({ sprite: s, x: ctx.player.x, y: ctx.player.y, expireAt: time + (inst.def.durationMs ?? 8000), nextFireAt: time + 300 });
      while (arr.length > cap) arr.shift()?.sprite.destroy();
    }

    const dmg = inst.damage * ctx.run.damageMult;
    for (let i = arr.length - 1; i >= 0; i--) {
      const t = arr[i];
      if (time >= t.expireAt) {
        t.sprite.destroy();
        arr.splice(i, 1);
        continue;
      }
      if (time >= t.nextFireAt) {
        const target = ctx.nearestEnemyTo(t.x, t.y);
        if (target) {
          const ang = Phaser.Math.Angle.Between(t.x, t.y, target.x, target.y);
          const proj = ctx.getProjectile();
          if (proj) proj.fire(t.x, t.y, ang, 400, dmg, 1, 'bolt-gold', inst.tint, inst.element);
          t.nextFireAt = time + FIRE_INTERVAL;
        }
      }
    }
  }

  onRemove(inst: WeaponInstance): void {
    this.turrets.get(inst.def.id)?.forEach((t) => t.sprite.destroy());
    this.turrets.delete(inst.def.id);
  }
}
