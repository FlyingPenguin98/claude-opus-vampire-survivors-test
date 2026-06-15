import type { RunState } from '../state/RunState';
import type { UpgradeChoice } from '../types';
import { WEAPONS } from '../data/weapons';
import { PASSIVE_UPGRADES, HEAL_CHOICE } from '../data/upgrades';
import { weightedSample } from '../util/math';
import type { WeaponSystem } from './WeaponSystem';

/** Maximum distinct weapons a player can carry before only level-ups are offered. */
const MAX_WEAPONS = 5;

/**
 * Builds the level-up choice list. Combines: new-weapon offers, level-up offers for
 * owned non-maxed weapons, and passive stat boosts. Always returns up to 3 choices,
 * falling back to a heal so the modal is never empty.
 */
export class UpgradeSystem {
  private run: RunState;
  private weapons: WeaponSystem;

  constructor(run: RunState, weapons: WeaponSystem) {
    this.run = run;
    this.weapons = weapons;
  }

  buildChoices(count = 3): UpgradeChoice[] {
    const pool: UpgradeChoice[] = [];

    // Level-up offers for owned, non-maxed weapons.
    for (const id of this.weapons.ownedIds) {
      if (this.weapons.isMaxed(id)) continue;
      const inst = this.weapons.getInstance(id)!;
      const nextLevel = inst.level + 1;
      pool.push({
        id: `weaponLevel-${id}`,
        name: inst.def.name,
        description: inst.def.levelText[nextLevel - 1] ?? 'Improve this weapon.',
        icon: inst.def.textureKey,
        kind: 'weaponLevel',
        badge: `Lv ${nextLevel}`,
        apply: (_run, weapons) => weapons.levelUpWeapon(id),
      });
    }

    // New-weapon offers (if loadout has room).
    if (this.weapons.weaponCount < MAX_WEAPONS) {
      for (const def of Object.values(WEAPONS)) {
        if (this.weapons.hasWeapon(def.id)) continue;
        pool.push({
          id: `newWeapon-${def.id}`,
          name: def.name,
          description: def.description,
          icon: def.textureKey,
          kind: 'newWeapon',
          badge: 'New!',
          apply: (_run, weapons) => weapons.addWeapon(def.id),
        });
      }
    }

    // Passive boosts (can repeat).
    pool.push(...PASSIVE_UPGRADES);

    const chosen = weightedSample(pool, count, (c) => {
      // Slightly favor new weapons early, level-ups otherwise.
      if (c.kind === 'newWeapon') return 1.3;
      if (c.kind === 'weaponLevel') return 1.1;
      return 1;
    });

    if (chosen.length === 0) chosen.push(HEAL_CHOICE);
    return chosen;
  }

  apply(choice: UpgradeChoice): void {
    choice.apply(this.run, this.weapons);
  }
}
