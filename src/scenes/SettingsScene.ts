import Phaser from 'phaser';
import { GAME, VERSION, CREDITS } from '../config/GameConfig';
import { MetaState, type MetaSettings } from '../state/MetaState';
import { AudioSystem } from '../systems/AudioSystem';
import { Haptics } from '../util/Haptics';

interface SettingsData {
  from?: 'title' | 'pause';
}

type ToggleKey = 'muted' | 'showDamage' | 'reducedMotion' | 'haptics';

/** Audio, display & accessibility settings, plus About / reset progress. */
export class SettingsScene extends Phaser.Scene {
  private settings!: MetaSettings;
  private from: 'title' | 'pause' = 'title';
  private resetArmed = false;

  constructor() {
    super('SettingsScene');
  }

  init(data: SettingsData): void {
    this.from = data?.from ?? 'title';
    this.resetArmed = false;
  }

  create(): void {
    this.settings = { ...MetaState.get().settings };
    const { width, height } = this.scale;

    if (this.from === 'title') {
      this.add.tileSprite(0, 0, width, height, 'grass').setOrigin(0).setTileScale(GAME.spriteScale).setAlpha(0.35);
    }
    this.add.rectangle(0, 0, width, height, 0x05050c, this.from === 'title' ? 0.7 : 0.88).setOrigin(0);

    this.add
      .text(width / 2, 28, 'SETTINGS', {
        fontFamily: 'Georgia, serif', fontSize: '32px', color: '#f2c14e', stroke: '#21161f', strokeThickness: 5,
      })
      .setOrigin(0.5);

    let y = 78;
    const step = 40;
    this.volumeRow('Master Volume', y, 'master'); y += step;
    this.volumeRow('Music Volume', y, 'music'); y += step;
    this.volumeRow('SFX Volume', y, 'sfx'); y += step;
    this.toggleRow('Mute All', y, 'muted'); y += step;
    this.toggleRow('Damage Numbers', y, 'showDamage'); y += step;
    this.toggleRow('Reduced Motion', y, 'reducedMotion'); y += step;
    this.toggleRow('Haptics', y, 'haptics'); y += step;

    // Reset progress (two-tap confirm).
    const reset = this.add
      .text(width / 2, y + 10, 'Reset Progress', {
        fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#ff8a8a',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    reset.on('pointerdown', () => {
      if (!this.resetArmed) {
        this.resetArmed = true;
        reset.setText('Tap again to confirm wipe').setColor('#ff5a5a');
        return;
      }
      MetaState.reset();
      AudioSystem.configure(MetaState.get().settings);
      this.scene.start('TitleScene');
    });

    // About / version / privacy footer.
    this.add
      .text(width / 2, height - 46, CREDITS, {
        fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#6a7088', align: 'center', wordWrap: { width: width * 0.9 },
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height - 26, `${VERSION}  •  No data collected — progress is saved locally on this device.`, {
        fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#6a7088',
      })
      .setOrigin(0.5);

    const back = this.add
      .text(40, 28, this.from === 'pause' ? '◀ Back' : '◀ Title', {
        fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#cfd6e6',
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.close());
    this.input.keyboard?.on('keydown-ESC', () => this.close());
  }

  private persist(): void {
    MetaState.setSettings(this.settings);
    AudioSystem.configure(this.settings);
    Haptics.configure(this.settings.haptics);
  }

  private volumeRow(label: string, y: number, key: 'master' | 'music' | 'sfx'): void {
    const { width } = this.scale;
    const cx = width / 2;
    this.add.text(cx - 220, y, label, { fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#ffffff' }).setOrigin(0, 0.5);
    const valText = this.add.text(cx + 150, y, '', { fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#6ad8ff' }).setOrigin(0.5);
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

  private toggleRow(label: string, y: number, key: ToggleKey): void {
    const { width } = this.scale;
    const cx = width / 2;
    this.add.text(cx - 220, y, label, { fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#ffffff' }).setOrigin(0, 0.5);
    const btn = this.add.text(cx + 150, y, '', { fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#6ad8ff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
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
