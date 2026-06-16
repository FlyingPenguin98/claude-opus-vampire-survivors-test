import type { DifficultyDef } from '../types';

/**
 * Difficulty presets selected on the prepare screen. Multipliers scale enemy HP,
 * the damage they deal, and spawn frequency; Easy also grants more XP, Hard more gold.
 */
export const DIFFICULTIES: Record<string, DifficultyDef> = {
  easy: {
    id: 'easy',
    name: 'Easy',
    blurb: 'Softer enemies, gentler swarms. Great for learning a build.',
    enemyHpMult: 0.75,
    enemyDmgMult: 0.7,
    spawnRateMult: 0.8,
    xpMult: 1.15,
    goldMult: 1.0,
  },
  normal: {
    id: 'normal',
    name: 'Normal',
    blurb: 'The intended challenge.',
    enemyHpMult: 1.0,
    enemyDmgMult: 1.0,
    spawnRateMult: 1.0,
    xpMult: 1.0,
    goldMult: 1.0,
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    blurb: 'Tougher, faster, deadlier — but more gold.',
    enemyHpMult: 1.4,
    enemyDmgMult: 1.35,
    spawnRateMult: 1.25,
    xpMult: 1.0,
    goldMult: 1.25,
  },
};

export const DEFAULT_DIFFICULTY = 'normal';
