import type { RunState } from '../state/RunState';
import type { WeaponSystem } from '../systems/WeaponSystem';

export type EnemyBehavior = 'chase' | 'fast' | 'tank';

export interface EnemyDef {
  id: string;
  /** Texture/animation key prefix registered by the SpriteFactory. */
  textureKey: string;
  hp: number;
  speed: number;
  contactDamage: number;
  xpValue: number;
  /** 0..1 chance to drop a gold coin on death. */
  goldChance: number;
  behavior: EnemyBehavior;
  /** Collision body radius in source-sprite pixels. */
  bodyRadius: number;
}

export type WeaponType = 'projectile' | 'aura' | 'orbit';

export interface WeaponDef {
  id: string;
  name: string;
  type: WeaponType;
  textureKey: string;
  description: string;
  maxLevel: number;
  /** Stats at level 1. Later levels apply deltas from `levelUp`. */
  damage: number;
  cooldownMs: number;
  /** projectile */
  projectileSpeed?: number;
  pierce?: number;
  count?: number;
  /** aura / orbit */
  radius?: number;
  /** Per-level stat description shown in the level-up UI. */
  levelText: string[];
}

/** Runtime instance of a weapon owned by the player. */
export interface WeaponInstance {
  def: WeaponDef;
  level: number;
  damage: number;
  cooldownMs: number;
  cooldownRemaining: number;
  projectileSpeed: number;
  pierce: number;
  count: number;
  radius: number;
}

export type UpgradeKind = 'newWeapon' | 'weaponLevel' | 'passive' | 'heal';

export interface UpgradeChoice {
  id: string;
  name: string;
  description: string;
  /** Texture key used for the choice icon. */
  icon: string;
  kind: UpgradeKind;
  /** Short tag like "New!", "Lv 3", "Passive". */
  badge: string;
  apply: (run: RunState, weapons: WeaponSystem) => void;
}

/** Snapshot of the player's current weapons and passives, for the loadout UI. */
export interface LoadoutView {
  weapons: { name: string; icon: string; level: number; maxLevel: number; description: string }[];
  passives: { name: string; icon: string; count: number }[];
}

export interface WaveDef {
  /** Run time (seconds) at which this wave becomes active. */
  startSec: number;
  enemyIds: string[];
  spawnIntervalMs: number;
  /** Multipliers applied to enemy base stats during this wave. */
  hpMult: number;
  speedMult: number;
  /** Number of enemies spawned per spawn tick. */
  batchSize: number;
}
