import Phaser from 'phaser';
import { PixelCanvas } from '../PixelCanvas';

/**
 * Small, crisp UI icons for weapons whose in-world visual is too large to double as
 * an upgrade-card icon (e.g. the Frost Aura field). Drawn at 16x16 so they sit
 * neatly inside the level-up cards.
 */
export function generateIcons(scene: Phaser.Scene): void {
  // Frost crystal / snowflake for the Frost Aura.
  const f = new PixelCanvas(scene, 'icon-frost', 16, 16, 1);
  const OUT = '#0b2b4a';
  const DARK = '#1f6fb0';
  const MID = '#3fb6e6';
  const LITE = '#bff0ff';
  const c = 8;

  // Six-spoke snowflake: vertical, horizontal, two diagonals.
  for (let i = 2; i <= 13; i++) {
    f.px(c, i, MID); // vertical
    f.px(i, c, MID); // horizontal
  }
  for (let i = -5; i <= 5; i++) {
    f.px(c + i, c + i, DARK); // diagonal "\"
    f.px(c + i, c - i, DARK); // diagonal "/"
  }
  // Little branch tips for the snowflake look.
  const tips: Array<[number, number]> = [
    [c, 3], [c, 13], [3, c], [13, c],
  ];
  for (const [x, y] of tips) {
    f.px(x - 1, y, LITE);
    f.px(x + 1, y, LITE);
    f.px(x, y - 1, LITE);
    f.px(x, y + 1, LITE);
  }
  // Bright core.
  f.px(c, c, LITE);
  f.px(c - 1, c, LITE);
  f.px(c, c - 1, LITE);
  f.outline(OUT);
  f.commit(scene);
}
