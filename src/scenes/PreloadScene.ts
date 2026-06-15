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
    SpriteFactory.generateAll(this);
    this.scene.start('TitleScene');
  }
}
