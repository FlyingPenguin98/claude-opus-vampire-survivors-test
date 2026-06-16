import Phaser from 'phaser';
import type { WeaponInstance } from '../../types';
import type { Enemy } from '../../entities/Enemy';
import type { WeaponBehavior, WeaponContext } from './WeaponBehavior';

interface Ring {
  sprite: Phaser.GameObjects.Image;
  start: number;
  maxR: number;
  dmg: number;
  element?: string;
  hit: Set<Enemy>;
}

const RING_DURATION = 420;

/** Expanding shockwave from the player that damages and knocks back what it crosses. */
export class NovaBehavior implements WeaponBehavior {
  private rings = new Map<string, Ring[]>();

  update(inst: WeaponInstance, ctx: WeaponContext, time: number, delta: number): void {
    let arr = this.rings.get(inst.def.id);
    if (!arr) {
      arr = [];
      this.rings.set(inst.def.id, arr);
    }
    inst.cooldownRemaining -= delta;
    if (inst.cooldownRemaining <= 0) {
      inst.cooldownRemaining = inst.cooldownMs * ctx.run.cooldownMult;
      const sprite = ctx.scene.add
        .image(ctx.player.x, ctx.player.y, 'nova-ring')
        .setDepth(12)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setTint(inst.tint ?? 0xbfe8ff);
      arr.push({
        sprite,
        start: time,
        maxR: inst.radius * ctx.run.areaMult,
        dmg: inst.damage * ctx.run.damageMult,
        element: inst.element,
        hit: new Set(),
      });
      ctx.audio.hit();
    }

    const enemies = ctx.allEnemies();
    for (let i = arr.length - 1; i >= 0; i--) {
      const ring = arr[i];
      const p = (time - ring.start) / RING_DURATION;
      if (p >= 1) {
        ring.sprite.destroy();
        arr.splice(i, 1);
        continue;
      }
      const r = p * ring.maxR;
      ring.sprite.setPosition(ctx.player.x, ctx.player.y).setScale(r / 32).setAlpha(1 - p);
      for (const e of enemies) {
        if (!e.active || ring.hit.has(e)) continue;
        const d = Phaser.Math.Distance.Between(ctx.player.x, ctx.player.y, e.x, e.y);
        if (Math.abs(d - r) <= 16) {
          ctx.damageEnemy(e, ring.dmg, ctx.player.x, ctx.player.y, ring.element);
          ring.hit.add(e);
        }
      }
    }
  }

  onRemove(inst: WeaponInstance): void {
    this.rings.get(inst.def.id)?.forEach((r) => r.sprite.destroy());
    this.rings.delete(inst.def.id);
  }
}
