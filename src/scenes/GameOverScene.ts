import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import type { RunSummary } from '../types';
import type { MetaData } from '../state/MetaState';
import { CHARACTERS } from '../data/characters';
import { STAGES } from '../data/stages';

interface GameOverData {
  summary: RunSummary;
  meta: MetaData;
  newlyUnlocked: string[];
}

/** Pretty-name a freshly unlocked content id (character or stage). */
function unlockName(id: string): string {
  for (const c of Object.values(CHARACTERS)) if (c.unlockId === id) return `${c.name} (character)`;
  for (const s of Object.values(STAGES)) if (s.unlockId === id) return `${s.name} (stage)`;
  return id;
}

/** End-of-run summary with meta totals, unlocks, and a return prompt. */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverData): void {
    const { width, height } = this.scale;
    const { summary, meta, newlyUnlocked } = data;

    this.add
      .tileSprite(0, 0, width, height, STAGES[summary.stageId]?.tileKey ?? 'grass')
      .setOrigin(0)
      .setTileScale(GAME.spriteScale)
      .setAlpha(0.4);
    this.add.rectangle(0, 0, width, height, 0x10101c, 0.7).setOrigin(0);

    const victory = summary.victory;
    this.add
      .text(width / 2, height * 0.16, victory ? 'YOU SURVIVED' : 'YOU FELL', {
        fontFamily: 'Georgia, serif',
        fontSize: '54px',
        color: victory ? '#f2c14e' : '#ff5a5a',
        stroke: '#21161f',
        strokeThickness: 7,
      })
      .setOrigin(0.5);

    const m = Math.floor(summary.timeSec / 60);
    const s = Math.floor(summary.timeSec % 60);
    const timeStr = `${m}:${String(s).padStart(2, '0')}`;
    const isBest = Math.abs(meta.bestTimeSec - summary.timeSec) < 0.5 && meta.runs > 0;

    const lines = [
      `Stage:           ${STAGES[summary.stageId]?.name ?? summary.stageId}`,
      `Hero:            ${CHARACTERS[summary.characterId]?.name ?? summary.characterId}`,
      `Time Survived:   ${timeStr}${isBest ? '   ★ NEW BEST' : ''}`,
      `Level Reached:   ${summary.level}`,
      `Enemies Slain:   ${summary.kills}`,
      `Gold Collected:  ${summary.gold}`,
    ];
    this.add
      .text(width / 2, height * 0.43, lines, {
        fontFamily: 'Courier New, monospace',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 10,
      })
      .setOrigin(0.5);

    let y = height * 0.66;
    if (newlyUnlocked.length > 0) {
      this.add
        .text(width / 2, y, `✦ Unlocked: ${newlyUnlocked.map(unlockName).join(', ')}`, {
          fontFamily: 'Courier New, monospace',
          fontSize: '15px',
          color: '#6ad8ff',
          align: 'center',
          wordWrap: { width: width * 0.8 },
        })
        .setOrigin(0.5);
      y += 30;
    }

    this.add
      .text(width / 2, y, `Spendable Gold: ${meta.spendableGold}   •   Runs: ${meta.runs}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '15px',
        color: '#f2c14e',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height * 0.85, 'Press SPACE to return to title', {
        fontFamily: 'Courier New, monospace',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.2, yoyo: true, repeat: -1, duration: 700 });

    const restart = () => this.scene.start('TitleScene');
    this.time.delayedCall(500, () => {
      this.input.keyboard?.once('keydown-SPACE', restart);
      this.input.once('pointerdown', restart);
    });
  }
}
