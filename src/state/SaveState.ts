/**
 * Mid-run save/resume. Persists a compact snapshot of an in-progress run to
 * localStorage so a backgrounded or closed session can be continued from the
 * title. Live enemies/projectiles/gems are NOT saved — on resume the player,
 * loadout, progression and timeline are restored and waves spawn fresh.
 */
const KEY = 'nightfall-run-v1';

export interface RunSnapshot {
  version: 1;
  characterId: string;
  stageId: string;
  difficultyId: string;
  elapsed: number;
  musicTrack: string;
  bossesFired: number[];
  run: {
    hp: number;
    maxHp: number;
    level: number;
    xp: number;
    xpToNext: number;
    gold: number;
    kills: number;
    bossKills: number;
    moveSpeedMult: number;
    damageMult: number;
    cooldownMult: number;
    pickupRadiusMult: number;
    areaMult: number;
    projectileSpeedMult: number;
    projectileBonus: number;
    armor: number;
    critChance: number;
    critMult: number;
    xpMult: number;
    regenPerSec: number;
    luck: number;
    goldMult: number;
    revives: number;
  };
  passives: { id: string; name: string; icon: string; count: number }[];
  weapons: { id: string; taken: string[] }[];
}

export const SaveState = {
  save(snap: RunSnapshot): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(snap));
    } catch {
      /* storage unavailable — ignore */
    }
  },

  load(): RunSnapshot | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const snap = JSON.parse(raw) as RunSnapshot;
      return snap && snap.version === 1 ? snap : null;
    } catch {
      return null;
    }
  },

  has(): boolean {
    return this.load() !== null;
  },

  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
