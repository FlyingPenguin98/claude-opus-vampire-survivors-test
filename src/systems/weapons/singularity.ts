import Phaser from 'phaser';
import type { WeaponInstance } from '../../types';
import type { WeaponBehavior, WeaponContext } from './WeaponBehavior';

interface Vortex {
  sprite: Phaser.GameObjects.Image;
  x: number;
  y: number;
  expireAt: number;
  nextTickAt: number;
}

/** Spawns a black hole that drags enemies inward and grinds them with DoT. */
export class SingularityBehavior implements WeaponBehavior {
  private vortices = new Map<string, Vortex[]>();

  update(inst: WeaponInstance, ctx: WeaponContext, time: number, delta: number): void {
    let arr = this.vortices.get(inst.def.id);
    if (!arr) {
      arr = [];
      this.vortices.set(inst.def.id, arr);
    }
    inst.cooldownRemaining -= delta;
    if (inst.cooldownRemaining <= 0) {
      inst.cooldownRemaining = inst.cooldownMs * ctx.run.cooldownMult;
      const target = ctx.nearestEnemyTo(ctx.player.x, ctx.player.y);
      const x = target ? target.x : ctx.player.x + Phaser.Math.Between(-120, 120);
      const y = target ? target.y : ctx.player.y + Phaser.Math.Between(-120, 120);
      const radius = inst.radius * ctx.run.areaMult;
      const sprite = ctx.scene.add
        .image(x, y, 'vortex')
        .setDepth(12)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(inst.tint ?? 0xffffff)
        .setScale(radius / 32);
      arr.push({ sprite, x, y, expireAt: time + (inst.def.durationMs ?? 2600), nextTickAt: time + 250 });
      ctx.cameraShake(80, 0.004);
    }

    const radius = inst.radius * ctx.run.areaMult;
    const force = inst.def.pullForce ?? 220;
    const dmg = inst.damage * ctx.run.damageMult;
    const enemies = ctx.allEnemies();
    for (let i = arr.length - 1; i >= 0; i--) {
      const v = arr[i];
      if (time >= v.expireAt) {
        v.sprite.destroy();
        arr.splice(i, 1);
        continue;
      }
      v.sprite.rotation += (delta / 1000) * 4;
      for (const e of enemies) {
        if (!e.active) continue;
        if (Phaser.Math.Distance.Between(v.x, v.y, e.x, e.y) <= radius) e.pull(v.x, v.y, force, time);
      }
      if (time >= v.nextTickAt) {
        v.nextTickAt = time + 250;
        ctx.aoeDamage(v.x, v.y, radius * 0.6, dmg, { dot: true, element: inst.element, color: '#c08aff' });
      }
    }
  }

  onRemove(inst: WeaponInstance): void {
    this.vortices.get(inst.def.id)?.forEach((v) => v.sprite.destroy());
    this.vortices.delete(inst.def.id);
  }
}
