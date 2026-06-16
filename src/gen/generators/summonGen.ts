import Phaser from 'phaser';
import { PixelCanvas } from '../PixelCanvas';

/** In-world sprites for summoned allies: the deployable Turret and the Companion. */
export function generateSummons(scene: Phaser.Scene): void {
  // Turret: a small ground cannon (static).
  const tu = new PixelCanvas(scene, 'turret', 16, 16, 1);
  tu.rect(3, 11, 10, 3, '#5a5a66'); // base
  tu.rect(3, 11, 10, 1, '#9aa0b4');
  tu.rect(5, 6, 6, 6, '#7a7a8a'); // body
  tu.rect(5, 6, 6, 1, '#aab0c4');
  tu.rect(8, 7, 6, 2, '#5a5a66'); // barrel
  tu.px(14, 7, '#ffd23a');
  tu.rect(7, 8, 2, 2, '#ff6a2a'); // core
  tu.outline('#21161f');
  tu.commit(scene);

  // Companion: a floating violet familiar with a 2-frame bob.
  const pe = new PixelCanvas(scene, 'pet', 16, 16, 2);
  for (let f = 0; f < 2; f++) {
    pe.frame(f);
    const bob = f;
    const top = 4 + bob;
    pe.rect(5, top, 6, 6, '#6b3fc0'); // body
    pe.rect(5, top, 6, 1, '#a87af0'); // top highlight
    pe.px(5, top - 1, '#6b3fc0'); // ears
    pe.px(10, top - 1, '#6b3fc0');
    pe.px(6, top + 2, '#ffffff'); // eyes
    pe.px(9, top + 2, '#ffffff');
    pe.px(6, top + 2, '#eaf2ff');
    pe.px(7, top + 5, '#a87af0');
    pe.rect(5, top + 6, 6, 1, '#3a1f6b'); // underside shadow
    pe.outline('#1a0a26');
  }
  pe.commit(scene);
  scene.anims.create({
    key: 'pet-move',
    frames: scene.anims.generateFrameNumbers('pet', { frames: [0, 1] }),
    frameRate: 4,
    repeat: -1,
  });
}
