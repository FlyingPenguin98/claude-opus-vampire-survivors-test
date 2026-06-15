import { XP } from '../config/GameConfig';
import type { RunState } from '../state/RunState';

/**
 * Tracks experience and levels using a smooth exponential curve. Pure logic; the
 * GameScene reads the returned level-up count and emits events / opens the modal.
 */
export class XPSystem {
  private run: RunState;

  constructor(run: RunState) {
    this.run = run;
    this.run.xpToNext = this.xpForLevel(run.level);
  }

  /** XP required to advance FROM the given level to the next. */
  xpForLevel(level: number): number {
    return Math.round(XP.base * Math.pow(XP.growth, level - 1));
  }

  /** Add XP; returns how many levels were gained (0 if none). */
  addXP(amount: number): number {
    const run = this.run;
    run.xp += amount;
    let gained = 0;
    while (run.xp >= run.xpToNext) {
      run.xp -= run.xpToNext;
      run.level += 1;
      run.xpToNext = this.xpForLevel(run.level);
      gained += 1;
    }
    return gained;
  }

  get progress(): number {
    return this.run.xpToNext > 0 ? this.run.xp / this.run.xpToNext : 0;
  }
}
