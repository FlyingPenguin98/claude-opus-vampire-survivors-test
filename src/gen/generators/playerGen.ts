import Phaser from 'phaser';
import { PixelCanvas } from '../PixelCanvas';
import { PALETTES } from '../Palette';

/**
 * Hero sprite sheet (16x16 frames, front-facing top-down view).
 * Frames: 0,1 = idle bob; 2,3,4,5 = walk cycle (alternating leg strides).
 * Drawn on the left half and mirrored for a clean, symmetric silhouette.
 */
const HERO_FRAMES = 6;

export function generatePlayer(scene: Phaser.Scene): void {
  const p = PALETTES.hero;
  const [
    ,
    OUT,
    SKIN_S,
    SKIN,
    HAIR_D,
    HAIR,
    CLOAK_D,
    CLOAK,
    CLOAK_H,
    STEEL,
    GOLD,
  ] = p;

  const pc = new PixelCanvas(scene, 'player', 16, 16, HERO_FRAMES);

  for (let f = 0; f < HERO_FRAMES; f++) {
    pc.frame(f);

    // Vertical body bob for idle (frames 0/1) and subtle walk bounce.
    const bob = f === 1 || f === 3 || f === 5 ? 1 : 0;
    // Leg stride: +1 left forward, -1 right forward, 0 neutral.
    const stride = f === 2 ? 1 : f === 4 ? -1 : 0;

    const top = 1 + bob;

    // --- Hair (back/top of head) ---
    pc.rect(5, top, 6, 3, HAIR);
    pc.rect(5, top, 6, 1, HAIR_D);
    pc.px(5, top + 1, HAIR_D);
    pc.px(10, top + 1, HAIR_D);

    // --- Face ---
    pc.rect(5, top + 3, 6, 3, SKIN);
    pc.rect(5, top + 5, 6, 1, SKIN_S); // chin shadow
    // Eyes
    pc.px(6, top + 4, OUT);
    pc.px(9, top + 4, OUT);
    // Hair fringe sides
    pc.px(5, top + 3, HAIR);
    pc.px(10, top + 3, HAIR);

    // --- Cloak / torso ---
    const ty = top + 6;
    pc.rect(4, ty, 8, 5, CLOAK);
    // Shoulders highlight + center seam
    pc.rect(4, ty, 8, 1, CLOAK_H);
    pc.rect(7, ty, 2, 5, CLOAK_D);
    // Gold clasp
    pc.px(7, ty + 1, GOLD);
    pc.px(8, ty + 1, GOLD);
    // Side shading
    pc.rect(4, ty + 1, 1, 4, CLOAK_D);
    pc.rect(11, ty + 1, 1, 4, CLOAK_D);

    // --- Arms (steel bracers) ---
    pc.rect(3, ty + 1, 1, 3, SKIN);
    pc.rect(12, ty + 1, 1, 3, SKIN);
    pc.px(3, ty + 3, STEEL);
    pc.px(12, ty + 3, STEEL);

    // --- Legs / boots with stride ---
    const ly = ty + 5;
    // left leg
    pc.rect(5, ly, 2, 2 + (stride > 0 ? 0 : 0), CLOAK_D);
    pc.px(5, ly + 1 + (stride > 0 ? 1 : 0), OUT);
    // right leg
    pc.rect(9, ly, 2, 2, CLOAK_D);
    pc.px(10, ly + 1 + (stride < 0 ? 1 : 0), OUT);
    // boots
    pc.px(5, ly + 2 + (stride > 0 ? 1 : 0), STEEL);
    pc.px(10, ly + 2 + (stride < 0 ? 1 : 0), STEEL);

    pc.outline(OUT as string);
  }

  pc.commit(scene);

  scene.anims.create({
    key: 'player-idle',
    frames: scene.anims.generateFrameNumbers('player', { frames: [0, 1] }),
    frameRate: 3,
    repeat: -1,
  });
  scene.anims.create({
    key: 'player-walk',
    frames: scene.anims.generateFrameNumbers('player', { frames: [2, 3, 4, 5] }),
    frameRate: 9,
    repeat: -1,
  });
}
