import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';

/** A pooled treasure chest dropped by elites/bosses. Collected on player overlap. */
export class Chest extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'chest');
    this.setDepth(16);
  }

  spawn(x: number, y: number): void {
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    this.setTexture('chest');
    this.setScale(0);
    this.scene.tweens.add({ targets: this, scale: GAME.spriteScale, duration: 200, ease: 'Back.out' });
    // Gentle bob so it stands out from gems.
    this.scene.tweens.add({
      targets: this,
      y: y - 4,
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: 'Sine.inOut',
    });
  }

  kill(): void {
    this.scene.tweens.killTweensOf(this);
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
  }
}
