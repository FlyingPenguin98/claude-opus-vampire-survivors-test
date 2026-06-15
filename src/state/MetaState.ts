/** Persistent meta-progression stored in localStorage. Currently just lifetime gold. */
const KEY = 'nightfall-meta-v1';

interface MetaData {
  totalGold: number;
  bestTimeSec: number;
  runs: number;
}

function load(): MetaData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { totalGold: 0, bestTimeSec: 0, runs: 0, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt/unavailable storage */
  }
  return { totalGold: 0, bestTimeSec: 0, runs: 0 };
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

  /** Commit the results of a finished run. */
  recordRun(goldEarned: number, timeSec: number): MetaData {
    const data = load();
    data.totalGold += goldEarned;
    data.runs += 1;
    if (timeSec > data.bestTimeSec) data.bestTimeSec = timeSec;
    save(data);
    return data;
  },
};
