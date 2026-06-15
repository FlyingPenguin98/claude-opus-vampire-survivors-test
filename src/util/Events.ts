/** Typed event names emitted on the GameScene's event emitter and consumed by the UI. */
export const EVENTS = {
  HP_CHANGED: 'hp-changed',
  XP_CHANGED: 'xp-changed',
  LEVEL_UP: 'level-up',
  TIMER: 'timer',
  GOLD_CHANGED: 'gold-changed',
  KILLS_CHANGED: 'kills-changed',
  BOSS_SPAWNED: 'boss-spawned',
  BOSS_DIED: 'boss-died',
  PLAYER_DIED: 'player-died',
} as const;
