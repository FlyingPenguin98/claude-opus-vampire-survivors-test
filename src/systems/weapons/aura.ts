import Phaser from 'phaser';
import type { WeaponInstance } from '../../types';
import type { WeaponBehavior, WeaponContext } from './WeaponBehavior';

/** Per-aura-weapon tint so each field reads differently under ADD blend. */
const AURA_TINT: Record<string, number> = {
  aura: 0x9fe8ff,
  'aura-evo': 0xd8f4ff,
  halo: 0xff8a3a,
  venom: 0x8aff5a,
};

/** A damage field centered on the player; one sprite per aura weapon. */
export class AuraBehavior implements WeaponBehavior {
  private sprites = new Map<string, Phaser.GameObjects.Image>();

  update(inst: WeaponInstance, ctx: WeaponContext, _time: number, delta: number): void {
    this.updateVisual(inst, ctx);
    inst.cooldownRemaining -= delta;
    if (inst.cooldownRemaining > 0) return;
    inst.cooldownRemaining = inst.cooldownMs * ctx.run.cooldownMult;
    this.tick(inst, ctx);
  }

  onRemove(inst: WeaponInstance): void {
    this.sprites.get(inst.def.id)?.destroy();
    this.sprites.delete(inst.def.id);
  }

  private updateVisual(inst: WeaponInstance, ctx: WeaponContext): void {
    const { scene, player, run } = ctx;
    let sprite = this.sprites.get(inst.def.id);
    if (!sprite) {
      sprite = scene.add
        .image(player.x, player.y, 'aura-field')
        .setDepth(10)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.5);
      this.sprites.set(inst.def.id, sprite);
    }
    sprite.setPosition(player.x, player.y);
    sprite.setTint(inst.tint ?? AURA_TINT[inst.def.id] ?? 0xffffff);
    // aura-field texture is 128px (radius 64); scale to desired world radius.
    sprite.setScale((inst.radius * run.areaMult) / 64);
  }

  private tick(inst: WeaponInstance, ctx: WeaponContext): void {
    const { player, run } = ctx;
    const r = inst.radius * run.areaMult;
    const dmg = inst.damage * run.damageMult;
    ctx.aoeDamage(player.x, player.y, r, dmg, { element: inst.element, knockback: true });
  }
}
