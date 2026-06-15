import { PLAYER } from '../config/GameConfig';

/**
 * Mutable per-run state. Holds player vitals, progression, and the global stat
 * multipliers that passive upgrades, characters, and meta powerups modify.
 * Created fresh at the start of each run.
 */
export class RunState {
  hp: number = PLAYER.maxHp;
  maxHp: number = PLAYER.maxHp;
  level = 1;
  xp = 0;
  xpToNext = 0; // set by XPSystem
  gold = 0;
  kills = 0;
  bossKills = 0;
  elapsed = 0; // seconds survived

  // Passive multipliers (1 = unmodified).
  moveSpeedMult = 1;
  damageMult = 1;
  cooldownMult = 1;
  pickupRadiusMult = 1;
  /** Scales aura/orbit radius and area weapons. */
  areaMult = 1;
  /** Scales projectile travel speed. */
  projectileSpeedMult = 1;
  /** Bonus projectile count added to every projectile weapon. */
  projectileBonus = 0;

  // Defensive / utility stats.
  /** Flat damage reduction subtracted from each hit (min 1 damage still applies). */
  armor = 0;
  /** Chance (0..1) for a hit to deal critMult damage. */
  critChance = 0;
  critMult = 2;
  /** Multiplier on XP gained from gems. */
  xpMult = 1;
  /** HP regenerated per second. */
  regenPerSec = 0;
  /** Extra multiplier on gold/chest drop chances. */
  luck = 1;
  /** Number of times the player can cheat death this run. */
  revives = 0;

  /** Acquired passive upgrades, keyed by id, for the loadout display. */
  passives = new Map<string, { name: string; icon: string; count: number }>();

  get pickupRadius(): number {
    return PLAYER.basePickupRadius * this.pickupRadiusMult;
  }

  /** True if the player has acquired the given passive at least once. */
  hasPassive(id: string): boolean {
    return this.passives.has(id);
  }
}
