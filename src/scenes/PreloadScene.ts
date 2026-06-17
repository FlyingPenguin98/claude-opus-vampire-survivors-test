import Phaser from 'phaser';
import { SpriteFactory } from '../gen/SpriteFactory';

/**
 * There are no files to load — instead this scene generates every texture and
 * animation procedurally, then proceeds to the title screen.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  create(): void {
    try {
      SpriteFactory.generateAll(this);
    } catch (err) {
      const overlay = document.getElementById('nf-error');
      const msg = document.getElementById('nf-error-msg');
      if (msg) msg.textContent = 'Failed to build game art: ' + (err instanceof Error ? err.message : String(err));
      if (overlay) overlay.style.display = 'flex';
      throw err;
    }
    this.scene.start('TitleScene');
  }
}
