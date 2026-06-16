import Phaser from 'phaser';
import type { WeaponInstance } from '../../types';
import type { WeaponBehavior, WeaponContext } from './WeaponBehavior';

/** A continuous death-ray that tracks the nearest enemy and burns everything in line. */
export class BeamBehavior implements WeaponBehavior {
  private sprites = new Map<string, Phaser.GameObjects.Image>();

  update(inst: WeaponInstance, ctx: WeaponContext, time: number, delta: number): void {
    const { player, run } = ctx;
    let spr = this.sprites.get(inst.def.id);
    if (!spr) {
      spr = ctx.scene.add.image(player.x, player.y, 'beam').setOrigin(0, 0.5).setDepth(13).setBlendMode(Phaser.BlendModes.ADD);
      this.sprites.set(inst.def.id, spr);
    }
    const target = ctx.nearestEnemyTo(player.x, player.y);
    const length = (inst.def.beamLength ?? 260) * run.areaMult;
    const width = inst.def.beamWidth ?? 34;
    if (!target) {
      spr.setAlpha(0);
      inst.cooldownRemaining = 0;
      return;
    }
    const ang = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);
    spr
      .setPosition(player.x, player.y)
      .setRotation(ang)
      .setScale(length / 64, width / 16)
      .setAlpha(0.55 + 0.2 * Math.sin(time / 60))
      .setTint(inst.tint ?? 0x9ff0ff);

    inst.cooldownRemaining -= delta;
    if (inst.cooldownRemaining > 0) return;
    inst.cooldownRemaining = inst.cooldownMs * run.cooldownMult;
    const dmg = inst.damage * run.damageMult;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const hw = width / 2;
    for (const e of ctx.allEnemies()) {
      if (!e.active) continue;
      const rx = e.x - player.x;
      const ry = e.y - player.y;
      const along = rx * dx + ry * dy;
      if (along < 0 || along > length) continue;
      if (Math.abs(rx * dy - ry * dx) <= hw) ctx.damageEnemy(e, dmg, player.x, player.y, inst.element);
    }
  }

  onRemove(inst: WeaponInstance): void {
    this.sprites.get(inst.def.id)?.destroy();
    this.sprites.delete(inst.def.id);
  }
}
