import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';

interface GameOverData {
  timeSec: number;
  kills: number;
  gold: number;
  level: number;
  meta: { totalGold: number; bestTimeSec: number; runs: number };
}

/** End-of-run summary with meta totals and a restart prompt. */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverData): void {
    const { width, height } = this.scale;

    this.add
      .tileSprite(0, 0, width, height, 'grass')
      .setOrigin(0)
      .setTileScale(GAME.spriteScale)
      .setAlpha(0.4);
    this.add.rectangle(0, 0, width, height, 0x10101c, 0.7).setOrigin(0);

    this.add
      .text(width / 2, height * 0.18, 'YOU FELL', {
        fontFamily: 'Georgia, serif',
        fontSize: '56px',
        color: '#ff5a5a',
        stroke: '#21161f',
        strokeThickness: 7,
      })
      .setOrigin(0.5);

    const m = Math.floor(data.timeSec / 60);
    const s = Math.floor(data.timeSec % 60);
    const timeStr = `${m}:${String(s).padStart(2, '0')}`;
    const isBest = Math.abs(data.meta.bestTimeSec - data.timeSec) < 0.5 && data.meta.runs > 0;

    const lines = [
      `Time Survived:   ${timeStr}${isBest ? '   ★ NEW BEST' : ''}`,
      `Level Reached:   ${data.level}`,
      `Enemies Slain:   ${data.kills}`,
      `Gold Collected:  ${data.gold}`,
    ];
    this.add
      .text(width / 2, height * 0.45, lines, {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.66,
        `Lifetime Gold: ${data.meta.totalGold}   •   Runs: ${data.meta.runs}`,
        { fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#f2c14e' }
      )
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height * 0.82, 'Press SPACE to return to title', {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.2, yoyo: true, repeat: -1, duration: 700 });

    const restart = () => this.scene.start('TitleScene');
    // Small delay so a held key from death doesn't instantly skip the screen.
    this.time.delayedCall(500, () => {
      this.input.keyboard?.once('keydown-SPACE', restart);
      this.input.once('pointerdown', restart);
    });
  }
}
