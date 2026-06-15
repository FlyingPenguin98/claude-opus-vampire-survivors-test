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

  // Sacred flame icon for the Sacred Flame aura.
  const fl = new PixelCanvas(scene, 'icon-flame', 16, 16, 1);
  const FOUT = '#5a1a06';
  const FDARK = '#c4431a';
  const FMID = '#ff8a3a';
  const FLITE = '#ffe08a';
  // Teardrop flame body.
  fl.rect(6, 9, 4, 5, FDARK);
  fl.rect(5, 10, 6, 3, FDARK);
  fl.rect(6, 6, 4, 4, FMID);
  fl.rect(7, 3, 2, 4, FMID);
  fl.px(7, 2, FMID);
  fl.rect(7, 10, 2, 3, FLITE);
  fl.px(8, 7, FLITE);
  fl.outline(FOUT);
  fl.commit(scene);

  // Venom droplet/skull icon for the Venom Cloud aura.
  const vn = new PixelCanvas(scene, 'icon-venom', 16, 16, 1);
  const VOUT = '#0b2e10';
  const VDARK = '#1f6b2a';
  const VMID = '#2a9a3a';
  const VLITE = '#9aff5a';
  // Droplet.
  vn.rect(6, 7, 4, 6, VMID);
  vn.rect(5, 9, 6, 3, VMID);
  vn.rect(7, 3, 2, 4, VMID);
  vn.px(7, 2, VMID);
  vn.rect(6, 7, 4, 1, VLITE);
  vn.px(7, 10, VLITE);
  // Toxic shadow.
  vn.rect(5, 12, 6, 1, VDARK);
  vn.px(7, 9, VOUT); // little hollow
  vn.outline(VOUT);
  vn.commit(scene);
}
