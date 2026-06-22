import type { WeaponDef, WeaponInstance, WeaponMod, WeaponType } from '../types';
import { WEAPONS, EVOLUTIONS, type EvolutionRecipe } from '../data/weapons';
import type { WeaponBehavior, WeaponContext } from './weapons/WeaponBehavior';
import { ProjectileBehavior } from './weapons/projectile';
import { AuraBehavior } from './weapons/aura';
import { OrbitBehavior } from './weapons/orbit';
import { BoomerangBehavior } from './weapons/boomerang';
import { ChainBehavior } from './weapons/chain';
import { NovaBehavior } from './weapons/nova';
import { StormBehavior } from './weapons/storm';
import { BeamBehavior } from './weapons/beam';
import { TurretBehavior } from './weapons/turret';
import { CompanionBehavior } from './weapons/companion';
import { SingularityBehavior } from './weapons/singularity';

export type { WeaponContext, DamageEnemyFn } from './weapons/WeaponBehavior';

/**
 * Owns the player's active weapons and drives them. Each WeaponType is implemented by
 * a WeaponBehavior in ./weapons/, looked up from a registry — so adding a new weapon
 * behavior is a new handler file + registry entry, with no changes to this class.
 */
export class WeaponSystem {
  private ctx: WeaponContext;
  private owned = new Map<string, WeaponInstance>();
  private registry: Record<WeaponType, WeaponBehavior>;

  constructor(ctx: WeaponContext) {
    this.ctx = ctx;
    // Handlers are per-WeaponSystem so any pooled visuals reset between runs.
    this.registry = {
      projectile: new ProjectileBehavior(),
      aura: new AuraBehavior(),
      orbit: new OrbitBehavior(),
      boomerang: new BoomerangBehavior(),
      chain: new ChainBehavior(),
      nova: new NovaBehavior(),
      storm: new StormBehavior(),
      beam: new BeamBehavior(),
      turret: new TurretBehavior(),
      companion: new CompanionBehavior(),
      singularity: new SingularityBehavior(),
    };
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
    if (this.owned.has(id)) return; // owned weapons are improved via applyMod
    const def = WEAPONS[id];
    const inst: WeaponInstance = {
      def,
      level: 1,
      taken: [],
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
    this.registry[def.type].onAdd?.(inst, this.ctx);
  }

  /** Mods this weapon can still be offered (repeatable, or not yet taken). */
  availableMods(id: string): WeaponMod[] {
    const inst = this.owned.get(id);
    if (!inst) return [];
    return inst.def.mods.filter((m) => m.repeatable || !inst.taken.includes(m.id));
  }

  /** Apply a specific upgrade chosen from the weapon's pool. */
  applyMod(id: string, modId: string): void {
    const inst = this.owned.get(id);
    if (!inst || inst.level >= inst.def.maxLevel) return;
    inst.taken.push(modId);
    inst.level = inst.taken.length + 1;
    this.recompute(inst);
    this.refreshDerivedStats();
  }

  /** Recompute an instance's stats from base by applying each taken upgrade in order. */
  private recompute(inst: WeaponInstance): void {
    const def = inst.def;
    let damage = def.damage;
    let cooldown = def.cooldownMs;
    let radius = def.radius ?? 0;
    let speed = def.projectileSpeed ?? 0;
    let count = def.count ?? 1;
    let pierce = def.pierce ?? 0;
    let tint: number | undefined;
    let element: string | undefined;
    for (const modId of inst.taken) {
      const m = def.mods.find((x) => x.id === modId);
      if (!m) continue;
      if (m.dmgMul) damage *= m.dmgMul;
      if (m.cdMul) cooldown *= m.cdMul;
      if (m.radiusMul) radius *= m.radiusMul;
      if (m.speedMul) speed *= m.speedMul;
      if (m.addCount) count += m.addCount;
      if (m.addPierce) pierce += m.addPierce;
      if (m.tint !== undefined) tint = m.tint;
      if (m.element !== undefined) element = m.element;
    }
    inst.damage = Math.round(damage);
    inst.cooldownMs = Math.round(cooldown);
    inst.radius = Math.round(radius);
    inst.projectileSpeed = Math.round(speed);
    inst.pierce = pierce;
    inst.count = count; // projectile bonus added in refreshDerivedStats
    inst.tint = tint;
    inst.element = element;
  }

  /** Recompute stats affected by global passives (called when passives change). */
  refreshDerivedStats(): void {
    for (const inst of this.owned.values()) {
      this.recompute(inst);
      // Multishot passive adds projectiles to projectile-like weapons.
      if (inst.def.type === 'projectile' || inst.def.type === 'boomerang') {
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
    const oldInst = this.owned.get(recipe.baseId);
    if (!oldInst) return;
    this.registry[oldInst.def.type].onRemove?.(oldInst, this.ctx);
    this.owned.delete(recipe.baseId);
    this.addWeapon(recipe.resultId);
  }

  update(time: number, delta: number): void {
    for (const inst of this.owned.values()) {
      this.registry[inst.def.type].update(inst, this.ctx, time, delta);
    }
  }

  /** For UI: a readable summary of owned weapons and levels. */
  describeLoadout(): { def: WeaponDef; level: number }[] {
    return [...this.owned.values()].map((i) => ({ def: i.def, level: i.level }));
  }

  /** For save/resume: each owned weapon's id and the upgrades it has taken. */
  getOwned(): { id: string; taken: string[] }[] {
    return [...this.owned.values()].map((i) => ({ id: i.def.id, taken: [...i.taken] }));
  }
}
