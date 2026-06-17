import type { RunSummary } from '../types';
import { ACHIEVEMENTS } from '../data/achievements';

/**
 * Persistent meta-progression in localStorage. v2 adds spendable gold, purchased
 * powerups, content unlocks, earned achievements, and audio/display settings.
 * Migrates forward from the v1 blob (lifetime gold seeds spendable gold).
 */
const KEY = 'nightfall-meta-v2';
const KEY_V1 = 'nightfall-meta-v1';

export interface MetaSettings {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
  showDamage: boolean;
  /** Tone down screen shake / camera motion for comfort & photosensitivity. */
  reducedMotion: boolean;
  /** Vibration feedback on mobile. */
  haptics: boolean;
  /** Last-selected difficulty id, remembered on the prepare screen. */
  lastDifficulty?: string;
}

export interface MetaData {
  version: 2;
  totalGold: number;
  bestTimeSec: number;
  runs: number;
  spendableGold: number;
  powerups: Record<string, number>;
  unlocked: string[];
  achievements: string[];
  settings: MetaSettings;
  bestPerStage: Record<string, number>;
}

function defaults(): MetaData {
  return {
    version: 2,
    totalGold: 0,
    bestTimeSec: 0,
    runs: 0,
    spendableGold: 0,
    powerups: {},
    unlocked: [],
    achievements: [],
    settings: { master: 0.7, music: 0.45, sfx: 0.7, muted: false, showDamage: true, reducedMotion: false, haptics: true, lastDifficulty: 'normal' },
    bestPerStage: {},
  };
}

function load(): MetaData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const d = defaults();
      return {
        ...d,
        ...parsed,
        settings: { ...d.settings, ...(parsed.settings ?? {}) },
        powerups: { ...(parsed.powerups ?? {}) },
        bestPerStage: { ...(parsed.bestPerStage ?? {}) },
        unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : [],
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      };
    }
    // Migrate from v1 if present.
    const v1raw = localStorage.getItem(KEY_V1);
    if (v1raw) {
      const v1 = JSON.parse(v1raw);
      const d = defaults();
      d.totalGold = v1.totalGold ?? 0;
      d.bestTimeSec = v1.bestTimeSec ?? 0;
      d.runs = v1.runs ?? 0;
      d.spendableGold = v1.totalGold ?? 0; // seed currency for returning players
      save(d);
      return d;
    }
  } catch {
    /* corrupt/unavailable storage: fall through to defaults */
  }
  return defaults();
}

function save(data: MetaData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage may be unavailable (private mode); ignore */
  }
}

export const MetaState = {
  get(): MetaData {
    return load();
  },

  save,

  /** Wipe all saved progress (returns fresh defaults). */
  reset(): MetaData {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(KEY_V1);
    } catch {
      /* ignore */
    }
    return defaults();
  },

  isUnlocked(id: string): boolean {
    return load().unlocked.includes(id);
  },

  /** Persist a settings change and return the updated meta. */
  setSettings(patch: Partial<MetaSettings>): MetaData {
    const data = load();
    data.settings = { ...data.settings, ...patch };
    save(data);
    return data;
  },

  /** Attempt to buy/level a powerup. Returns updated meta (no-op if unaffordable). */
  purchasePowerup(id: string, cost: number, maxLevel: number): MetaData {
    const data = load();
    const lvl = data.powerups[id] ?? 0;
    if (lvl >= maxLevel || data.spendableGold < cost) return data;
    data.spendableGold -= cost;
    data.powerups[id] = lvl + 1;
    save(data);
    return data;
  },

  /**
   * Commit a finished run: credit gold, update bests, and evaluate achievements.
   * Returns the updated meta plus the ids of any newly-unlocked content.
   */
  processRun(summary: RunSummary): { meta: MetaData; newlyUnlocked: string[] } {
    const data = load();
    data.totalGold += summary.gold;
    data.spendableGold += summary.gold;
    data.runs += 1;
    if (summary.timeSec > data.bestTimeSec) data.bestTimeSec = summary.timeSec;
    const prevStageBest = data.bestPerStage[summary.stageId] ?? 0;
    if (summary.timeSec > prevStageBest) data.bestPerStage[summary.stageId] = summary.timeSec;

    const newlyUnlocked: string[] = [];
    for (const ach of ACHIEVEMENTS) {
      if (data.achievements.includes(ach.id)) continue;
      if (ach.check(summary, data)) {
        data.achievements.push(ach.id);
        for (const u of ach.unlocks ?? []) {
          if (!data.unlocked.includes(u)) {
            data.unlocked.push(u);
            newlyUnlocked.push(u);
          }
        }
      }
    }
    save(data);
    return { meta: data, newlyUnlocked };
  },
};
