import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import { MetaState } from '../state/MetaState';
import { ACHIEVEMENTS } from '../data/achievements';
import { CHARACTERS } from '../data/characters';
import { STAGES } from '../data/stages';

/** Pretty-name a content id that an achievement unlocks. */
function unlockLabel(id: string): string {
  for (const c of Object.values(CHARACTERS)) if (c.unlockId === id) return c.name;
  for (const s of Object.values(STAGES)) if (s.unlockId === id) return s.name;
  return id;
}

/** Lists every achievement with its earned/locked state and what it unlocks. */
export class AchievementsScene extends Phaser.Scene {
  constructor() {
    super('AchievementsScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const meta = MetaState.get();
    const earned = new Set(meta.achievements);

    this.add.tileSprite(0, 0, width, height, 'grass').setOrigin(0).setTileScale(GAME.spriteScale).setAlpha(0.35);
    this.add.rectangle(0, 0, width, height, 0x10101c, 0.78).setOrigin(0);

    this.add
      .text(width / 2, 28, 'ACHIEVEMENTS', {
        fontFamily: 'Georgia, serif', fontSize: '30px', color: '#f2c14e', stroke: '#21161f', strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 56, `${earned.size} / ${ACHIEVEMENTS.length} earned`, {
        fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#6ad8ff',
      })
      .setOrigin(0.5);

    // Two-column grid.
    const cols = 2;
    const colW = 440;
    const rowH = 56;
    const gridW = cols * colW + 20;
    const startX = (width - gridW) / 2;
    const startY = 84;
    ACHIEVEMENTS.forEach((a, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (colW + 20);
      const y = startY + row * rowH;
      const got = earned.has(a.id);
      this.add.rectangle(x, y, colW, rowH - 8, got ? 0x1f3320 : 0x1a1726, 0.85)
        .setOrigin(0, 0)
        .setStrokeStyle(2, got ? 0x46d873 : 0x3f3f50);
      this.add.text(x + 12, y + 8, got ? '✓' : '🔒', { fontSize: '18px' }).setOrigin(0, 0);
      this.add.text(x + 40, y + 7, a.name, {
        fontFamily: 'Georgia, serif', fontSize: '16px', color: got ? '#ffffff' : '#8a90a4',
      }).setOrigin(0, 0);
      const unlocks = a.unlocks?.length ? `  →  unlocks ${a.unlocks.map(unlockLabel).join(', ')}` : '';
      this.add.text(x + 40, y + 28, a.description + unlocks, {
        fontFamily: 'Courier New, monospace', fontSize: '11px', color: got ? '#bfe8c8' : '#6a7088',
        wordWrap: { width: colW - 52 },
      }).setOrigin(0, 0);
    });

    const back = this.add
      .text(width / 2, height - 22, '◀  Back (Esc)', {
        fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#cfd6e6',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('TitleScene'));
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }
}
