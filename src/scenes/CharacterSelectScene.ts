import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import { MetaState } from '../state/MetaState';
import { SaveState } from '../state/SaveState';
import { AudioSystem } from '../systems/AudioSystem';
import { CHARACTERS } from '../data/characters';
import { STAGES } from '../data/stages';
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from '../data/difficulty';
import type { CharacterDef, StageDef, DifficultyDef } from '../types';
import type { MetaData } from '../state/MetaState';

/** Pre-run "Prepare" screen: pick a hero, stage, and difficulty, then start the run. */
export class CharacterSelectScene extends Phaser.Scene {
  private meta!: MetaData;
  private chars: CharacterDef[] = [];
  private stages: StageDef[] = [];
  private diffs: DifficultyDef[] = [];
  private selectedChar = 0;
  private selectedStage = 0;
  private selectedDiff = 1;
  private charBorders: Phaser.GameObjects.Rectangle[] = [];
  private stageBorders: Phaser.GameObjects.Rectangle[] = [];
  private diffBorders: Phaser.GameObjects.Rectangle[] = [];
  private infoText!: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterSelectScene');
  }

  private unlocked(id?: string): boolean {
    return !id || this.meta.unlocked.includes(id);
  }

  create(): void {
    this.meta = MetaState.get();
    this.charBorders = [];
    this.stageBorders = [];
    this.diffBorders = [];
    AudioSystem.unlock();
    const { width, height } = this.scale;

    this.add.tileSprite(0, 0, width, height, 'grass').setOrigin(0).setTileScale(GAME.spriteScale).setAlpha(0.4);
    this.add.rectangle(0, 0, width, height, 0x10101c, 0.7).setOrigin(0);

    this.add
      .text(width / 2, 26, 'PREPARE FOR THE NIGHT', {
        fontFamily: 'Georgia, serif', fontSize: '28px', color: '#f2c14e', stroke: '#21161f', strokeThickness: 5,
      })
      .setOrigin(0.5);

    // --- Characters ---
    this.add.text(width / 2, 56, 'HERO', { fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#6ad8ff' }).setOrigin(0.5);
    this.chars = Object.values(CHARACTERS);
    const cardW = 148;
    const gap = 12;
    const totalW = this.chars.length * cardW + (this.chars.length - 1) * gap;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cy = 128;
    this.chars.forEach((c, i) => {
      const x = startX + i * (cardW + gap);
      const locked = !this.unlocked(c.unlockId);
      const border = this.add.rectangle(x, cy, cardW, 116, 0x1a1726).setStrokeStyle(3, 0x3f6fc0);
      this.charBorders.push(border);
      const spr = this.add.sprite(x, cy - 26, this.textureFor(c)).setScale(GAME.spriteScale * 1.8);
      const idle = `${c.spriteKey}-idle`;
      if (this.anims.exists(idle)) spr.play(idle);
      if (locked) spr.setTint(0x222233);
      this.add.text(x, cy + 16, locked ? '???' : c.name, {
        fontFamily: 'Georgia, serif', fontSize: '15px', color: locked ? '#6a7088' : '#ffffff',
      }).setOrigin(0.5);
      this.add.text(x, cy + 38, locked ? 'Locked' : 'Click to pick', {
        fontFamily: 'Courier New, monospace', fontSize: '10px', color: '#9aa0b4',
      }).setOrigin(0.5);
      if (!locked) {
        border.setInteractive({ useHandCursor: true });
        border.on('pointerdown', () => this.selectChar(i));
      }
    });

    // --- Stages ---
    this.add.text(width / 2, 200, 'STAGE', { fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#6ad8ff' }).setOrigin(0.5);
    this.stages = Object.values(STAGES);
    const sW = 220;
    const sGap = 16;
    const sTotal = this.stages.length * sW + (this.stages.length - 1) * sGap;
    const sStartX = (width - sTotal) / 2 + sW / 2;
    const sy = 252;
    this.stages.forEach((st, i) => {
      const x = sStartX + i * (sW + sGap);
      const locked = !this.unlocked(st.unlockId);
      const border = this.add.rectangle(x, sy, sW, 66, 0x1a1726).setStrokeStyle(3, 0x3f6fc0);
      this.stageBorders.push(border);
      this.add.text(x, sy - 18, locked ? '???' : st.name, {
        fontFamily: 'Georgia, serif', fontSize: '16px', color: locked ? '#6a7088' : '#ffffff',
      }).setOrigin(0.5);
      this.add.text(x, sy + 8, locked ? 'Locked — earn it in a run' : st.blurb, {
        fontFamily: 'Courier New, monospace', fontSize: '10px', color: '#9aa0b4',
        align: 'center', wordWrap: { width: sW - 20 },
      }).setOrigin(0.5);
      if (!locked) {
        border.setInteractive({ useHandCursor: true });
        border.on('pointerdown', () => this.selectStage(i));
      }
    });

    // --- Difficulty ---
    this.add.text(width / 2, 312, 'DIFFICULTY', { fontFamily: 'Courier New, monospace', fontSize: '13px', color: '#6ad8ff' }).setOrigin(0.5);
    this.diffs = Object.values(DIFFICULTIES);
    const dW = 150;
    const dGap = 16;
    const dTotal = this.diffs.length * dW + (this.diffs.length - 1) * dGap;
    const dStartX = (width - dTotal) / 2 + dW / 2;
    const dy = 348;
    this.diffs.forEach((d, i) => {
      const x = dStartX + i * (dW + dGap);
      const border = this.add.rectangle(x, dy, dW, 38, 0x1a1726).setStrokeStyle(3, 0x3f6fc0);
      this.diffBorders.push(border);
      this.add.text(x, dy, d.name, {
        fontFamily: 'Georgia, serif', fontSize: '17px', color: '#ffffff',
      }).setOrigin(0.5);
      border.setInteractive({ useHandCursor: true });
      border.on('pointerdown', () => this.selectDiff(i));
    });

    this.infoText = this.add
      .text(width / 2, 392, '', { fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#cfd6e6', align: 'center', wordWrap: { width: width * 0.85 } })
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
      .text(width / 2, height - 22, 'Esc: back   •   ← → hero   •   1/2/3 difficulty', {
        fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#6a7088',
      })
      .setOrigin(0.5);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('TitleScene'));
    this.input.keyboard?.on('keydown-LEFT', () => this.cycleChar(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.cycleChar(1));
    this.input.keyboard?.on('keydown-ONE', () => this.selectDiff(0));
    this.input.keyboard?.on('keydown-TWO', () => this.selectDiff(1));
    this.input.keyboard?.on('keydown-THREE', () => this.selectDiff(2));

    // Default selections.
    this.selectedChar = Math.max(0, this.chars.findIndex((c) => this.unlocked(c.unlockId)));
    this.selectedStage = Math.max(0, this.stages.findIndex((s) => this.unlocked(s.unlockId)));
    const lastDiff = this.meta.settings.lastDifficulty ?? DEFAULT_DIFFICULTY;
    this.selectedDiff = Math.max(0, this.diffs.findIndex((d) => d.id === lastDiff));
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

  private selectDiff(i: number): void {
    if (i < 0 || i >= this.diffs.length) return;
    this.selectedDiff = i;
    this.refresh();
  }

  private refresh(): void {
    this.charBorders.forEach((b, i) => b.setStrokeStyle(3, i === this.selectedChar ? 0xf2c14e : 0x3f6fc0));
    this.stageBorders.forEach((b, i) => b.setStrokeStyle(3, i === this.selectedStage ? 0xf2c14e : 0x3f6fc0));
    this.diffBorders.forEach((b, i) => b.setStrokeStyle(3, i === this.selectedDiff ? 0xf2c14e : 0x3f6fc0));
    const c = this.chars[this.selectedChar];
    const d = this.diffs[this.selectedDiff];
    this.infoText.setText(`${c ? c.blurb : ''}\n${d ? d.name + ' — ' + d.blurb : ''}`);
  }

  private begin(): void {
    const character = this.chars[this.selectedChar];
    const stage = this.stages[this.selectedStage];
    const difficulty = this.diffs[this.selectedDiff];
    if (!character || !stage || !difficulty) return;
    if (!this.unlocked(character.unlockId) || !this.unlocked(stage.unlockId)) return;
    MetaState.setSettings({ lastDifficulty: difficulty.id });
    SaveState.clear(); // starting fresh abandons any in-progress run
    AudioSystem.buy();
    this.scene.start('GameScene', { character, stage, difficulty, meta: this.meta });
  }
}
