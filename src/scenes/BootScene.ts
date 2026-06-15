import Phaser from 'phaser';

/** Minimal first scene: configures input and hands off to asset generation. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.input.keyboard?.addCapture(['W', 'A', 'S', 'D', 'SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);
    this.scene.start('PreloadScene');
  }
}
