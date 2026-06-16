import Phaser from 'phaser';
import type { WeaponInstance } from '../../types';
import type { WeaponBehavior, WeaponContext } from './WeaponBehavior';

interface Strike {
  x: number;
  y: number;
  at: number;
  sprite: Phaser.GameObjects.Image;
}

const TELEGRAPH_MS = 650;
const SPREAD = 240;

/** Calls down meteors at random points around the player after a brief telegraph. */
export class StormBehavior implements WeaponBehavior {
  private strikes = new Map<string, Strike[]>();

  update(inst: WeaponInstance, ctx: WeaponContext, time: number, delta: number): void {
    let arr = this.strikes.get(inst.def.id);
    if (!arr) {
      arr = [];
      this.strikes.set(inst.def.id, arr);
    }
    inst.cooldownRemaining -= delta;
    if (inst.cooldownRemaining <= 0) {
      inst.cooldownRemaining = inst.cooldownMs * ctx.run.cooldownMult;
      const n = Math.max(1, inst.count);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * SPREAD;
        const x = ctx.player.x + Math.cos(a) * d;
        const y = ctx.player.y + Math.sin(a) * d;
        const sprite = ctx.scene.add.image(x, y, 'meteor-mark').setDepth(11).setAlpha(0.9);
        arr.push({ x, y, at: time + TELEGRAPH_MS, sprite });
      }
    }

    const blast = (inst.radius || 70) * ctx.run.areaMult;
    const dmg = inst.damage * ctx.run.damageMult;
    for (let i = arr.length - 1; i >= 0; i--) {
      const s = arr[i];
      if (time < s.at) continue;
      s.sprite.destroy();
      const ex = ctx.scene.add
        .image(s.x, s.y, 'explosion')
        .setDepth(28)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(blast / 16);
      ctx.scene.tweens.add({ targets: ex, alpha: 0, scale: (blast / 16) * 1.3, duration: 220, onComplete: () => ex.destroy() });
      ctx.aoeDamage(s.x, s.y, blast, dmg, { element: inst.element });
      ctx.cameraShake(110, 0.005);
      ctx.audio.hit();
      arr.splice(i, 1);
    }
  }

  onRemove(inst: WeaponInstance): void {
    this.strikes.get(inst.def.id)?.forEach((s) => s.sprite.destroy());
    this.strikes.delete(inst.def.id);
  }
}
