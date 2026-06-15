import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import { MetaState } from '../state/MetaState';

/** Title / start screen with a procedurally-tiled backdrop and run stats. */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .tileSprite(0, 0, width, height, 'grass')
      .setOrigin(0)
      .setScale(GAME.spriteScale)
      .setScrollFactor(0)
      .setTileScale(1)
      .setAlpha(0.5);
    this.add.rectangle(0, 0, width, height, 0x10101c, 0.55).setOrigin(0);

    // Hero showcase, animated.
    const hero = this.add
      .sprite(width / 2, height / 2 - 20, 'player')
      .setScale(GAME.spriteScale * 3);
    hero.play('player-idle');

    this.add
      .text(width / 2, height * 0.22, 'NIGHTFALL', {
        fontFamily: 'Georgia, serif',
        fontSize: '64px',
        color: '#f2c14e',
        stroke: '#21161f',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.32, 'S U R V I V O R S', {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#cfd6e6',
        stroke: '#21161f',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height * 0.72, 'Press SPACE or Click to Begin', {
        fontFamily: 'Courier New, monospace',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.2, yoyo: true, repeat: -1, duration: 700 });

    this.add
      .text(
        width / 2,
        height * 0.82,
        'WASD / Arrows to move  •  Weapons fire automatically  •  Survive the night',
        {
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          color: '#9aa0b4',
        }
      )
      .setOrigin(0.5);

    const meta = MetaState.get();
    if (meta.runs > 0) {
      const best = `${Math.floor(meta.bestTimeSec / 60)}:${String(
        Math.floor(meta.bestTimeSec % 60)
      ).padStart(2, '0')}`;
      this.add
        .text(
          width / 2,
          height * 0.9,
          `Best Time: ${best}   •   Lifetime Gold: ${meta.totalGold}`,
          { fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#f2c14e' }
        )
        .setOrigin(0.5);
    }

    const start = () => this.scene.start('GameScene');
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }
}
