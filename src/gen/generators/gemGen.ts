import Phaser from 'phaser';
import { PixelCanvas } from '../PixelCanvas';

/** XP gems: faceted diamonds in three tiers, each with a 2-frame sparkle. */
interface GemSpec {
  key: string;
  outline: string;
  dark: string;
  base: string;
  light: string;
  size: number;
}

const GEMS: GemSpec[] = [
  { key: 'gem-blue', outline: '#0b2b4a', dark: '#1f6fb0', base: '#3fa0e0', light: '#bfe8ff', size: 8 },
  { key: 'gem-green', outline: '#0b3a1e', dark: '#1f9a4a', base: '#46d873', light: '#c8ffd8', size: 10 },
  { key: 'gem-gold', outline: '#5a3a07', dark: '#c79318', base: '#ffcf3a', light: '#fff3bf', size: 12 },
];

export function generateGems(scene: Phaser.Scene): void {
  for (const g of GEMS) {
    const s = g.size;
    const pc = new PixelCanvas(scene, g.key, s, s, 2);
    const c = (s - 1) / 2;
    for (let f = 0; f < 2; f++) {
      pc.frame(f);
      // Diamond: width grows toward the vertical center.
      for (let y = 0; y < s; y++) {
        const half = Math.round((s / 2) * (1 - Math.abs(y - c) / (s / 2)));
        for (let x = -half; x <= half; x++) {
          const px = Math.round(c) + x;
          // Left side darker, right side lighter -> faceted look.
          const color = x < -half / 2 ? g.dark : x > half / 2 ? g.light : g.base;
          pc.px(px, y, color);
        }
      }
      // sparkle glint flips position between frames
      if (f === 0) pc.px(Math.round(c) - 1, Math.round(c) - 1, '#ffffff');
      else pc.px(Math.round(c) + 1, Math.round(c), '#ffffff');
      pc.outline(g.outline);
    }
    pc.commit(scene);
    scene.anims.create({
      key: `${g.key}-sparkle`,
      frames: scene.anims.generateFrameNumbers(g.key, { frames: [0, 1] }),
      frameRate: 3,
      repeat: -1,
    });
  }

  // Gold coin pickup.
  const coin = new PixelCanvas(scene, 'coin', 8, 8, 1);
  coin.rect(2, 1, 4, 6, '#ffcf3a');
  coin.rect(2, 1, 4, 1, '#fff3bf');
  coin.rect(3, 3, 2, 2, '#c79318');
  coin.outline('#5a3a07');
  coin.commit(scene);
}
