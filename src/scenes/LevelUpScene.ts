import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import type { UpgradeChoice } from '../types';
import type { GameScene } from './GameScene';

interface LevelUpData {
  choices: UpgradeChoice[];
  gameScene: GameScene;
}

/**
 * Modal upgrade picker shown over a paused GameScene. Presents up to three cards;
 * choose with mouse click or keys 1/2/3. On pick it hands the choice back to the
 * GameScene and closes.
 */
export class LevelUpScene extends Phaser.Scene {
  private payload!: LevelUpData;
  private picked = false;

  constructor() {
    super('LevelUpScene');
  }

  init(data: LevelUpData): void {
    this.payload = data;
    this.picked = false;
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x05050c, 0.78).setOrigin(0);

    this.add
      .text(width / 2, height * 0.16, 'LEVEL UP!', {
        fontFamily: 'Georgia, serif',
        fontSize: '44px',
        color: '#f2c14e',
        stroke: '#21161f',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.24, 'Choose an upgrade', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#cfd6e6',
      })
      .setOrigin(0.5);

    const choices = this.payload.choices;
    const cardW = 220;
    const gap = 28;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = height * 0.55;

    choices.forEach((choice, i) => {
      const x = startX + i * (cardW + gap);
      this.createCard(choice, x, cardY, cardW, i);
    });

    // Keyboard selection.
    for (let i = 0; i < choices.length; i++) {
      this.input.keyboard?.once(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR'][i]}`, () =>
        this.pick(choices[i])
      );
    }
  }

  private createCard(
    choice: UpgradeChoice,
    x: number,
    y: number,
    w: number,
    index: number
  ): void {
    const h = 240;
    const container = this.add.container(x, y);

    const bg = this.add
      .rectangle(0, 0, w, h, 0x1a1726)
      .setStrokeStyle(3, 0x3f6fc0)
      .setOrigin(0.5);

    const badge = this.add
      .text(0, -h / 2 + 18, choice.badge, {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#f2c14e',
      })
      .setOrigin(0.5);

    const icon = this.add
      .image(0, -h / 2 + 70, choice.icon)
      .setScale(GAME.spriteScale * 1.6);

    const name = this.add
      .text(0, -10, choice.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: w - 24 },
      })
      .setOrigin(0.5);

    const desc = this.add
      .text(0, 50, choice.description, {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#aab0c4',
        align: 'center',
        wordWrap: { width: w - 28 },
      })
      .setOrigin(0.5, 0);

    const key = this.add
      .text(0, h / 2 - 22, `[ ${index + 1} ]`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '14px',
        color: '#6ad8ff',
      })
      .setOrigin(0.5);

    container.add([bg, badge, icon, name, desc, key]);
    container.setSize(w, h);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      bg.setStrokeStyle(3, 0x74a8f0);
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });
    container.on('pointerout', () => {
      bg.setStrokeStyle(3, 0x3f6fc0);
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });
    container.on('pointerdown', () => this.pick(choice));

    // Entrance animation.
    container.setScale(0.6).setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 220,
      delay: index * 70,
      ease: 'Back.out',
    });
  }

  private pick(choice: UpgradeChoice): void {
    if (this.picked) return;
    this.picked = true;
    const gameScene = this.payload.gameScene;
    this.scene.stop();
    gameScene.onUpgradePicked(choice);
  }
}
