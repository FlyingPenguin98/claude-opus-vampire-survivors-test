import Phaser from 'phaser';
import { GAME } from '../../config/GameConfig';
import type { WeaponInstance } from '../../types';
import type { WeaponBehavior, WeaponContext } from './WeaponBehavior';

interface Pet {
  sprite: Phaser.GameObjects.Sprite;
  nextFireAt: number;
  phase: number;
}

/** A roaming familiar that orbits the player and fires at nearby foes. */
export class CompanionBehavior implements WeaponBehavior {
  private pets = new Map<string, Pet[]>();

  onAdd(inst: WeaponInstance, ctx: WeaponContext): void {
    this.ensure(inst, ctx);
  }

  update(inst: WeaponInstance, ctx: WeaponContext, time: number, delta: number): void {
    const arr = this.ensure(inst, ctx);
    const desired = Math.max(1, inst.count);
    while (arr.length < desired) {
      const s = ctx.scene.add.sprite(ctx.player.x, ctx.player.y, 'pet').setDepth(33).setScale(GAME.spriteScale);
      if (ctx.scene.anims.exists('pet-move')) s.play('pet-move');
      arr.push({ sprite: s, nextFireAt: 0, phase: Math.random() * Math.PI * 2 });
    }
    while (arr.length > desired) arr.pop()?.sprite.destroy();

    const fireInt = Math.max(280, inst.cooldownMs * ctx.run.cooldownMult);
    const dmg = inst.damage * ctx.run.damageMult;
    const speed = inst.projectileSpeed * ctx.run.projectileSpeedMult;
    const n = arr.length;
    for (let i = 0; i < n; i++) {
      const pet = arr[i];
      pet.phase += (delta / 1000) * 1.4;
      const a = pet.phase + (i / n) * Math.PI * 2;
      const tx = ctx.player.x + Math.cos(a) * 74;
      const ty = ctx.player.y + Math.sin(a) * 74;
      pet.sprite.x = Phaser.Math.Linear(pet.sprite.x, tx, 0.12);
      pet.sprite.y = Phaser.Math.Linear(pet.sprite.y, ty, 0.12);
      if (time >= pet.nextFireAt) {
        const target = ctx.nearestEnemyTo(pet.sprite.x, pet.sprite.y);
        if (target) {
          const ang = Phaser.Math.Angle.Between(pet.sprite.x, pet.sprite.y, target.x, target.y);
          const proj = ctx.getProjectile();
          if (proj) proj.fire(pet.sprite.x, pet.sprite.y, ang, speed, dmg, inst.pierce, 'bolt-violet', inst.tint, inst.element);
          pet.nextFireAt = time + fireInt;
        }
      }
    }
  }

  private ensure(inst: WeaponInstance, _ctx: WeaponContext): Pet[] {
    let a = this.pets.get(inst.def.id);
    if (!a) {
      a = [];
      this.pets.set(inst.def.id, a);
    }
    return a;
  }

  onRemove(inst: WeaponInstance): void {
    this.pets.get(inst.def.id)?.forEach((p) => p.sprite.destroy());
    this.pets.delete(inst.def.id);
  }
}
