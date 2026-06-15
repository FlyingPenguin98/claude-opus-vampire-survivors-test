import { PLAYER } from '../config/GameConfig';

/**
 * Mutable per-run state. Holds player vitals, progression, and the global stat
 * multipliers that passive upgrades modify. Created fresh at the start of each run.
 */
export class RunState {
  hp: number = PLAYER.maxHp;
  maxHp: number = PLAYER.maxHp;
  level = 1;
  xp = 0;
  xpToNext = 0; // set by XPSystem
  gold = 0;
  kills = 0;
  elapsed = 0; // seconds survived

  // Passive multipliers (1 = unmodified).
  moveSpeedMult = 1;
  damageMult = 1;
  cooldownMult = 1;
  pickupRadiusMult = 1;
  /** Bonus projectile count added to every projectile weapon. */
  projectileBonus = 0;

  get pickupRadius(): number {
    return PLAYER.basePickupRadius * this.pickupRadiusMult;
  }
}
