import type { RunState } from '../state/RunState';
import type { WeaponSystem } from '../systems/WeaponSystem';
import type { MetaData } from '../state/MetaState';

export type EnemyBehavior =
  | 'chase'
  | 'fast'
  | 'tank'
  | 'charger'
  | 'splitter'
  | 'shooter'
  | 'orbiter';

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
  /** Display scale multiplier (1 = normal enemy size). Elites/bosses are larger. */
  scale?: number;
  /** Resistance to knockback, 0 (full) .. 1 (immune). */
  knockbackResist?: number;
  /** charger: ms between dashes, and dash speed. */
  chargeIntervalMs?: number;
  chargeSpeed?: number;
  /** splitter: enemy id spawned on death, and how many. */
  splitInto?: string;
  splitCount?: number;
  /** shooter: ms between shots, projectile speed + damage, preferred standoff range. */
  shootIntervalMs?: number;
  shotSpeed?: number;
  shotDamage?: number;
  standoff?: number;
  /** Marks bosses (health bar, rewards). */
  boss?: boolean;
  /** Display name (bosses show it on the health bar). */
  name?: string;
  /** 0..1 chance to drop a treasure chest on death (elites/bosses). */
  chestChance?: number;
}

export type WeaponType = 'projectile' | 'aura' | 'orbit';

/** Per-level stat changes for a weapon, applied relative to the base def values. */
export interface WeaponLevelDelta {
  /** Multiply BASE damage by this factor at/after this level. */
  damageMult?: number;
  /** Multiply BASE cooldown by this factor. */
  cooldownMult?: number;
  /** Multiply BASE radius by this factor. */
  radiusMult?: number;
  /** Add this many projectiles/blades (accumulates across levels). */
  addCount?: number;
  /** Add this much pierce (accumulates across levels). */
  addPierce?: number;
  /** Card text describing this level. */
  text: string;
}

export interface WeaponDef {
  id: string;
  name: string;
  type: WeaponType;
  textureKey: string;
  description: string;
  maxLevel: number;
  /** Stats at level 1. Later levels apply deltas from `levels`. */
  damage: number;
  cooldownMs: number;
  /** projectile */
  projectileSpeed?: number;
  pierce?: number;
  count?: number;
  /** aura / orbit */
  radius?: number;
  /** Per-level deltas; index 0 = level 2, index 1 = level 3, ... */
  levels: WeaponLevelDelta[];
  /** Evolution: weapon id this becomes when evolved. */
  evolvesInto?: string;
  /** Evolution: passive id that must be owned to evolve. */
  requiresPassive?: string;
  /** Marks this def as an evolved form (excluded from normal upgrade offers). */
  evolvedFrom?: string;
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

export type UpgradeKind = 'newWeapon' | 'weaponLevel' | 'passive' | 'heal' | 'evolution';

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

/** A playable character: a sprite + starting weapon + stat modifiers. */
export interface CharacterDef {
  id: string;
  name: string;
  blurb: string;
  /** Texture/anim key prefix (e.g. 'player', 'player-mage'). */
  spriteKey: string;
  startingWeapon: string;
  /** Stat modifiers applied to RunState at run start. */
  mods: {
    maxHpAdd?: number;
    moveSpeedMult?: number;
    damageMult?: number;
    cooldownMult?: number;
    pickupRadiusMult?: number;
    armor?: number;
    critChance?: number;
    projectileBonus?: number;
  };
  /** Achievement/unlock id required to play this character (undefined = always available). */
  unlockId?: string;
}

/** A selectable stage: background, enemy mix, wave schedule, and boss timeline. */
export interface StageDef {
  id: string;
  name: string;
  blurb: string;
  /** Background tile texture key. */
  tileKey: string;
  /** Ambient tint applied over the world (0xRRGGBB) and its alpha. */
  tint: number;
  tintAlpha: number;
  waves: WaveDef[];
  /** Bosses spawned at the given elapsed times. */
  bossSchedule: { timeSec: number; bossId: string }[];
  /** Run length; surviving to it triggers victory. */
  durationSec: number;
  unlockId?: string;
}

/** A permanent, gold-purchased meta upgrade. */
export interface PowerupDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  /** Gold cost to buy the next level (given the current level). */
  cost: (level: number) => number;
  /** Apply the owned level's effect to a fresh RunState at run start. */
  apply: (run: RunState, level: number) => void;
}

/** Run results handed to achievement checks. */
export interface RunSummary {
  timeSec: number;
  kills: number;
  gold: number;
  level: number;
  stageId: string;
  characterId: string;
  bossKills: number;
  victory: boolean;
}

/** An achievement that, when its condition is met, can unlock content. */
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  /** Returns true if this run satisfies the achievement. */
  check: (s: RunSummary, meta: MetaData) => boolean;
  /** Ids unlocked when earned (character/stage ids). */
  unlocks?: string[];
}

/** Everything a run needs: who, where, and the persistent meta to apply. */
export interface RunConfig {
  character: CharacterDef;
  stage: StageDef;
  meta: MetaData;
}
