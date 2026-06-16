import Phaser from 'phaser';
import { EVENTS } from '../util/Events';
import { GAME } from '../config/GameConfig';
import type { LoadoutView } from '../types';
import type { GameScene } from './GameScene';

/**
 * HUD overlay rendered above the GameScene. Reacts to gameplay events; never
 * touches the simulation. Runs in parallel with GameScene (and keeps running while
 * GameScene is paused for level-up, so the bars stay visible).
 */
export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;

  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Rectangle;
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;

  private bossContainer!: Phaser.GameObjects.Container;
  private bossBar!: Phaser.GameObjects.Rectangle;
  private bossLabel!: Phaser.GameObjects.Text;
  private bossBarWidth = 0;

  private loadoutContainer!: Phaser.GameObjects.Container;

  private dashLabel!: Phaser.GameObjects.Text;
  private dashBar!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.gameScene = this.scene.get('GameScene') as GameScene;
    const { width } = this.scale;
    const pad = 16;

    // --- XP bar (full-width, top) ---
    this.add.rectangle(0, 0, width, 10, 0x000000, 0.6).setOrigin(0);
    this.xpBar = this.add.rectangle(0, 0, 0, 10, 0x6ad8ff).setOrigin(0);

    // --- Level badge ---
    this.levelText = this.add
      .text(pad, 18, 'LV 1', {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: '#f2c14e',
        stroke: '#21161f',
        strokeThickness: 4,
      })
      .setOrigin(0, 0);

    // --- HP bar ---
    const hpY = 50;
    this.add
      .rectangle(pad, hpY, 220, 18, 0x3a0e14)
      .setOrigin(0)
      .setStrokeStyle(2, 0x21161f);
    this.hpBar = this.add.rectangle(pad + 2, hpY + 2, 216, 14, 0x46d873).setOrigin(0);
    this.hpText = this.add
      .text(pad + 110, hpY + 9, '100 / 100', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // --- Timer (top center) ---
    this.timerText = this.add
      .text(width / 2, 22, '0:00', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#ffffff',
        stroke: '#21161f',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // --- Gold + kills (top right) ---
    this.goldText = this.add
      .text(width - pad, 18, '🪙 0', {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: '#f2c14e',
      })
      .setOrigin(1, 0);
    this.killsText = this.add
      .text(width - pad, 44, '☠ 0', {
        fontFamily: 'Courier New, monospace',
        fontSize: '16px',
        color: '#cfd6e6',
      })
      .setOrigin(1, 0);

    // --- Boss bar (hidden until a boss spawns) ---
    const { height } = this.scale;
    this.bossBarWidth = width * 0.6;
    const bx = (width - this.bossBarWidth) / 2;
    const by = height - 36;
    const bg = this.add
      .rectangle(0, 0, this.bossBarWidth, 16, 0x160a14)
      .setOrigin(0)
      .setStrokeStyle(2, 0xff486a);
    this.bossBar = this.add.rectangle(2, 2, this.bossBarWidth - 4, 12, 0xc43358).setOrigin(0);
    this.bossLabel = this.add
      .text(this.bossBarWidth / 2, -14, 'BOSS', {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#ff486a',
      })
      .setOrigin(0.5, 1);
    this.bossContainer = this.add
      .container(bx, by, [bg, this.bossBar, this.bossLabel])
      .setVisible(false);

    // --- Loadout bar (weapon + passive icons), refreshed on change ---
    this.loadoutContainer = this.add.container(pad, 78);

    // Dash cooldown pip.
    this.dashLabel = this.add
      .text(pad, height - 46, '⚡ DASH', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#6ad8ff',
      })
      .setOrigin(0, 0.5);
    this.add.rectangle(pad + 66, height - 46, 60, 8, 0x1a1726).setOrigin(0, 0.5).setStrokeStyle(1, 0x3f6fc0);
    this.dashBar = this.add.rectangle(pad + 67, height - 46, 58, 6, 0x6ad8ff).setOrigin(0, 0.5);

    // Pause hint.
    this.add
      .text(pad, height - 22, 'Esc / P: Pause  •  Shift/Space: Dash', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#6a7088',
      })
      .setOrigin(0, 0);

    // Touch-only on-screen controls (movement is the on-screen joystick in GameScene).
    if (this.game.device.input.touch) this.createTouchButtons(width, height);

    this.bindEvents();
  }

  private createTouchButtons(width: number, height: number): void {
    const mkButton = (x: number, y: number, r: number, label: string, fontSize: string, onTap: () => void) => {
      const circle = this.add.circle(x, y, r, 0x1a1726, 0.6).setStrokeStyle(2, 0x6ad8ff, 0.8);
      this.add
        .text(x, y, label, { fontFamily: 'Georgia, serif', fontSize, color: '#cfd6e6' })
        .setOrigin(0.5);
      circle.setInteractive({ useHandCursor: true });
      circle.on('pointerdown', (_p: Phaser.Input.Pointer, _lx: number, _ly: number, e: Phaser.Types.Input.EventData) => {
        e?.stopPropagation?.();
        onTap();
      });
    };

    // Dash (bottom-right).
    mkButton(width - 54, height - 54, 38, '⚡', '26px', () => {
      if (!this.gameScene.scene.isPaused()) this.gameScene.player?.tryDash();
    });
    // Pause (top-right, below the gold/kills readouts).
    mkButton(width - 30, 92, 22, '❚❚', '16px', () => this.gameScene.requestPause());
  }

  /** Rebuild the compact weapon/passive icon row from a loadout snapshot. */
  private rebuildLoadout(view: LoadoutView): void {
    this.loadoutContainer.removeAll(true);
    const cell = 30;
    let x = 0;

    const addChip = (icon: string, badge: string, tint?: number) => {
      const bg = this.add
        .rectangle(x, 0, cell - 4, cell - 4, 0x1a1726, 0.85)
        .setOrigin(0)
        .setStrokeStyle(1, 0x3f6fc0);
      const img = this.add
        .image(x + (cell - 4) / 2, (cell - 4) / 2, icon)
        .setScale(GAME.spriteScale * 0.5);
      if (tint !== undefined) img.setTint(tint);
      const txt = this.add
        .text(x + cell - 6, cell - 8, badge, {
          fontFamily: 'Courier New, monospace',
          fontSize: '10px',
          color: '#f2c14e',
        })
        .setOrigin(1, 1);
      this.loadoutContainer.add([bg, img, txt]);
      x += cell;
    };

    for (const w of view.weapons) {
      addChip(w.icon, w.level >= w.maxLevel ? 'MAX' : `${w.level}`);
    }
    // Small gap then passives.
    if (view.passives.length > 0) x += 8;
    for (const p of view.passives) {
      addChip(p.icon, p.count > 1 ? `x${p.count}` : '');
    }
  }

  private bindEvents(): void {
    const ev = this.gameScene.events;
    ev.on(EVENTS.HP_CHANGED, this.onHp, this);
    ev.on(EVENTS.XP_CHANGED, this.onXp, this);
    ev.on(EVENTS.TIMER, this.onTimer, this);
    ev.on(EVENTS.GOLD_CHANGED, (g: number) => this.goldText.setText(`🪙 ${g}`));
    ev.on(EVENTS.KILLS_CHANGED, (k: number) => this.killsText.setText(`☠ ${k}`));
    ev.on(EVENTS.BOSS_SPAWNED, (name: string) => {
      this.bossLabel.setText((name ?? 'BOSS').toUpperCase());
      this.bossContainer.setVisible(true);
    });
    ev.on(EVENTS.BOSS_DIED, () => this.bossContainer.setVisible(false));
    ev.on(EVENTS.LOADOUT_CHANGED, this.rebuildLoadout, this);

    // Clean up listeners if this scene shuts down.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      ev.off(EVENTS.HP_CHANGED, this.onHp, this);
      ev.off(EVENTS.XP_CHANGED, this.onXp, this);
      ev.off(EVENTS.TIMER, this.onTimer, this);
      ev.off(EVENTS.LOADOUT_CHANGED, this.rebuildLoadout, this);
    });
  }

  private onHp(hp: number, maxHp: number): void {
    const frac = Phaser.Math.Clamp(hp / maxHp, 0, 1);
    this.hpBar.width = 216 * frac;
    this.hpBar.fillColor = frac > 0.5 ? 0x46d873 : frac > 0.25 ? 0xf2c14e : 0xff5a5a;
    this.hpText.setText(`${Math.ceil(hp)} / ${maxHp}`);
  }

  private onXp(progress: number, level: number): void {
    this.xpBar.width = this.scale.width * Phaser.Math.Clamp(progress, 0, 1);
    this.levelText.setText(`LV ${level}`);
  }

  private onTimer(elapsed: number): void {
    const m = Math.floor(elapsed / 60);
    const s = Math.floor(elapsed % 60);
    this.timerText.setText(`${m}:${String(s).padStart(2, '0')}`);
  }

  update(): void {
    // Live boss health bar.
    const boss = this.gameScene.boss;
    if (boss && boss.active && this.bossContainer.visible) {
      const frac = Phaser.Math.Clamp(boss.hp / boss.maxHp, 0, 1);
      this.bossBar.width = (this.bossBarWidth - 4) * frac;
    }

    // Dash cooldown pip.
    const player = this.gameScene.player;
    if (player) {
      const ready = 1 - player.dashCooldownProgress;
      this.dashBar.width = 58 * ready;
      this.dashBar.fillColor = ready >= 1 ? 0x6ad8ff : 0x3a5a7a;
      this.dashLabel.setColor(ready >= 1 ? '#6ad8ff' : '#6a7088');
    }
  }
}
