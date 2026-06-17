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

  // Chain Lightning: a blocky yellow bolt.
  const ch = new PixelCanvas(scene, 'icon-chain', 16, 16, 1);
  const Y = '#ffe23a';
  const YH = '#fff7c0';
  ch.rect(8, 2, 3, 3, Y);
  ch.rect(6, 5, 3, 3, Y);
  ch.rect(8, 7, 3, 3, Y);
  ch.rect(5, 9, 3, 4, Y);
  ch.px(9, 3, YH);
  ch.px(7, 6, YH);
  ch.px(6, 10, YH);
  ch.outline('#5a3a07');
  ch.commit(scene);

  // Beam: a bright ray with an emitter.
  const be = new PixelCanvas(scene, 'icon-beam', 16, 16, 1);
  be.rect(2, 7, 11, 2, '#9ff0ff');
  be.rect(2, 7, 11, 1, '#ffffff');
  be.rect(11, 5, 3, 6, '#cfd6e6');
  be.px(14, 7, '#ffffff');
  be.px(14, 8, '#ffffff');
  be.outline('#1f6fb0');
  be.commit(scene);

  // Nova: concentric cyan rings.
  const nv = new PixelCanvas(scene, 'icon-nova', 16, 16, 1);
  ringPixels(nv, 8, 8, 6, '#6ad8ff');
  ringPixels(nv, 8, 8, 3, '#bfe8ff');
  nv.px(8, 8, '#ffffff');
  nv.outline('#0b2b4a');
  nv.commit(scene);

  // Singularity: a dark core with a violet rim.
  const sg = new PixelCanvas(scene, 'icon-singularity', 16, 16, 1);
  diskPixels(sg, 8, 8, 6, '#c060ff');
  diskPixels(sg, 8, 8, 4, '#2a0a3a');
  sg.px(10, 6, '#e6b0ff');
  sg.outline('#1a0026');
  sg.commit(scene);

  // Turret: a little cannon.
  const tu = new PixelCanvas(scene, 'icon-turret', 16, 16, 1);
  tu.rect(4, 10, 8, 4, '#7a7a8a'); // base
  tu.rect(4, 10, 8, 1, '#aab0c4');
  tu.rect(6, 5, 4, 5, '#9aa0b4'); // body
  tu.rect(9, 6, 5, 2, '#5a5a66'); // barrel
  tu.px(14, 6, '#ffd23a');
  tu.outline('#21161f');
  tu.commit(scene);

  // Companion: a small familiar (orb with ears + eyes).
  const pe = new PixelCanvas(scene, 'icon-pet', 16, 16, 1);
  pe.rect(5, 6, 6, 6, '#6b3fc0');
  pe.rect(5, 6, 6, 1, '#a87af0');
  pe.px(5, 4, '#6b3fc0'); // ears
  pe.px(10, 4, '#6b3fc0');
  pe.px(5, 5, '#6b3fc0');
  pe.px(10, 5, '#6b3fc0');
  pe.px(6, 8, '#ffffff');
  pe.px(9, 8, '#ffffff');
  pe.outline('#1a0a26');
  pe.commit(scene);

  // Storm: a cloud with a bolt beneath.
  const st = new PixelCanvas(scene, 'icon-storm', 16, 16, 1);
  st.rect(3, 3, 10, 4, '#8a90a4');
  st.rect(3, 3, 10, 1, '#cfd6e6');
  st.rect(5, 7, 2, 3, '#ffe23a');
  st.rect(7, 9, 2, 3, '#ffe23a');
  st.rect(9, 7, 2, 3, '#ffe23a');
  st.outline('#21161f');
  st.commit(scene);

  // Keen Edge (crit): a targeting reticle — distinct from the Throwing Knives sprite.
  const cr = new PixelCanvas(scene, 'icon-crit', 16, 16, 1);
  ringPixels(cr, 8, 8, 6, '#f2c14e'); // gold ring
  // red crosshair ticks
  cr.px(8, 1, '#ff5a5a'); cr.px(8, 2, '#ff5a5a');
  cr.px(8, 13, '#ff5a5a'); cr.px(8, 14, '#ff5a5a');
  cr.px(1, 8, '#ff5a5a'); cr.px(2, 8, '#ff5a5a');
  cr.px(13, 8, '#ff5a5a'); cr.px(14, 8, '#ff5a5a');
  cr.px(8, 8, '#ff5a5a'); // center dot
  cr.outline('#3a1010');
  cr.commit(scene);
}

/** Plot a 1px-thick ring of palette colour on a PixelCanvas. */
function ringPixels(pc: PixelCanvas, cx: number, cy: number, r: number, color: string): void {
  for (let a = 0; a < 360; a += 12) {
    const x = Math.round(cx + Math.cos((a * Math.PI) / 180) * r);
    const y = Math.round(cy + Math.sin((a * Math.PI) / 180) * r);
    pc.px(x, y, color);
  }
}

/** Fill a disk of palette colour on a PixelCanvas. */
function diskPixels(pc: PixelCanvas, cx: number, cy: number, r: number, color: string): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) pc.px(cx + x, cy + y, color);
    }
  }
}
