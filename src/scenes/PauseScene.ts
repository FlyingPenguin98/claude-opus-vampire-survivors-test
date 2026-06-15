import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import type { GameScene } from './GameScene';

interface PauseData {
  gameScene: GameScene;
}

/**
 * Pause overlay shown over a frozen GameScene. Doubles as the detailed loadout
 * view (weapons with levels + descriptions, and acquired passives), since the
 * GameScene's input is frozen while paused and can't handle the resume itself.
 */
export class PauseScene extends Phaser.Scene {
  private gameScene!: GameScene;

  constructor() {
    super('PauseScene');
  }

  init(data: PauseData): void {
    this.gameScene = data.gameScene;
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x05050c, 0.82).setOrigin(0);

    this.add
      .text(width / 2, height * 0.1, 'PAUSED', {
        fontFamily: 'Georgia, serif',
        fontSize: '48px',
        color: '#f2c14e',
        stroke: '#21161f',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    const loadout = this.gameScene.getLoadout();

    // --- Weapons column ---
    this.add
      .text(width * 0.5, height * 0.22, 'YOUR ARSENAL', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#6ad8ff',
      })
      .setOrigin(0.5);

    let y = height * 0.29;
    const leftX = width * 0.26;
    for (const w of loadout.weapons) {
      this.add.image(leftX, y, w.icon).setScale(GAME.spriteScale * 0.9);
      const lvl = w.level >= w.maxLevel ? 'MAX' : `Lv ${w.level}/${w.maxLevel}`;
      this.add
        .text(leftX + 28, y - 10, `${w.name}  (${lvl})`, {
          fontFamily: 'Georgia, serif',
          fontSize: '17px',
          color: '#ffffff',
        })
        .setOrigin(0, 0.5);
      this.add
        .text(leftX + 28, y + 9, w.description, {
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          color: '#9aa0b4',
        })
        .setOrigin(0, 0.5);
      y += 48;
    }

    // --- Passives ---
    if (loadout.passives.length > 0) {
      y += 6;
      this.add
        .text(leftX, y, 'PASSIVES', {
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          color: '#6ad8ff',
        })
        .setOrigin(0, 0.5);
      y += 26;
      let px = leftX;
      for (const p of loadout.passives) {
        this.add.image(px, y, p.icon).setScale(GAME.spriteScale * 0.7);
        this.add
          .text(px + 16, y, p.count > 1 ? `${p.name} x${p.count}` : p.name, {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            color: '#cfd6e6',
          })
          .setOrigin(0, 0.5);
        // Wrap to next line after a few.
        px += 170;
        if (px > width * 0.78) {
          px = leftX;
          y += 24;
        }
      }
    }

    const prompt = this.add
      .text(width / 2, height * 0.92, 'Press Esc / P or click to resume', {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, yoyo: true, repeat: -1, duration: 700 });

    // Bind resume after a short delay so the same key press that opened the pause
    // screen doesn't immediately close it.
    this.time.delayedCall(180, () => {
      this.input.keyboard?.once('keydown-ESC', () => this.resume());
      this.input.keyboard?.once('keydown-P', () => this.resume());
      this.input.once('pointerdown', () => this.resume());
    });
  }

  private resume(): void {
    this.scene.stop();
    this.gameScene.scene.resume();
  }
}
