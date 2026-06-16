import Phaser from 'phaser';
import type { WeaponInstance } from '../../types';
import type { Enemy } from '../../entities/Enemy';
import type { WeaponBehavior, WeaponContext } from './WeaponBehavior';

/** Instant lightning that arcs from the nearest foe to nearby un-hit foes. */
export class ChainBehavior implements WeaponBehavior {
  update(inst: WeaponInstance, ctx: WeaponContext, _time: number, delta: number): void {
    inst.cooldownRemaining -= delta;
    if (inst.cooldownRemaining > 0) return;
    const fired = this.fire(inst, ctx);
    inst.cooldownRemaining = fired ? inst.cooldownMs * ctx.run.cooldownMult : 120;
  }

  private fire(inst: WeaponInstance, ctx: WeaponContext): boolean {
    const { player, run } = ctx;
    let cur = ctx.nearestEnemyTo(player.x, player.y);
    if (!cur) return false;
    const maxTargets = Math.max(1, inst.count);
    const range = inst.def.jumpRange ?? 200;
    const dmg = inst.damage * run.damageMult;
    const hit = new Set<Enemy>();
    const pts: { x: number; y: number }[] = [{ x: player.x, y: player.y }];

    let prevX = player.x;
    let prevY = player.y;
    for (let i = 0; i < maxTargets && cur; i++) {
      ctx.damageEnemy(cur, dmg, prevX, prevY, inst.element);
      hit.add(cur);
      pts.push({ x: cur.x, y: cur.y });
      prevX = cur.x;
      prevY = cur.y;
      const next = ctx.nearestEnemyTo(prevX, prevY, hit);
      cur = next && Phaser.Math.Distance.Between(prevX, prevY, next.x, next.y) <= range ? next : null;
    }

    this.drawArc(ctx, pts, inst.tint ?? 0xfff07a);
    ctx.audio.hit();
    return true;
  }

  private drawArc(ctx: WeaponContext, pts: { x: number; y: number }[], color: number): void {
    const g = ctx.scene.add.graphics().setDepth(33).setBlendMode(Phaser.BlendModes.ADD);
    g.lineStyle(3, color, 1);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.strokePath();
    ctx.scene.tweens.add({ targets: g, alpha: 0, duration: 160, onComplete: () => g.destroy() });
  }
}
