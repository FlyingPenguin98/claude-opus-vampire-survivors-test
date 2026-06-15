import Phaser from 'phaser';

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Pick a random element from an array (uses Phaser's global RNG). */
export function pickOne<T>(arr: T[]): T {
  return arr[Phaser.Math.Between(0, arr.length - 1)];
}

/**
 * Sample up to `n` distinct elements from `arr` using weights (defaults to 1).
 * Used by the upgrade system to choose 3-of-N cards.
 */
export function weightedSample<T>(
  items: T[],
  n: number,
  weightOf: (item: T) => number = () => 1
): T[] {
  const pool = items.slice();
  const result: T[] = [];
  while (result.length < n && pool.length > 0) {
    const total = pool.reduce((s, it) => s + Math.max(0, weightOf(it)), 0);
    if (total <= 0) break;
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= Math.max(0, weightOf(pool[i]));
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}
