import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import { MetaState, type MetaSettings } from '../state/MetaState';
import { AudioSystem } from '../systems/AudioSystem';

interface SettingsData {
  from?: 'title' | 'pause';
}

/** Audio + display settings. Persisted to MetaState and applied live to AudioSystem. */
export class SettingsScene extends Phaser.Scene {
  private settings!: MetaSettings;
  private from: 'title' | 'pause' = 'title';

  constructor() {
    super('SettingsScene');
  }

  init(data: SettingsData): void {
    this.from = data?.from ?? 'title';
  }

  create(): void {
    this.settings = { ...MetaState.get().settings };
    const { width, height } = this.scale;

    if (this.from === 'title') {
      this.add.tileSprite(0, 0, width, height, 'grass').setOrigin(0).setTileScale(GAME.spriteScale).setAlpha(0.35);
    }
    this.add.rectangle(0, 0, width, height, 0x05050c, this.from === 'title' ? 0.7 : 0.85).setOrigin(0);

    this.add
      .text(width / 2, height * 0.16, 'SETTINGS', {
        fontFamily: 'Georgia, serif', fontSize: '36px', color: '#f2c14e', stroke: '#21161f', strokeThickness: 5,
      })
      .setOrigin(0.5);

    let y = height * 0.34;
    const step = 52;
    this.volumeRow('Master Volume', y, 'master'); y += step;
    this.volumeRow('Music Volume', y, 'music'); y += step;
    this.volumeRow('SFX Volume', y, 'sfx'); y += step;
    this.toggleRow('Mute All', y, 'muted'); y += step;
    this.toggleRow('Damage Numbers', y, 'showDamage'); y += step;

    const back = this.add
      .text(width / 2, height * 0.88, this.from === 'pause' ? '◀  Back (Esc)' : '◀  Back to Title (Esc)', {
        fontFamily: 'Courier New, monospace', fontSize: '18px', color: '#cfd6e6',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.close());
    this.input.keyboard?.on('keydown-ESC', () => this.close());
  }

  private persist(): void {
    MetaState.setSettings(this.settings);
    AudioSystem.configure(this.settings);
  }

  private volumeRow(label: string, y: number, key: 'master' | 'music' | 'sfx'): void {
    const { width } = this.scale;
    const cx = width / 2;
    this.add.text(cx - 220, y, label, { fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0, 0.5);
    const valText = this.add.text(cx + 150, y, '', { fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#6ad8ff' }).setOrigin(0.5);
    const draw = () => valText.setText(`${Math.round(this.settings[key] * 100)}%`);
    const mk = (dx: number, sym: string, delta: number) => {
      const b = this.add.text(cx + dx, y, sym, { fontFamily: 'Georgia, serif', fontSize: '24px', color: '#f2c14e' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => {
        this.settings[key] = Phaser.Math.Clamp(Math.round((this.settings[key] + delta) * 100) / 100, 0, 1);
        this.persist();
        draw();
      });
    };
    mk(90, '–', -0.1);
    mk(210, '+', 0.1);
    draw();
  }

  private toggleRow(label: string, y: number, key: 'muted' | 'showDamage'): void {
    const { width } = this.scale;
    const cx = width / 2;
    this.add.text(cx - 220, y, label, { fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0, 0.5);
    const btn = this.add.text(cx + 150, y, '', { fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#6ad8ff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const draw = () => {
      const on = this.settings[key];
      btn.setText(on ? 'ON' : 'OFF').setColor(on ? '#46d873' : '#aa5555');
    };
    btn.on('pointerdown', () => {
      this.settings[key] = !this.settings[key];
      this.persist();
      draw();
    });
    draw();
  }

  private close(): void {
    if (this.from === 'pause') this.scene.stop();
    else this.scene.start('TitleScene');
  }
}
