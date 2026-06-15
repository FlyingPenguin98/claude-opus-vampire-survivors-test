import Phaser from 'phaser';
import { PixelCanvas } from '../PixelCanvas';

/**
 * A 32x32 grass tile that reads well when repeated across the world as a TileSprite.
 * A fixed seed keeps the scatter deterministic so seams stay subtle.
 */
export function generateTiles(scene: Phaser.Scene): void {
  const rng = new Phaser.Math.RandomDataGenerator(['nightfall-grass']);
  const size = 32;
  const pc = new PixelCanvas(scene, 'grass', size, size, 1);

  // Base fill with two subtly different greens in a checker dither.
  const baseA = '#2f5d34';
  const baseB = '#2a5430';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      pc.px(x, y, (x + y) % 2 === 0 ? baseA : baseB);
    }
  }

  // Darker soil patches.
  const patches = 3;
  for (let i = 0; i < patches; i++) {
    const px = rng.between(2, size - 6);
    const py = rng.between(2, size - 6);
    const w = rng.between(2, 4);
    const h = rng.between(2, 3);
    pc.rect(px, py, w, h, '#244a29');
  }

  // Grass blades: short vertical highlights.
  const blades = 40;
  for (let i = 0; i < blades; i++) {
    const x = rng.between(0, size - 1);
    const y = rng.between(1, size - 2);
    const light = rng.frac() > 0.5 ? '#3c7a40' : '#458a48';
    pc.px(x, y, light);
    if (rng.frac() > 0.6) pc.px(x, y - 1, light);
  }

  // A few tiny flowers for the JRPG meadow charm.
  const flowers = 4;
  for (let i = 0; i < flowers; i++) {
    const x = rng.between(2, size - 3);
    const y = rng.between(2, size - 3);
    const petal = rng.pick(['#e8d24a', '#e07ab0', '#dcdce6']);
    pc.px(x, y, petal);
    pc.px(x + 1, y, '#c0a838');
  }

  pc.commit(scene);

  // Soft circular vignette/shadow blob placed under entities for grounding.
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let i = 8; i > 0; i--) {
    g.fillStyle(0x000000, 0.06);
    g.fillCircle(8, 8, i);
  }
  g.generateTexture('shadow', 16, 16);
  g.destroy();

  // 1x1 white pixel for HUD bars / flashes.
  const w = scene.make.graphics({ x: 0, y: 0 }, false);
  w.fillStyle(0xffffff, 1);
  w.fillRect(0, 0, 1, 1);
  w.generateTexture('px', 1, 1);
  w.destroy();
}
