import type { RunState } from '../state/RunState';
import type { UpgradeChoice } from '../types';
import { WEAPONS, OFFERABLE_WEAPONS } from '../data/weapons';
import { PASSIVE_UPGRADES, HEAL_CHOICE } from '../data/upgrades';
import { weightedSample } from '../util/math';
import type { WeaponSystem } from './WeaponSystem';

/** Maximum distinct weapons a player can carry before only level-ups are offered. */
const MAX_WEAPONS = 6;

/**
 * Builds the level-up choice list. For each owned, non-maxed weapon it rolls a
 * RANDOM upgrade from that weapon's pool, so the same weapon offers different
 * improvements across level-ups and runs. New-weapon offers are biased toward
 * archetypes (projectile/aura/orbit) the player doesn't already have, so a loadout
 * doesn't end up as, say, four orbit/aura weapons.
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
    const weights = new Map<UpgradeChoice, number>();
    const add = (c: UpgradeChoice, w: number) => {
      pool.push(c);
      weights.set(c, w);
    };

    // Level-up offers: one random upgrade rolled from each owned, non-maxed weapon.
    for (const id of this.weapons.ownedIds) {
      if (this.weapons.isMaxed(id)) continue;
      const inst = this.weapons.getInstance(id)!;
      const available = this.weapons.availableMods(id);
      if (available.length === 0) continue;
      const mod = weightedSample(available, 1, (m) => m.weight ?? 1)[0];
      const nextLevel = inst.level + 1;
      add(
        {
          id: `weaponLevel-${id}-${mod.id}`,
          name: inst.def.name,
          description: mod.text,
          icon: inst.def.textureKey,
          kind: 'weaponLevel',
          badge: `Lv ${nextLevel}`,
          apply: (_run, weapons) => weapons.applyMod(id, mod.id),
        },
        1.1
      );
    }

    // New-weapon offers (if loadout has room), biased toward missing archetypes.
    if (this.weapons.weaponCount < MAX_WEAPONS) {
      const ownedTypes = new Set(this.weapons.ownedIds.map((id) => WEAPONS[id].type));
      for (const def of OFFERABLE_WEAPONS) {
        if (this.weapons.hasWeapon(def.id)) continue;
        const w = ownedTypes.has(def.type) ? 1.1 : 1.9;
        add(
          {
            id: `newWeapon-${def.id}`,
            name: def.name,
            description: def.description,
            icon: def.textureKey,
            kind: 'newWeapon',
            badge: 'New!',
            apply: (_run, weapons) => weapons.addWeapon(def.id),
          },
          w
        );
      }
    }

    // Passive boosts (can repeat).
    for (const p of PASSIVE_UPGRADES) add(p, 1);

    const chosen = weightedSample(pool, count, (c) => weights.get(c) ?? 1);
    if (chosen.length === 0) chosen.push(HEAL_CHOICE);
    return chosen;
  }

  apply(choice: UpgradeChoice): void {
    choice.apply(this.run, this.weapons);
  }
}
