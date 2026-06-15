import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import type { RunState } from '../state/RunState';
import type { WeaponDef, WeaponInstance } from '../types';
import { WEAPONS, EVOLUTIONS, type EvolutionRecipe } from '../data/weapons';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import type { Projectile } from '../entities/Projectile';

/** Callback GameScene provides so all weapon types route kills through one path. */
export type DamageEnemyFn = (enemy: Enemy, amount: number, fromX?: number, fromY?: number) => void;

export interface WeaponContext {
  scene: Phaser.Scene;
  run: RunState;
  player: Player;
  enemies: Phaser.Physics.Arcade.Group;
  getProjectile: () => Projectile | null;
  damageEnemy: DamageEnemyFn;
}

/** Per-aura-weapon tint so each field reads differently under ADD blend. */
const AURA_TINT: Record<string, number> = {
  aura: 0x9fe8ff,
  'aura-evo': 0xd8f4ff,
  halo: 0xff8a3a,
  venom: 0x8aff5a,
};

/** Orbit visuals: texture scale and hit radius (world px) per weapon. */
const ORBIT_VIS: Record<string, { scale: number; hit: number; spin: number }> = {
  blade: { scale: 0.7, hit: 26, spin: 2.6 },
  'blade-evo': { scale: 0.8, hit: 28, spin: 3.4 },
  tome: { scale: 0.8, hit: 24, spin: 2.0 },
  sawblade: { scale: 1.1, hit: 32, spin: 5.0 },
};

/**
 * Owns the player's active weapons and fires them. Projectile weapons spawn pooled
 * projectiles (collision handled by GameScene); aura and orbit weapons apply damage
 * directly each tick/frame through the provided damageEnemy callback.
 */
export class WeaponSystem {
  private ctx: WeaponContext;
  private owned = new Map<string, WeaponInstance>();

  /** Orbit visuals, one image array per orbit weapon id. */
  private orbits = new Map<string, Phaser.GameObjects.Image[]>();
  private orbitAngle = new Map<string, number>();

  /** Aura field sprites, one per aura weapon id. */
  private auras = new Map<string, Phaser.GameObjects.Image>();

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
    this.recompute(inst);
    this.refreshDerivedStats();
  }

  levelUpWeapon(id: string): void {
    const inst = this.owned.get(id);
    if (!inst || inst.level >= inst.def.maxLevel) return;
    inst.level += 1;
    this.recompute(inst);
    this.refreshDerivedStats();
  }

  /**
   * Recompute an instance's stats from its base def by applying all level deltas up
   * to the current level. damage/cooldown/radius multipliers are absolute-from-base
   * (latest reached wins); count/pierce additions accumulate.
   */
  private recompute(inst: WeaponInstance): void {
    const def = inst.def;
    let dmgMult = 1;
    let cdMult = 1;
    let radMult = 1;
    let addCount = 0;
    let addPierce = 0;
    for (let lvl = 2; lvl <= inst.level; lvl++) {
      const d = def.levels[lvl - 2];
      if (!d) continue;
      if (d.damageMult !== undefined) dmgMult = d.damageMult;
      if (d.cooldownMult !== undefined) cdMult = d.cooldownMult;
      if (d.radiusMult !== undefined) radMult = d.radiusMult;
      addCount += d.addCount ?? 0;
      addPierce += d.addPierce ?? 0;
    }
    inst.damage = Math.round(def.damage * dmgMult);
    inst.cooldownMs = Math.round(def.cooldownMs * cdMult);
    inst.radius = Math.round((def.radius ?? 0) * radMult);
    inst.pierce = (def.pierce ?? 0) + addPierce;
    inst.count = (def.count ?? 1) + addCount; // projectile bonus added in refreshDerivedStats
  }

  /** Recompute stats affected by global passives (called when passives change). */
  refreshDerivedStats(): void {
    for (const inst of this.owned.values()) {
      this.recompute(inst);
      if (inst.def.type === 'projectile') {
        inst.count += this.ctx.run.projectileBonus;
      }
    }
  }

  // --- Evolutions ---

  /** Recipes the player currently qualifies for (maxed base + required passive owned). */
  getAvailableEvolutions(): EvolutionRecipe[] {
    return EVOLUTIONS.filter(
      (e) =>
        this.isMaxed(e.baseId) &&
        this.ctx.run.hasPassive(e.requiresPassive) &&
        !this.hasWeapon(e.resultId)
    );
  }

  /** Replace a base weapon with its evolved form. */
  evolve(recipe: EvolutionRecipe): void {
    if (!this.owned.has(recipe.baseId)) return;
    // Tear down base weapon visuals before removing it.
    this.owned.delete(recipe.baseId);
    this.destroyOrbit(recipe.baseId);
    this.destroyAura(recipe.baseId);
    this.addWeapon(recipe.resultId);
  }

  update(time: number, delta: number): void {
    const { run } = this.ctx;
    for (const inst of this.owned.values()) {
      switch (inst.def.type) {
        case 'projectile':
          inst.cooldownRemaining -= delta;
          if (inst.cooldownRemaining <= 0) {
            const fired = this.fireProjectile(inst);
            if (fired) inst.cooldownRemaining = inst.cooldownMs * run.cooldownMult;
            else inst.cooldownRemaining = 120; // retry shortly
          }
          break;
        case 'aura':
          inst.cooldownRemaining -= delta;
          if (inst.cooldownRemaining <= 0) {
            inst.cooldownRemaining = inst.cooldownMs * run.cooldownMult;
            this.tickAura(inst);
          }
          break;
        case 'orbit':
          // handled in updateOrbits
          break;
      }
    }
    this.updateAuraVisuals();
    this.updateOrbits(time, delta);
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
    const speed = inst.projectileSpeed * run.projectileSpeedMult;
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spread;
      const proj = this.ctx.getProjectile();
      if (!proj) break;
      proj.fire(player.x, player.y, baseAngle + offset, speed, dmg, inst.pierce, inst.def.textureKey);
    }
    return true;
  }

  // --- Aura weapons ---

  private updateAuraVisuals(): void {
    const { scene, player, run } = this.ctx;
    // Remove sprites for auras no longer owned.
    for (const [id, sprite] of this.auras) {
      if (!this.owned.has(id)) {
        sprite.destroy();
        this.auras.delete(id);
      }
    }
    for (const inst of this.owned.values()) {
      if (inst.def.type !== 'aura') continue;
      let sprite = this.auras.get(inst.def.id);
      if (!sprite) {
        sprite = scene.add
          .image(player.x, player.y, 'aura-field')
          .setDepth(10)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0.5)
          .setTint(AURA_TINT[inst.def.id] ?? 0xffffff);
        this.auras.set(inst.def.id, sprite);
      }
      sprite.setPosition(player.x, player.y);
      // aura-field texture is 128px (radius 64); scale to desired world radius.
      sprite.setScale((inst.radius * run.areaMult) / 64);
    }
  }

  private tickAura(inst: WeaponInstance): void {
    const { player, run } = this.ctx;
    const r = inst.radius * run.areaMult;
    const r2 = r * r;
    const dmg = inst.damage * run.damageMult;
    const children = this.ctx.enemies.getChildren() as Enemy[];
    for (const e of children) {
      if (!e.active) continue;
      if (Phaser.Math.Distance.Squared(player.x, player.y, e.x, e.y) <= r2) {
        this.ctx.damageEnemy(e, dmg, player.x, player.y);
      }
    }
  }

  private destroyAura(id: string): void {
    this.auras.get(id)?.destroy();
    this.auras.delete(id);
  }

  // --- Orbit weapons ---

  private destroyOrbit(id: string): void {
    const arr = this.orbits.get(id);
    if (arr) for (const b of arr) b.destroy();
    this.orbits.delete(id);
    this.orbitAngle.delete(id);
  }

  private updateOrbits(time: number, delta: number): void {
    const { scene, player, run } = this.ctx;
    // Remove orbit groups for weapons no longer owned.
    for (const id of [...this.orbits.keys()]) {
      if (!this.owned.has(id)) this.destroyOrbit(id);
    }
    for (const inst of this.owned.values()) {
      if (inst.def.type !== 'orbit') continue;
      const id = inst.def.id;
      const vis = ORBIT_VIS[id] ?? ORBIT_VIS.blade;
      let arr = this.orbits.get(id);
      if (!arr) {
        arr = [];
        this.orbits.set(id, arr);
        this.orbitAngle.set(id, 0);
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

      let angle = (this.orbitAngle.get(id) ?? 0) + (delta / 1000) * vis.spin;
      this.orbitAngle.set(id, angle);
      const radius = inst.radius * run.areaMult;
      const r2 = vis.hit * vis.hit;
      const dmg = inst.damage * run.damageMult;
      const enemies = this.ctx.enemies.getChildren() as Enemy[];
      const n = arr.length;
      for (let i = 0; i < n; i++) {
        const a = angle + (i / n) * Math.PI * 2;
        const bx = player.x + Math.cos(a) * radius;
        const by = player.y + Math.sin(a) * radius;
        arr[i].setPosition(bx, by).setRotation(a * 2);
        for (const e of enemies) {
          if (!e.active) continue;
          if (Phaser.Math.Distance.Squared(bx, by, e.x, e.y) <= r2) {
            if (time >= e.nextBladeHitAt) {
              e.nextBladeHitAt = time + 350;
              this.ctx.damageEnemy(e, dmg, bx, by);
            }
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
