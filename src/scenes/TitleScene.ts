import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import { MetaState } from '../state/MetaState';
import { AudioSystem } from '../systems/AudioSystem';

/** Title / start screen with a procedurally-tiled backdrop, menu, and run stats. */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    const { width, height } = this.scale;

    const meta = MetaState.get();
    AudioSystem.configure(meta.settings);
    // Resume audio on the first interaction (browser autoplay policy).
    this.input.once('pointerdown', () => AudioSystem.unlock());
    this.input.keyboard?.once('keydown', () => AudioSystem.unlock());

    this.add
      .tileSprite(0, 0, width, height, 'grass')
      .setOrigin(0)
      .setScale(GAME.spriteScale)
      .setScrollFactor(0)
      .setTileScale(1)
      .setAlpha(0.5);
    this.add.rectangle(0, 0, width, height, 0x10101c, 0.55).setOrigin(0);

    const hero = this.add
      .sprite(width / 2, height * 0.4, 'player')
      .setScale(GAME.spriteScale * 3);
    hero.play('player-idle');

    this.add
      .text(width / 2, height * 0.18, 'NIGHTFALL', {
        fontFamily: 'Georgia, serif',
        fontSize: '64px',
        color: '#f2c14e',
        stroke: '#21161f',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.28, 'S U R V I V O R S', {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#cfd6e6',
        stroke: '#21161f',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // --- Menu ---
    const begin = this.menuItem(width / 2, height * 0.62, '▶  BEGIN', '#46d873', 26);
    begin.on('pointerdown', () => this.start());
    this.input.keyboard?.once('keydown-SPACE', () => this.start());

    const shop = this.menuItem(width / 2, height * 0.71, 'Powerups', '#f2c14e', 20);
    shop.on('pointerdown', () => this.scene.start('ShopScene'));

    const settings = this.menuItem(width / 2, height * 0.78, 'Settings', '#6ad8ff', 20);
    settings.on('pointerdown', () => this.scene.start('SettingsScene', { from: 'title' }));

    this.add
      .text(width / 2, height * 0.86, 'WASD / Arrows to move  •  Weapons fire automatically  •  Survive the night', {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#9aa0b4',
      })
      .setOrigin(0.5);

    if (meta.runs > 0) {
      const best = `${Math.floor(meta.bestTimeSec / 60)}:${String(Math.floor(meta.bestTimeSec % 60)).padStart(2, '0')}`;
      this.add
        .text(width / 2, height * 0.93, `Best Time: ${best}   •   Spendable Gold: ${meta.spendableGold}   •   Runs: ${meta.runs}`, {
          fontFamily: 'Courier New, monospace',
          fontSize: '13px',
          color: '#f2c14e',
        })
        .setOrigin(0.5);
    }
  }

  private menuItem(x: number, y: number, label: string, color: string, size: number): Phaser.GameObjects.Text {
    const t = this.add
      .text(x, y, label, {
        fontFamily: 'Georgia, serif',
        fontSize: `${size}px`,
        color,
        stroke: '#21161f',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    t.on('pointerover', () => t.setScale(1.1));
    t.on('pointerout', () => t.setScale(1));
    return t;
  }

  private start(): void {
    AudioSystem.unlock();
    this.scene.start('CharacterSelectScene');
  }
}
