import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import { MetaState } from '../state/MetaState';
import { AudioSystem } from '../systems/AudioSystem';
import { POWERUPS } from '../data/powerups';
import type { PowerupDef } from '../types';
import type { MetaData } from '../state/MetaState';

/** Between-runs shop: spend gold on permanent powerups that apply every run. */
export class ShopScene extends Phaser.Scene {
  private meta!: MetaData;
  private goldText!: Phaser.GameObjects.Text;

  constructor() {
    super('ShopScene');
  }

  create(): void {
    this.meta = MetaState.get();
    AudioSystem.unlock();
    const { width, height } = this.scale;

    this.add.tileSprite(0, 0, width, height, 'grass').setOrigin(0).setTileScale(GAME.spriteScale).setAlpha(0.35);
    this.add.rectangle(0, 0, width, height, 0x10101c, 0.72).setOrigin(0);

    this.add
      .text(width / 2, 28, 'POWERUPS', {
        fontFamily: 'Georgia, serif', fontSize: '32px', color: '#f2c14e', stroke: '#21161f', strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.goldText = this.add
      .text(width / 2, 58, '', { fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#f2c14e' })
      .setOrigin(0.5);

    const defs = Object.values(POWERUPS);
    const cols = 3;
    const cardW = 280;
    const cardH = 96;
    const gapX = 14;
    const gapY = 12;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const startX = (width - gridW) / 2 + cardW / 2;
    const startY = 110;

    defs.forEach((def, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      this.createCard(def, x, y, cardW, cardH);
    });

    const back = this.add
      .text(width / 2, height - 28, '◀  Back (Esc)', {
        fontFamily: 'Courier New, monospace', fontSize: '18px', color: '#cfd6e6',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('TitleScene'));
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('TitleScene'));

    this.refreshGold();
  }

  private refreshGold(): void {
    this.goldText.setText(`Spendable Gold: ${this.meta.spendableGold}`);
  }

  private createCard(def: PowerupDef, x: number, y: number, w: number, h: number): void {
    const border = this.add.rectangle(x, y, w, h, 0x1a1726).setStrokeStyle(2, 0x3f6fc0);
    const icon = this.add.image(x - w / 2 + 26, y, def.icon).setScale(GAME.spriteScale * 0.8);
    this.add.text(x - w / 2 + 50, y - h / 2 + 12, def.name, {
      fontFamily: 'Georgia, serif', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0, 0);
    this.add.text(x - w / 2 + 50, y - h / 2 + 34, def.description, {
      fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#9aa0b4', wordWrap: { width: w - 64 },
    }).setOrigin(0, 0);

    const status = this.add
      .text(x - w / 2 + 50, y + h / 2 - 22, '', { fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#6ad8ff' })
      .setOrigin(0, 0);

    const redraw = () => {
      const lvl = this.meta.powerups[def.id] ?? 0;
      if (lvl >= def.maxLevel) {
        status.setText(`MAX  (Lv ${lvl}/${def.maxLevel})`).setColor('#46d873');
        border.setStrokeStyle(2, 0x46d873);
      } else {
        const cost = def.cost(lvl);
        const afford = this.meta.spendableGold >= cost;
        status.setText(`Lv ${lvl}/${def.maxLevel}   •   Cost ${cost}🪙`).setColor(afford ? '#f2c14e' : '#aa5555');
      }
    };

    border.setInteractive({ useHandCursor: true });
    border.on('pointerover', () => border.setFillStyle(0x232036));
    border.on('pointerout', () => border.setFillStyle(0x1a1726));
    border.on('pointerdown', () => {
      const lvl = this.meta.powerups[def.id] ?? 0;
      if (lvl >= def.maxLevel) return;
      const cost = def.cost(lvl);
      if (this.meta.spendableGold < cost) return;
      this.meta = MetaState.purchasePowerup(def.id, cost, def.maxLevel);
      AudioSystem.buy();
      this.tweens.add({ targets: icon, scale: GAME.spriteScale * 1.1, yoyo: true, duration: 120 });
      this.refreshGold();
      redraw();
    });

    redraw();
  }
}
