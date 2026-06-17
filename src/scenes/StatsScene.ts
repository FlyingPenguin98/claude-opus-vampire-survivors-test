import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import { MetaState } from '../state/MetaState';
import { ACHIEVEMENTS } from '../data/achievements';
import { CHARACTERS } from '../data/characters';
import { STAGES } from '../data/stages';

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Lifetime statistics across all runs. */
export class StatsScene extends Phaser.Scene {
  constructor() {
    super('StatsScene');
  }

  create(): void {
    const { width, height } = this.scale;
    const meta = MetaState.get();

    this.add.tileSprite(0, 0, width, height, 'grass').setOrigin(0).setTileScale(GAME.spriteScale).setAlpha(0.35);
    this.add.rectangle(0, 0, width, height, 0x10101c, 0.8).setOrigin(0);

    this.add
      .text(width / 2, 36, 'STATISTICS', {
        fontFamily: 'Georgia, serif', fontSize: '32px', color: '#f2c14e', stroke: '#21161f', strokeThickness: 5,
      })
      .setOrigin(0.5);

    const chars = Object.values(CHARACTERS);
    const stages = Object.values(STAGES);
    const unlockedChars = chars.filter((c) => !c.unlockId || meta.unlocked.includes(c.unlockId)).length;
    const unlockedStages = stages.filter((s) => !s.unlockId || meta.unlocked.includes(s.unlockId)).length;

    const rows: [string, string][] = [
      ['Runs played', `${meta.runs}`],
      ['Best survival time', fmtTime(meta.bestTimeSec)],
      ['Best level reached', `${meta.bestLevel}`],
      ['Lifetime kills', `${meta.totalKills}`],
      ['Bosses defeated', `${meta.totalBossKills}`],
      ['Lifetime gold', `${meta.totalGold}`],
      ['Spendable gold', `${meta.spendableGold}`],
      ['Achievements', `${meta.achievements.length} / ${ACHIEVEMENTS.length}`],
      ['Characters unlocked', `${unlockedChars} / ${chars.length}`],
      ['Stages unlocked', `${unlockedStages} / ${stages.length}`],
    ];

    // Two columns of label/value rows.
    const colW = 420;
    const startX = (width - (colW * 2 + 20)) / 2;
    const startY = 92;
    const rowH = 34;
    rows.forEach(([label, value], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (colW + 20);
      const y = startY + row * rowH;
      this.add.text(x, y, label, { fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#cfd6e6' }).setOrigin(0, 0.5);
      this.add.text(x + colW - 8, y, value, { fontFamily: 'Courier New, monospace', fontSize: '15px', color: '#6ad8ff' }).setOrigin(1, 0.5);
    });

    // Best time per stage.
    let y = startY + Math.ceil(rows.length / 2) * rowH + 16;
    this.add.text(width / 2, y, 'BEST TIME PER STAGE', { fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#f2c14e' }).setOrigin(0.5);
    y += 28;
    for (const st of stages) {
      const best = meta.bestPerStage[st.id];
      const locked = st.unlockId && !meta.unlocked.includes(st.unlockId);
      this.add.text(width / 2 - 200, y, locked ? '???' : st.name, { fontFamily: 'Courier New, monospace', fontSize: '14px', color: locked ? '#6a7088' : '#ffffff' }).setOrigin(0, 0.5);
      this.add.text(width / 2 + 200, y, best ? fmtTime(best) : '—', { fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#6ad8ff' }).setOrigin(1, 0.5);
      y += 26;
    }

    const back = this.add
      .text(width / 2, height - 24, '◀  Back (Esc)', {
        fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#cfd6e6',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('TitleScene'));
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('TitleScene'));
  }
}
