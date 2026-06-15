import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import { MetaState } from '../state/MetaState';
import { AudioSystem } from '../systems/AudioSystem';
import { CHARACTERS } from '../data/characters';
import { STAGES } from '../data/stages';
import type { CharacterDef, StageDef } from '../types';
import type { MetaData } from '../state/MetaState';

/** Pre-run "Prepare" screen: pick a hero and a stage, then start the run. */
export class CharacterSelectScene extends Phaser.Scene {
  private meta!: MetaData;
  private chars: CharacterDef[] = [];
  private stages: StageDef[] = [];
  private selectedChar = 0;
  private selectedStage = 0;
  private charBorders: Phaser.GameObjects.Rectangle[] = [];
  private stageBorders: Phaser.GameObjects.Rectangle[] = [];
  private infoText!: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterSelectScene');
  }

  private unlocked(id?: string): boolean {
    return !id || this.meta.unlocked.includes(id);
  }

  create(): void {
    this.meta = MetaState.get();
    AudioSystem.unlock();
    const { width, height } = this.scale;

    this.add.tileSprite(0, 0, width, height, 'grass').setOrigin(0).setTileScale(GAME.spriteScale).setAlpha(0.4);
    this.add.rectangle(0, 0, width, height, 0x10101c, 0.7).setOrigin(0);

    this.add
      .text(width / 2, 30, 'PREPARE FOR THE NIGHT', {
        fontFamily: 'Georgia, serif',
        fontSize: '30px',
        color: '#f2c14e',
        stroke: '#21161f',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // --- Characters ---
    this.add.text(width / 2, 64, 'HERO', { fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#6ad8ff' }).setOrigin(0.5);
    this.chars = Object.values(CHARACTERS);
    const cardW = 150;
    const gap = 14;
    const totalW = this.chars.length * cardW + (this.chars.length - 1) * gap;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cy = 150;
    this.chars.forEach((c, i) => {
      const x = startX + i * (cardW + gap);
      const locked = !this.unlocked(c.unlockId);
      const border = this.add.rectangle(x, cy, cardW, 130, 0x1a1726).setStrokeStyle(3, 0x3f6fc0);
      this.charBorders.push(border);
      const spr = this.add.sprite(x, cy - 28, this.textureFor(c)).setScale(GAME.spriteScale * 2);
      const idle = `${c.spriteKey}-idle`;
      if (this.anims.exists(idle)) spr.play(idle);
      if (locked) spr.setTint(0x222233);
      this.add.text(x, cy + 20, locked ? '???' : c.name, {
        fontFamily: 'Georgia, serif', fontSize: '16px', color: locked ? '#6a7088' : '#ffffff',
      }).setOrigin(0.5);
      this.add.text(x, cy + 44, locked ? 'Locked' : 'Click to pick', {
        fontFamily: 'Courier New, monospace', fontSize: '10px', color: '#9aa0b4',
      }).setOrigin(0.5);
      if (!locked) {
        border.setInteractive({ useHandCursor: true });
        border.on('pointerdown', () => this.selectChar(i));
      }
    });

    // --- Stages ---
    this.add.text(width / 2, 234, 'STAGE', { fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#6ad8ff' }).setOrigin(0.5);
    this.stages = Object.values(STAGES);
    const sW = 220;
    const sGap = 16;
    const sTotal = this.stages.length * sW + (this.stages.length - 1) * sGap;
    const sStartX = (width - sTotal) / 2 + sW / 2;
    const sy = 300;
    this.stages.forEach((st, i) => {
      const x = sStartX + i * (sW + sGap);
      const locked = !this.unlocked(st.unlockId);
      const border = this.add.rectangle(x, sy, sW, 78, 0x1a1726).setStrokeStyle(3, 0x3f6fc0);
      this.stageBorders.push(border);
      this.add.text(x, sy - 22, locked ? '???' : st.name, {
        fontFamily: 'Georgia, serif', fontSize: '17px', color: locked ? '#6a7088' : '#ffffff',
      }).setOrigin(0.5);
      this.add.text(x, sy + 8, locked ? 'Locked — earn it in a run' : st.blurb, {
        fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#9aa0b4',
        align: 'center', wordWrap: { width: sW - 20 },
      }).setOrigin(0.5);
      if (!locked) {
        border.setInteractive({ useHandCursor: true });
        border.on('pointerdown', () => this.selectStage(i));
      }
    });

    this.infoText = this.add
      .text(width / 2, 378, '', { fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#cfd6e6', align: 'center', wordWrap: { width: width * 0.8 } })
      .setOrigin(0.5);

    // --- Begin / back ---
    const begin = this.add
      .text(width / 2, height - 56, '▶  BEGIN  (SPACE)', {
        fontFamily: 'Georgia, serif', fontSize: '26px', color: '#46d873', stroke: '#21161f', strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: begin, alpha: 0.5, yoyo: true, repeat: -1, duration: 800 });
    begin.on('pointerdown', () => this.begin());
    this.input.keyboard?.on('keydown-SPACE', () => this.begin());

    this.add
      .text(width / 2, height - 22, 'Esc: back   •   ← → choose hero', {
        fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#6a7088',
      })
      .setOrigin(0.5);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('TitleScene'));
    this.input.keyboard?.on('keydown-LEFT', () => this.cycleChar(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.cycleChar(1));

    // Default selection to first unlocked entries.
    this.selectedChar = this.chars.findIndex((c) => this.unlocked(c.unlockId));
    this.selectedStage = this.stages.findIndex((s) => this.unlocked(s.unlockId));
    this.refresh();
  }

  private textureFor(c: CharacterDef): string {
    return this.textures.exists(c.spriteKey) ? c.spriteKey : 'player';
  }

  private cycleChar(dir: number): void {
    const n = this.chars.length;
    for (let k = 0; k < n; k++) {
      this.selectedChar = (this.selectedChar + dir + n) % n;
      if (this.unlocked(this.chars[this.selectedChar].unlockId)) break;
    }
    this.refresh();
  }

  private selectChar(i: number): void {
    this.selectedChar = i;
    this.refresh();
  }

  private selectStage(i: number): void {
    this.selectedStage = i;
    this.refresh();
  }

  private refresh(): void {
    this.charBorders.forEach((b, i) =>
      b.setStrokeStyle(3, i === this.selectedChar ? 0xf2c14e : 0x3f6fc0)
    );
    this.stageBorders.forEach((b, i) =>
      b.setStrokeStyle(3, i === this.selectedStage ? 0xf2c14e : 0x3f6fc0)
    );
    const c = this.chars[this.selectedChar];
    if (c) this.infoText.setText(c.blurb);
  }

  private begin(): void {
    const character = this.chars[this.selectedChar];
    const stage = this.stages[this.selectedStage];
    if (!character || !stage) return;
    if (!this.unlocked(character.unlockId) || !this.unlocked(stage.unlockId)) return;
    AudioSystem.buy();
    this.scene.start('GameScene', { character, stage, meta: this.meta });
  }
}
