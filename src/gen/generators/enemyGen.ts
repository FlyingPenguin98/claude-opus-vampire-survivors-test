import Phaser from 'phaser';
import { PixelCanvas } from '../PixelCanvas';
import { PALETTES } from '../Palette';

/**
 * Each enemy is a 2-frame animated 16x16 sprite (bosses are 32x32). Frame variation
 * gives a cheap idle "wobble"/flap so the swarm reads as alive.
 */

function registerWobble(scene: Phaser.Scene, key: string, rate = 4): void {
  scene.anims.create({
    key: `${key}-move`,
    frames: scene.anims.generateFrameNumbers(key, { frames: [0, 1] }),
    frameRate: rate,
    repeat: -1,
  });
}

export function generateBat(scene: Phaser.Scene): void {
  const [, OUT, WING_D, WING, BODY, EYE] = PALETTES.bat;
  const pc = new PixelCanvas(scene, 'bat', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const flap = f === 0 ? 0 : 1;
    pc.rect(7, 7, 3, 4, BODY);
    pc.px(7, 8, EYE);
    pc.px(9, 8, EYE);
    const wy = 6 + flap;
    pc.rect(2, wy, 5, 2, WING);
    pc.rect(9, wy, 5, 2, WING);
    pc.rect(2, wy, 2, 1, WING_D);
    pc.rect(12, wy, 2, 1, WING_D);
    pc.px(7, 6, BODY);
    pc.px(9, 6, BODY);
    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'bat', 10);
}

export function generateZombie(scene: Phaser.Scene): void {
  const [, OUT, FLESH_S, FLESH, FLESH_H, RAG_D, RAG, EYE] = PALETTES.zombie;
  const pc = new PixelCanvas(scene, 'zombie', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const lean = f === 0 ? 0 : 1;
    pc.rect(6, 2, 4, 4, FLESH);
    pc.rect(6, 2, 4, 1, FLESH_H);
    pc.px(6, 4, EYE);
    pc.px(9, 4, EYE);
    pc.px(7, 5, FLESH_S);
    pc.rect(5, 6, 6, 5, RAG);
    pc.rect(5, 6, 6, 1, FLESH_S);
    pc.px(6, 8, RAG_D);
    pc.px(9, 9, RAG_D);
    pc.rect(4, 7, 1, 3 + lean, FLESH);
    pc.rect(11, 7, 1, 3 + lean, FLESH);
    pc.rect(6, 11, 1, 3, RAG_D);
    pc.rect(9, 11, 1, 3, RAG_D);
    pc.px(6, 11 + lean, FLESH_S);
    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'zombie', 4);
}

function drawSlimeBody(pc: PixelCanvas, f: number, pal: (string | null)[]): void {
  const [, OUT, BODY_D, BODY, BODY_H, SHINE, EYE] = pal;
  const squash = f;
  const topY = 5 + squash;
  pc.rect(4, topY, 8, 7 - squash, BODY);
  pc.rect(5, topY - 1, 6, 1, BODY);
  pc.rect(4, 11, 8, 1, BODY_D);
  pc.rect(4, topY, 8, 1, BODY_H);
  pc.px(6, topY + 1, SHINE);
  pc.px(7, topY + 1, SHINE);
  pc.px(6, topY + 3, EYE);
  pc.px(9, topY + 3, EYE);
  pc.outline(OUT as string);
}

export function generateSlime(scene: Phaser.Scene): void {
  const pc = new PixelCanvas(scene, 'slime', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    drawSlimeBody(pc, f, PALETTES.slime);
  }
  pc.commit(scene);
  registerWobble(scene, 'slime', 5);
}

export function generateBlob(scene: Phaser.Scene): void {
  const [, OUT, BODY_D, BODY, BODY_H, SHINE, EYE] = PALETTES.blob;
  const pc = new PixelCanvas(scene, 'blob', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const squash = f;
    const topY = 3 + squash;
    pc.rect(2, topY, 12, 10 - squash, BODY);
    pc.rect(3, topY - 1, 10, 1, BODY);
    pc.rect(2, 12, 12, 1, BODY_D);
    pc.rect(2, topY, 12, 1, BODY_H);
    pc.px(5, topY + 2, SHINE);
    pc.px(6, topY + 2, SHINE);
    pc.px(5, topY + 5, EYE);
    pc.px(10, topY + 5, EYE);
    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'blob', 5);
}

export function generateSkeleton(scene: Phaser.Scene): void {
  const [, OUT, BONE_S, BONE, BONE_H, EYE, CLOTH] = PALETTES.skeleton;
  const pc = new PixelCanvas(scene, 'skeleton', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const sway = f === 0 ? 0 : 1;
    pc.rect(6, 2, 4, 4, BONE);
    pc.rect(6, 2, 4, 1, BONE_H);
    pc.px(6, 4, EYE);
    pc.px(9, 4, EYE);
    pc.px(7, 5, BONE_S);
    pc.px(8, 5, BONE_S);
    pc.rect(6, 6, 4, 4, BONE);
    pc.px(6, 7, BONE_S);
    pc.px(9, 7, BONE_S);
    pc.px(6, 9, BONE_S);
    pc.px(9, 9, BONE_S);
    pc.rect(5, 9, 6, 2, CLOTH);
    pc.rect(4 + sway, 6, 1, 4, BONE);
    pc.rect(11 - sway, 6, 1, 4, BONE);
    pc.rect(6, 11, 1, 3, BONE);
    pc.rect(9, 11, 1, 3, BONE);
    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'skeleton', 6);
}

export function generateHound(scene: Phaser.Scene): void {
  const [, OUT, FUR_D, FUR, FUR_H, EYE] = PALETTES.hound;
  const pc = new PixelCanvas(scene, 'hound', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const step = f === 0 ? 0 : 1;
    // body
    pc.rect(3, 7, 9, 4, FUR);
    pc.rect(3, 7, 9, 1, FUR_H);
    pc.px(3, 7, FUR_D);
    // head
    pc.rect(11, 6, 4, 4, FUR);
    pc.rect(11, 6, 4, 1, FUR_H);
    pc.px(13, 8, EYE);
    pc.px(11, 5, FUR_D); // ear
    pc.px(14, 9, OUT); // snout
    // tail
    pc.px(2, 6, FUR);
    pc.px(2, 7, FUR_D);
    // legs (alternate)
    pc.rect(4, 11, 1, 2 + step, FUR_D);
    pc.rect(7, 11, 1, 3 - step, FUR_D);
    pc.rect(10, 11, 1, 2 + step, FUR_D);
    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'hound', 9);
}

export function generateWisp(scene: Phaser.Scene): void {
  const [, OUT, ROBE_D, ROBE, ROBE_H, GLOW] = PALETTES.wisp;
  const pc = new PixelCanvas(scene, 'wisp', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const bob = f;
    const top = 3 + bob;
    // rounded ghost body
    pc.rect(5, top, 6, 8, ROBE);
    pc.rect(6, top - 1, 4, 1, ROBE);
    pc.rect(5, top, 6, 1, ROBE_H);
    pc.rect(4, top + 2, 1, 4, ROBE_D);
    pc.rect(11, top + 2, 1, 4, ROBE_D);
    // wavy tendrils
    pc.px(5, top + 8, ROBE);
    pc.px(7, top + 8 + (f ? 1 : 0), ROBE);
    pc.px(9, top + 8, ROBE);
    // glowing eyes
    pc.px(6, top + 3, GLOW);
    pc.px(9, top + 3, GLOW);
    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'wisp', 5);
}

export function generateGolem(scene: Phaser.Scene): void {
  const [, OUT, ROCK_D, ROCK, ROCK_H, ROCK_T, EYE] = PALETTES.golem;
  const pc = new PixelCanvas(scene, 'golem', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const sway = f;
    // legs
    pc.rect(4, 12, 3, 3, ROCK_D);
    pc.rect(9, 12, 3, 3, ROCK_D);
    // torso
    pc.rect(3, 5, 10, 7, ROCK);
    pc.rect(3, 5, 10, 1, ROCK_T);
    pc.px(5, 8, ROCK_D);
    pc.px(10, 9, ROCK_D);
    // shoulders
    pc.rect(2, 5 + sway, 2, 3, ROCK_H);
    pc.rect(12, 5 + sway, 2, 3, ROCK_H);
    // head
    pc.rect(6, 2, 4, 3, ROCK);
    pc.px(6, 3, EYE);
    pc.px(9, 3, EYE);
    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'golem', 4);
}

export function generateBrute(scene: Phaser.Scene): void {
  const [, OUT, SK_D, SK, SK_H, CLOTH, EYE] = PALETTES.brute;
  const pc = new PixelCanvas(scene, 'brute', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const sway = f;
    // legs
    pc.rect(5, 12, 2, 3, CLOTH);
    pc.rect(9, 12, 2, 3, CLOTH);
    // big torso
    pc.rect(3, 6, 10, 7, SK);
    pc.rect(3, 6, 10, 1, SK_H);
    pc.rect(7, 6, 2, 6, SK_D);
    // arms
    pc.rect(2, 6 + sway, 2, 5, SK);
    pc.rect(12, 6 + sway, 2, 5, SK);
    pc.px(2, 11 + sway, SK_D);
    pc.px(13, 11 + sway, SK_D);
    // small head
    pc.rect(6, 2, 4, 4, SK);
    pc.rect(6, 2, 4, 1, SK_H);
    pc.px(6, 4, EYE);
    pc.px(9, 4, EYE);
    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'brute', 4);
}

/** The 32x32 boss silhouette, palette-swapped per boss. */
function generateBossSprite(scene: Phaser.Scene, key: string, paletteName: string): void {
  const [, OUT, ARM_D, ARM, ARM_H, CLOAK_D, CLOAK, GLOW, GOLD] = PALETTES[paletteName];
  const pc = new PixelCanvas(scene, key, 32, 32, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const bob = f;
    const top = 3 + bob;

    pc.rect(6, top + 8, 20, 18, CLOAK);
    pc.rect(6, top + 8, 20, 2, CLOAK_D);
    pc.rect(6, top + 22, 20, 4, CLOAK_D);
    for (let x = 7; x < 25; x += 3) pc.px(x, top + 25, OUT as string);

    pc.rect(10, top + 9, 12, 10, ARM);
    pc.rect(10, top + 9, 12, 2, ARM_H);
    pc.rect(15, top + 9, 2, 10, ARM_D);
    pc.px(15, top + 13, GOLD);
    pc.px(16, top + 13, GOLD);

    pc.rect(7, top + 9, 4, 4, ARM);
    pc.rect(21, top + 9, 4, 4, ARM);
    pc.rect(7, top + 9, 4, 1, ARM_H);
    pc.rect(21, top + 9, 4, 1, ARM_H);

    pc.rect(12, top, 8, 8, ARM);
    pc.rect(12, top, 8, 2, ARM_H);
    pc.px(11, top - 1, ARM_D);
    pc.px(20, top - 1, ARM_D);
    pc.px(10, top - 2, ARM_D);
    pc.px(21, top - 2, ARM_D);
    pc.rect(13, top + 4, 2, 2, GLOW);
    pc.rect(17, top + 4, 2, 2, GLOW);

    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, key, 3);
}

export function generateAllEnemies(scene: Phaser.Scene): void {
  generateBat(scene);
  generateZombie(scene);
  generateSlime(scene);
  generateBlob(scene);
  generateSkeleton(scene);
  generateHound(scene);
  generateWisp(scene);
  generateGolem(scene);
  generateBrute(scene);
  generateBossSprite(scene, 'boss', 'boss');
  generateBossSprite(scene, 'boss-warlock', 'boss_warlock');
  generateBossSprite(scene, 'boss-behemoth', 'boss_behemoth');
}
