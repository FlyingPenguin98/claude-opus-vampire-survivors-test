import Phaser from 'phaser';
import { PixelCanvas } from '../PixelCanvas';
import { PALETTES } from '../Palette';

/**
 * Each enemy is a 2-frame animated 16x16 sprite (boss is 32x32). Frame variation
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
    const flap = f === 0 ? 0 : 1; // wings up/down
    // body
    pc.rect(7, 7, 3, 4, BODY);
    pc.px(7, 8, EYE);
    pc.px(9, 8, EYE);
    // wings
    const wy = 6 + flap;
    pc.rect(2, wy, 5, 2, WING);
    pc.rect(9, wy, 5, 2, WING);
    pc.rect(2, wy, 2, 1, WING_D);
    pc.rect(12, wy, 2, 1, WING_D);
    // ears
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
    // head
    pc.rect(6, 2, 4, 4, FLESH);
    pc.rect(6, 2, 4, 1, FLESH_H);
    pc.px(6, 4, EYE);
    pc.px(9, 4, EYE);
    pc.px(7, 5, FLESH_S);
    // torso (ragged shirt)
    pc.rect(5, 6, 6, 5, RAG);
    pc.rect(5, 6, 6, 1, FLESH_S);
    pc.px(6, 8, RAG_D);
    pc.px(9, 9, RAG_D);
    // arms reaching forward
    pc.rect(4, 7, 1, 3 + lean, FLESH);
    pc.rect(11, 7, 1, 3 + lean, FLESH);
    // legs
    pc.rect(6, 11, 1, 3, RAG_D);
    pc.rect(9, 11, 1, 3, RAG_D);
    pc.px(6, 11 + lean, FLESH_S);
    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'zombie', 4);
}

export function generateSlime(scene: Phaser.Scene): void {
  const [, OUT, BODY_D, BODY, BODY_H, SHINE, EYE] = PALETTES.slime;
  const pc = new PixelCanvas(scene, 'slime', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const squash = f; // frame 1 squashes flatter
    const topY = 5 + squash;
    // dome
    pc.rect(4, topY, 8, 7 - squash, BODY);
    pc.rect(5, topY - 1, 6, 1, BODY);
    pc.rect(4, 11, 8, 1, BODY_D); // base shadow
    pc.rect(4, topY, 8, 1, BODY_H); // top highlight
    // jelly shine
    pc.px(6, topY + 1, SHINE);
    pc.px(7, topY + 1, SHINE);
    // eyes
    pc.px(6, topY + 3, EYE);
    pc.px(9, topY + 3, EYE);
    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'slime', 5);
}

export function generateSkeleton(scene: Phaser.Scene): void {
  const [, OUT, BONE_S, BONE, BONE_H, EYE, CLOTH] = PALETTES.skeleton;
  const pc = new PixelCanvas(scene, 'skeleton', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const sway = f === 0 ? 0 : 1;
    // skull
    pc.rect(6, 2, 4, 4, BONE);
    pc.rect(6, 2, 4, 1, BONE_H);
    pc.px(6, 4, EYE);
    pc.px(9, 4, EYE);
    pc.px(7, 5, BONE_S);
    pc.px(8, 5, BONE_S);
    // ribcage
    pc.rect(6, 6, 4, 4, BONE);
    pc.px(6, 7, BONE_S);
    pc.px(9, 7, BONE_S);
    pc.px(6, 9, BONE_S);
    pc.px(9, 9, BONE_S);
    // tattered cloth
    pc.rect(5, 9, 6, 2, CLOTH);
    // arms
    pc.rect(4 + sway, 6, 1, 4, BONE);
    pc.rect(11 - sway, 6, 1, 4, BONE);
    // legs
    pc.rect(6, 11, 1, 3, BONE);
    pc.rect(9, 11, 1, 3, BONE);
    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'skeleton', 6);
}

export function generateBoss(scene: Phaser.Scene): void {
  const [, OUT, ARM_D, ARM, ARM_H, CLOAK_D, CLOAK, GLOW, GOLD] = PALETTES.boss;
  const pc = new PixelCanvas(scene, 'boss', 32, 32, 2);
  for (let f = 0; f < 2; f++) {
    pc.frame(f);
    const bob = f;
    const top = 3 + bob;

    // Billowing cloak
    pc.rect(6, top + 8, 20, 18, CLOAK);
    pc.rect(6, top + 8, 20, 2, CLOAK_D);
    pc.rect(6, top + 22, 20, 4, CLOAK_D);
    for (let x = 7; x < 25; x += 3) pc.px(x, top + 25, OUT as string);

    // Armored chest
    pc.rect(10, top + 9, 12, 10, ARM);
    pc.rect(10, top + 9, 12, 2, ARM_H);
    pc.rect(15, top + 9, 2, 10, ARM_D);
    pc.px(15, top + 13, GOLD);
    pc.px(16, top + 13, GOLD);

    // Pauldrons
    pc.rect(7, top + 9, 4, 4, ARM);
    pc.rect(21, top + 9, 4, 4, ARM);
    pc.rect(7, top + 9, 4, 1, ARM_H);
    pc.rect(21, top + 9, 4, 1, ARM_H);

    // Helmet with horns
    pc.rect(12, top, 8, 8, ARM);
    pc.rect(12, top, 8, 2, ARM_H);
    pc.px(11, top - 1, ARM_D);
    pc.px(20, top - 1, ARM_D);
    pc.px(10, top - 2, ARM_D);
    pc.px(21, top - 2, ARM_D);
    // Glowing eyes
    pc.rect(13, top + 4, 2, 2, GLOW);
    pc.rect(17, top + 4, 2, 2, GLOW);

    pc.outline(OUT as string);
  }
  pc.commit(scene);
  registerWobble(scene, 'boss', 3);
}

export function generateAllEnemies(scene: Phaser.Scene): void {
  generateBat(scene);
  generateZombie(scene);
  generateSlime(scene);
  generateSkeleton(scene);
  generateBoss(scene);
}
