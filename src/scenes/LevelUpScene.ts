import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import type { UpgradeChoice } from '../types';
import type { GameScene } from './GameScene';

interface LevelUpData {
  choices: UpgradeChoice[];
  gameScene: GameScene;
  title?: string;
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
      .text(width / 2, height * 0.16, this.payload.title ?? 'LEVEL UP!', {
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
    const accentInt = choice.accent ? parseInt(choice.accent.slice(1), 16) : 0x3f6fc0;

    const bg = this.add
      .rectangle(0, 0, w, h, 0x1a1726)
      .setStrokeStyle(choice.accent ? 4 : 3, accentInt)
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
      .text(0, -12, choice.name, {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: w - 24 },
      })
      .setOrigin(0.5);

    // Optional emphasis tag (e.g. elemental infusion) in the accent colour.
    const extras: Phaser.GameObjects.GameObject[] = [];
    if (choice.tag) {
      extras.push(
        this.add
          .text(0, 18, choice.tag, {
            fontFamily: 'Courier New, monospace',
            fontSize: '12px',
            color: choice.accent ?? '#f2c14e',
          })
          .setOrigin(0.5)
      );
    }

    const desc = this.add
      .text(0, choice.tag ? 42 : 50, choice.description, {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: choice.accent ?? '#c8cee0',
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

    container.add([bg, badge, icon, name, ...extras, desc, key]);
    container.setSize(w, h);
    // Padded hit area for forgiving touch taps.
    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20),
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
    // Select on tap (pointerup) and click (pointerdown) — pick() guards double-fire.
    container.on('pointerup', () => this.pick(choice));
    container.on('pointerdown', () => this.pick(choice));

    // Entrance animation: fade + slide (NOT scale) so the tap target is full-size
    // immediately — scaling the hit box was making touch taps miss during the tween.
    container.setAlpha(0);
    container.y = y + 24;
    this.tweens.add({
      targets: container,
      y,
      alpha: 1,
      duration: 200,
      delay: index * 60,
      ease: 'Cubic.out',
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
