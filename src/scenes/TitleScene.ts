import Phaser from 'phaser';
import { GAME, VERSION } from '../config/GameConfig';
import { MetaState } from '../state/MetaState';
import { AudioSystem } from '../systems/AudioSystem';

interface MenuItem {
  label: string;
  color: string;
  size: number;
  action: () => void;
  text?: Phaser.GameObjects.Text;
}

/** Title / start screen with a procedurally-tiled backdrop, menu, and run stats. */
export class TitleScene extends Phaser.Scene {
  private items: MenuItem[] = [];
  private sel = 0;
  private arrow!: Phaser.GameObjects.Text;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.items = [];
    this.sel = 0;

    const meta = MetaState.get();
    AudioSystem.configure(meta.settings);
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

    const hero = this.add.sprite(width / 2, height * 0.4, 'player').setScale(GAME.spriteScale * 3);
    hero.play('player-idle');

    this.add
      .text(width / 2, height * 0.18, 'NIGHTFALL', {
        fontFamily: 'Georgia, serif', fontSize: '64px', color: '#f2c14e', stroke: '#21161f', strokeThickness: 8,
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.28, 'S U R V I V O R S', {
        fontFamily: 'Georgia, serif', fontSize: '24px', color: '#cfd6e6', stroke: '#21161f', strokeThickness: 5,
      })
      .setOrigin(0.5);

    // --- Menu ---
    this.items = [
      { label: 'BEGIN', color: '#46d873', size: 28, action: () => this.start() },
      { label: 'Powerups', color: '#f2c14e', size: 22, action: () => this.scene.start('ShopScene') },
      { label: 'Achievements', color: '#cf9aff', size: 22, action: () => this.scene.start('AchievementsScene') },
      { label: 'Settings', color: '#6ad8ff', size: 22, action: () => this.scene.start('SettingsScene', { from: 'title' }) },
    ];
    const baseY = height * 0.57;
    const gap = 42;
    this.items.forEach((item, i) => {
      const t = this.add
        .text(width / 2, baseY + i * gap, item.label, {
          fontFamily: 'Georgia, serif',
          fontSize: `${item.size}px`,
          color: item.color,
          stroke: '#21161f',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.setSel(i));
      t.on('pointerdown', () => {
        this.setSel(i);
        item.action();
      });
      item.text = t;
    });

    this.arrow = this.add
      .text(0, 0, '▶', { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5);

    this.add
      .text(width - 8, height - 6, VERSION, {
        fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#5a607a',
      })
      .setOrigin(1, 1);

    // Keyboard navigation.
    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => this.move(-1));
    kb?.on('keydown-W', () => this.move(-1));
    kb?.on('keydown-DOWN', () => this.move(1));
    kb?.on('keydown-S', () => this.move(1));
    kb?.on('keydown-ENTER', () => this.activate());
    kb?.on('keydown-SPACE', () => this.activate());

    this.add
      .text(width / 2, height * 0.88, 'WASD / Arrows to move  •  Weapons fire automatically  •  Survive the night', {
        fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#9aa0b4',
      })
      .setOrigin(0.5);

    if (meta.runs > 0) {
      const best = `${Math.floor(meta.bestTimeSec / 60)}:${String(Math.floor(meta.bestTimeSec % 60)).padStart(2, '0')}`;
      this.add
        .text(width / 2, height * 0.94, `Best Time: ${best}   •   Spendable Gold: ${meta.spendableGold}   •   Runs: ${meta.runs}`, {
          fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#f2c14e',
        })
        .setOrigin(0.5);
    }

    this.refresh();
  }

  private move(dir: number): void {
    this.sel = (this.sel + dir + this.items.length) % this.items.length;
    this.refresh();
  }

  private setSel(i: number): void {
    this.sel = i;
    this.refresh();
  }

  private refresh(): void {
    this.items.forEach((item, i) => item.text?.setScale(i === this.sel ? 1.12 : 1));
    const t = this.items[this.sel].text!;
    this.arrow.setPosition(t.x - t.displayWidth / 2 - 18, t.y).setColor(this.items[this.sel].color);
  }

  private activate(): void {
    AudioSystem.unlock();
    this.items[this.sel].action();
  }

  private start(): void {
    AudioSystem.unlock();
    this.scene.start('CharacterSelectScene');
  }
}
