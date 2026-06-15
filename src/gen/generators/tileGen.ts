import Phaser from 'phaser';
import { PixelCanvas } from '../PixelCanvas';

interface TileSpec {
  key: string;
  seed: string;
  baseA: string;
  baseB: string;
  patch: string;
  speckA: string;
  speckB: string;
  accents: string[];
}

/**
 * A 32x32 ground tile that repeats well as a world TileSprite. A fixed seed keeps
 * the scatter deterministic so seams stay subtle. One generator, many biomes.
 */
function makeTile(scene: Phaser.Scene, spec: TileSpec): void {
  const rng = new Phaser.Math.RandomDataGenerator([spec.seed]);
  const size = 32;
  const pc = new PixelCanvas(scene, spec.key, size, size, 1);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      pc.px(x, y, (x + y) % 2 === 0 ? spec.baseA : spec.baseB);
    }
  }
  for (let i = 0; i < 3; i++) {
    const px = rng.between(2, size - 6);
    const py = rng.between(2, size - 6);
    pc.rect(px, py, rng.between(2, 4), rng.between(2, 3), spec.patch);
  }
  for (let i = 0; i < 40; i++) {
    const x = rng.between(0, size - 1);
    const y = rng.between(1, size - 2);
    const c = rng.frac() > 0.5 ? spec.speckA : spec.speckB;
    pc.px(x, y, c);
    if (rng.frac() > 0.6) pc.px(x, y - 1, c);
  }
  for (let i = 0; i < 4; i++) {
    const x = rng.between(2, size - 3);
    const y = rng.between(2, size - 3);
    pc.px(x, y, rng.pick(spec.accents));
  }
  pc.commit(scene);
}

export function generateTiles(scene: Phaser.Scene): void {
  makeTile(scene, {
    key: 'grass',
    seed: 'nightfall-grass',
    baseA: '#2f5d34',
    baseB: '#2a5430',
    patch: '#244a29',
    speckA: '#3c7a40',
    speckB: '#458a48',
    accents: ['#e8d24a', '#e07ab0', '#dcdce6'],
  });
  makeTile(scene, {
    key: 'stone',
    seed: 'nightfall-stone',
    baseA: '#34343f',
    baseB: '#2e2e38',
    patch: '#23232c',
    speckA: '#41414e',
    speckB: '#4c4c5a',
    accents: ['#5a5a6a', '#6ad8ff', '#2a2a33'],
  });
  makeTile(scene, {
    key: 'ash',
    seed: 'nightfall-ash',
    baseA: '#3a221c',
    baseB: '#341e18',
    patch: '#281510',
    speckA: '#4a2a20',
    speckB: '#5a3026',
    accents: ['#ff6a2a', '#e0431a', '#71706a'],
  });

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

  // Treasure chest.
  const chest = new PixelCanvas(scene, 'chest', 16, 16, 1);
  const COUT = '#3a230a';
  const WOOD_D = '#7a4a1a';
  const WOOD = '#a86a2a';
  const GOLD = '#f2c14e';
  const GOLD_H = '#fff3bf';
  chest.rect(2, 8, 12, 6, WOOD); // base
  chest.rect(2, 8, 12, 1, WOOD_D);
  chest.rect(2, 4, 12, 4, WOOD); // lid
  chest.rect(2, 4, 12, 1, GOLD_H);
  chest.rect(2, 7, 12, 1, GOLD); // band
  chest.rect(7, 6, 2, 4, GOLD); // lock plate
  chest.px(7, 8, COUT);
  chest.px(8, 8, COUT);
  chest.rect(2, 4, 1, 10, WOOD_D);
  chest.rect(13, 4, 1, 10, WOOD_D);
  chest.outline(COUT);
  chest.commit(scene);
}
