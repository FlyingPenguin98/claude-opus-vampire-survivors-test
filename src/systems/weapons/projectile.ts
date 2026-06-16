import Phaser from 'phaser';
import type { WeaponInstance } from '../../types';
import type { WeaponBehavior, WeaponContext } from './WeaponBehavior';

/** Fires pooled projectiles at the nearest enemy in a small spread. */
export class ProjectileBehavior implements WeaponBehavior {
  update(inst: WeaponInstance, ctx: WeaponContext, _time: number, delta: number): void {
    inst.cooldownRemaining -= delta;
    if (inst.cooldownRemaining > 0) return;
    const fired = this.fire(inst, ctx);
    inst.cooldownRemaining = fired ? inst.cooldownMs * ctx.run.cooldownMult : 120;
  }

  protected fire(inst: WeaponInstance, ctx: WeaponContext): boolean {
    const { player, run } = ctx;
    const target = ctx.nearestEnemyTo(player.x, player.y);
    if (!target) return false;
    const baseAngle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);
    const spread = Phaser.Math.DegToRad(14);
    const count = Math.max(1, inst.count);
    const dmg = inst.damage * run.damageMult;
    const speed = inst.projectileSpeed * run.projectileSpeedMult;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spread;
      const proj = ctx.getProjectile();
      if (!proj) break;
      proj.fire(player.x, player.y, baseAngle + offset, speed, dmg, inst.pierce, inst.def.textureKey, inst.tint, inst.element);
    }
    return true;
  }
}
