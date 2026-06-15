import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import type { RunState } from '../state/RunState';
import type { WeaponDef, WeaponInstance } from '../types';
import { WEAPONS } from '../data/weapons';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import type { Projectile } from '../entities/Projectile';

/** Callback GameScene provides so all weapon types route kills through one path. */
export type DamageEnemyFn = (enemy: Enemy, amount: number) => void;

export interface WeaponContext {
  scene: Phaser.Scene;
  run: RunState;
  player: Player;
  enemies: Phaser.Physics.Arcade.Group;
  getProjectile: () => Projectile | null;
  damageEnemy: DamageEnemyFn;
}

/**
 * Owns the player's active weapons and fires them. Projectile weapons spawn pooled
 * projectiles (collision handled by GameScene); aura and orbit weapons apply damage
 * directly each tick/frame through the provided damageEnemy callback.
 */
export class WeaponSystem {
  private ctx: WeaponContext;
  private owned = new Map<string, WeaponInstance>();

  // Orbit weapon visuals.
  private blades: Phaser.GameObjects.Image[] = [];
  private orbitAngle = 0;

  // Aura weapon visual.
  private auraSprite?: Phaser.GameObjects.Image;

  constructor(ctx: WeaponContext) {
    this.ctx = ctx;
  }

  get ownedIds(): string[] {
    return [...this.owned.keys()];
  }

  hasWeapon(id: string): boolean {
    return this.owned.has(id);
  }

  getInstance(id: string): WeaponInstance | undefined {
    return this.owned.get(id);
  }

  isMaxed(id: string): boolean {
    const inst = this.owned.get(id);
    return !!inst && inst.level >= inst.def.maxLevel;
  }

  /** Number of distinct weapons the player owns. Caps loadout size in upgrade rolls. */
  get weaponCount(): number {
    return this.owned.size;
  }

  addWeapon(id: string): void {
    if (this.owned.has(id)) {
      this.levelUpWeapon(id);
      return;
    }
    const def = WEAPONS[id];
    const inst: WeaponInstance = {
      def,
      level: 1,
      damage: def.damage,
      cooldownMs: def.cooldownMs,
      cooldownRemaining: 0,
      projectileSpeed: def.projectileSpeed ?? 0,
      pierce: def.pierce ?? 0,
      count: def.count ?? 1,
      radius: def.radius ?? 0,
    };
    this.owned.set(id, inst);
    this.refreshDerivedStats();
  }

  levelUpWeapon(id: string): void {
    const inst = this.owned.get(id);
    if (!inst || inst.level >= inst.def.maxLevel) return;
    inst.level += 1;
    this.applyLevel(inst);
    this.refreshDerivedStats();
  }

  /** Apply the per-level deltas described in WeaponDef.levelText. */
  private applyLevel(inst: WeaponInstance): void {
    const lvl = inst.level;
    switch (inst.def.id) {
      case 'bolt':
        if (lvl === 2) inst.count += 1;
        if (lvl === 3) inst.damage = Math.round(inst.def.damage * 1.4);
        if (lvl === 4) inst.pierce += 1;
        if (lvl === 5) {
          inst.count += 1;
          inst.cooldownMs = Math.round(inst.def.cooldownMs * 0.85);
        }
        if (lvl === 6) inst.damage = Math.round(inst.def.damage * 2.0);
        break;
      case 'spark':
        if (lvl === 2) inst.count += 2;
        if (lvl === 3) inst.damage = Math.round(inst.def.damage * 1.3);
        if (lvl === 4) inst.count += 2;
        if (lvl === 5) inst.cooldownMs = Math.round(inst.def.cooldownMs * 0.8);
        if (lvl === 6) {
          inst.pierce += 1;
          inst.damage = Math.round(inst.def.damage * 1.7);
        }
        break;
      case 'aura':
        if (lvl === 2) inst.radius = Math.round((inst.def.radius ?? 0) * 1.25);
        if (lvl === 3) inst.damage = Math.round(inst.def.damage * 1.5);
        if (lvl === 4) inst.radius = Math.round((inst.def.radius ?? 0) * 1.45);
        if (lvl === 5) inst.cooldownMs = Math.round(inst.def.cooldownMs * 0.8);
        if (lvl === 6) inst.damage = Math.round(inst.def.damage * 2.2);
        break;
      case 'blade':
        if (lvl === 2) inst.count += 1;
        if (lvl === 3) inst.damage = Math.round(inst.def.damage * 1.4);
        if (lvl === 4) {
          inst.count += 1;
          inst.radius = Math.round((inst.def.radius ?? 0) * 1.15);
        }
        if (lvl === 5) inst.damage = Math.round(inst.def.damage * 1.9);
        if (lvl === 6) inst.count += 2;
        break;
    }
  }

  /** Recompute stats affected by global passives (called when passives change). */
  refreshDerivedStats(): void {
    for (const inst of this.owned.values()) {
      if (inst.def.type === 'projectile') {
        const base = (inst.def.count ?? 1) + this.levelCountBonus(inst);
        inst.count = base + this.ctx.run.projectileBonus;
      }
    }
    this.syncBlades();
  }

  /** How many extra projectiles this weapon's levels have granted (excludes passives). */
  private levelCountBonus(inst: WeaponInstance): number {
    let bonus = 0;
    if (inst.def.id === 'bolt') {
      if (inst.level >= 2) bonus += 1;
      if (inst.level >= 5) bonus += 1;
    } else if (inst.def.id === 'spark') {
      if (inst.level >= 2) bonus += 2;
      if (inst.level >= 4) bonus += 2;
    }
    return bonus;
  }

  update(time: number, delta: number): void {
    const { run } = this.ctx;
    for (const inst of this.owned.values()) {
      switch (inst.def.type) {
        case 'projectile':
          inst.cooldownRemaining -= delta;
          if (inst.cooldownRemaining <= 0) {
            const fired = this.fireProjectile(inst);
            // Only reset cooldown if we actually had a target to fire at.
            if (fired) inst.cooldownRemaining = inst.cooldownMs * run.cooldownMult;
            else inst.cooldownRemaining = 120; // retry shortly
          }
          break;
        case 'aura':
          inst.cooldownRemaining -= delta;
          this.updateAuraVisual(inst);
          if (inst.cooldownRemaining <= 0) {
            inst.cooldownRemaining = inst.cooldownMs * run.cooldownMult;
            this.tickAura(inst);
          }
          break;
        case 'orbit':
          this.updateOrbit(inst, time, delta);
          break;
      }
    }
  }

  // --- Projectile weapons ---

  private nearestEnemy(): Enemy | null {
    const { player } = this.ctx;
    let best: Enemy | null = null;
    let bestDist = Infinity;
    const children = this.ctx.enemies.getChildren() as Enemy[];
    for (const e of children) {
      if (!e.active) continue;
      const d = Phaser.Math.Distance.Squared(player.x, player.y, e.x, e.y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  private fireProjectile(inst: WeaponInstance): boolean {
    const target = this.nearestEnemy();
    if (!target) return false;
    const { player, run } = this.ctx;
    const baseAngle = Phaser.Math.Angle.Between(player.x, player.y, target.x, target.y);
    const spread = Phaser.Math.DegToRad(14);
    const count = Math.max(1, inst.count);
    const dmg = inst.damage * run.damageMult;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spread;
      const proj = this.ctx.getProjectile();
      if (!proj) break;
      proj.fire(
        player.x,
        player.y,
        baseAngle + offset,
        inst.projectileSpeed,
        dmg,
        inst.pierce,
        inst.def.textureKey
      );
    }
    return true;
  }

  // --- Aura weapon ---

  private updateAuraVisual(inst: WeaponInstance): void {
    const { scene, player } = this.ctx;
    if (!this.auraSprite) {
      this.auraSprite = scene.add
        .image(player.x, player.y, 'aura-field')
        .setDepth(10)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.5);
    }
    this.auraSprite.setPosition(player.x, player.y);
    // aura-field texture is 128px (radius 64); scale to desired world radius.
    this.auraSprite.setScale(inst.radius / 64);
  }

  private tickAura(inst: WeaponInstance): void {
    const { player, run } = this.ctx;
    const r2 = inst.radius * inst.radius;
    const dmg = inst.damage * run.damageMult;
    const children = this.ctx.enemies.getChildren() as Enemy[];
    for (const e of children) {
      if (!e.active) continue;
      if (Phaser.Math.Distance.Squared(player.x, player.y, e.x, e.y) <= r2) {
        this.ctx.damageEnemy(e, dmg);
      }
    }
  }

  // --- Orbit weapon ---

  private syncBlades(): void {
    const inst = this.owned.get('blade');
    const desired = inst ? Math.max(1, inst.count) : 0;
    while (this.blades.length < desired) {
      const b = this.ctx.scene.add
        .image(this.ctx.player.x, this.ctx.player.y, 'blade')
        .setDepth(31)
        .setScale(GAME.spriteScale * 0.7);
      this.blades.push(b);
    }
    while (this.blades.length > desired) {
      this.blades.pop()?.destroy();
    }
  }

  private updateOrbit(inst: WeaponInstance, time: number, delta: number): void {
    if (this.blades.length === 0) this.syncBlades();
    const { player, run } = this.ctx;
    this.orbitAngle += (delta / 1000) * 2.6; // radians/sec
    const n = this.blades.length;
    const r2 = 26 * 26; // blade hit radius squared (world px)
    const dmg = inst.damage * run.damageMult;
    const enemies = this.ctx.enemies.getChildren() as Enemy[];

    for (let i = 0; i < n; i++) {
      const a = this.orbitAngle + (i / n) * Math.PI * 2;
      const bx = player.x + Math.cos(a) * inst.radius;
      const by = player.y + Math.sin(a) * inst.radius;
      const blade = this.blades[i];
      blade.setPosition(bx, by).setRotation(a * 2);

      for (const e of enemies) {
        if (!e.active) continue;
        if (Phaser.Math.Distance.Squared(bx, by, e.x, e.y) <= r2) {
          if (time >= e.nextBladeHitAt) {
            e.nextBladeHitAt = time + 350;
            this.ctx.damageEnemy(e, dmg);
          }
        }
      }
    }
  }

  /** For UI: a readable summary of owned weapons and levels. */
  describeLoadout(): { def: WeaponDef; level: number }[] {
    return [...this.owned.values()].map((i) => ({ def: i.def, level: i.level }));
  }
}
