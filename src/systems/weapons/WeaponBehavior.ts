import type Phaser from 'phaser';
import type { RunState } from '../../state/RunState';
import type { Player } from '../../entities/Player';
import type { Enemy } from '../../entities/Enemy';
import type { Projectile } from '../../entities/Projectile';
import type { WeaponInstance } from '../../types';
import type { AudioSystem } from '../AudioSystem';

/** Callback GameScene provides so all weapon types route kills through one path. */
export type DamageEnemyFn = (
  enemy: Enemy,
  amount: number,
  fromX?: number,
  fromY?: number,
  element?: string
) => void;

/** Options for an area-of-effect strike. */
export interface AoeOpts {
  element?: string;
  dot?: boolean;
  color?: string;
  /** Knock enemies away from the blast center. */
  knockback?: boolean;
}

/**
 * Everything a weapon behavior needs from the scene. Built once per run in
 * GameScene.create and shared by every WeaponBehavior handler.
 */
export interface WeaponContext {
  scene: Phaser.Scene;
  run: RunState;
  player: Player;
  enemies: Phaser.Physics.Arcade.Group;
  getProjectile: () => Projectile | null;
  damageEnemy: DamageEnemyFn;
  /** Active enemies as a typed array. */
  allEnemies: () => Enemy[];
  /** Nearest active enemy to a point (optionally excluding some, e.g. already-hit). */
  nearestEnemyTo: (x: number, y: number, exclude?: Set<Enemy>) => Enemy | null;
  /** Damage all active enemies within `radius` of (x,y). */
  aoeDamage: (x: number, y: number, radius: number, dmg: number, opts?: AoeOpts) => void;
  cameraShake: (durationMs: number, intensity: number) => void;
  audio: typeof AudioSystem;
}

/**
 * A weapon firing behavior (one per WeaponType). Handlers are instantiated once per
 * WeaponSystem so any pooled visuals they own reset cleanly between runs.
 */
export interface WeaponBehavior {
  /** Called when the weapon is first acquired (create persistent visuals here). */
  onAdd?(inst: WeaponInstance, ctx: WeaponContext): void;
  /** Called every frame for each owned instance of this type. */
  update(inst: WeaponInstance, ctx: WeaponContext, time: number, delta: number): void;
  /** Called when the weapon is removed (e.g. evolved away) — tear down visuals. */
  onRemove?(inst: WeaponInstance, ctx: WeaponContext): void;
}
