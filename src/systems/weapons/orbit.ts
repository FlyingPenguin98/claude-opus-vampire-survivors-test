import Phaser from 'phaser';
import { GAME } from '../../config/GameConfig';
import type { WeaponInstance } from '../../types';
import type { WeaponBehavior, WeaponContext } from './WeaponBehavior';

/** Orbit visuals: texture scale and hit radius (world px) and spin speed per weapon. */
const ORBIT_VIS: Record<string, { scale: number; hit: number; spin: number }> = {
  blade: { scale: 0.7, hit: 26, spin: 2.6 },
  'blade-evo': { scale: 0.8, hit: 28, spin: 3.4 },
  tome: { scale: 0.8, hit: 24, spin: 2.0 },
  sawblade: { scale: 1.1, hit: 32, spin: 5.0 },
};

/** Projectiles that circle the player, dealing throttled contact damage. */
export class OrbitBehavior implements WeaponBehavior {
  private blades = new Map<string, Phaser.GameObjects.Image[]>();
  private angle = new Map<string, number>();

  update(inst: WeaponInstance, ctx: WeaponContext, time: number, delta: number): void {
    const { scene, player, run } = ctx;
    const id = inst.def.id;
    const vis = ORBIT_VIS[id] ?? ORBIT_VIS.blade;
    let arr = this.blades.get(id);
    if (!arr) {
      arr = [];
      this.blades.set(id, arr);
      this.angle.set(id, 0);
    }
    const desired = Math.max(1, inst.count);
    while (arr.length < desired) {
      arr.push(
        scene.add
          .image(player.x, player.y, inst.def.textureKey)
          .setDepth(31)
          .setScale(GAME.spriteScale * vis.scale)
      );
    }
    while (arr.length > desired) arr.pop()?.destroy();

    const a0 = (this.angle.get(id) ?? 0) + (delta / 1000) * vis.spin;
    this.angle.set(id, a0);
    const radius = inst.radius * run.areaMult;
    const r2 = vis.hit * vis.hit;
    const dmg = inst.damage * run.damageMult;
    const enemies = ctx.allEnemies();
    const n = arr.length;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      const bx = player.x + Math.cos(a) * radius;
      const by = player.y + Math.sin(a) * radius;
      const blade = arr[i];
      blade.setPosition(bx, by).setRotation(a * 2);
      if (inst.tint !== undefined) blade.setTint(inst.tint);
      else blade.clearTint();
      for (const e of enemies) {
        if (!e.active) continue;
        if (Phaser.Math.Distance.Squared(bx, by, e.x, e.y) <= r2) {
          if (time >= e.nextBladeHitAt) {
            e.nextBladeHitAt = time + 350;
            ctx.damageEnemy(e, dmg, bx, by, inst.element);
          }
        }
      }
    }
  }

  onRemove(inst: WeaponInstance): void {
    const arr = this.blades.get(inst.def.id);
    if (arr) for (const b of arr) b.destroy();
    this.blades.delete(inst.def.id);
    this.angle.delete(inst.def.id);
  }
}
