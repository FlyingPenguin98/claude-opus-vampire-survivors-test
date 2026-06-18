import Phaser from 'phaser';
import { GAME } from '../config/GameConfig';
import { WEAPONS } from '../data/weapons';
import { ENEMIES } from '../data/enemies';
import { BOSSES } from '../data/bosses';
import { PASSIVE_UPGRADES } from '../data/upgrades';

interface Entry {
  icon: string;
  name: string;
  sub: string;
}

/** Title-case a hyphen/underscore id, e.g. 'magma-colossus' -> 'Magma Colossus'. */
function prettify(id: string): string {
  return id
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const TABS = ['Weapons', 'Enemies', 'Passives'] as const;
const PER_PAGE = 10;

/** A reference Codex: browse every weapon, enemy/boss, and passive in the game. */
export class CodexScene extends Phaser.Scene {
  private tab = 0;
  private page = 0;
  private tabTexts: Phaser.GameObjects.Text[] = [];
  private list!: Phaser.GameObjects.Container;
  private pageText!: Phaser.GameObjects.Text;

  constructor() {
    super('CodexScene');
  }

  create(): void {
    this.tab = 0;
    this.page = 0;
    this.tabTexts = [];
    const { width, height } = this.scale;

    this.add.tileSprite(0, 0, width, height, 'grass').setOrigin(0).setTileScale(GAME.spriteScale).setAlpha(0.35);
    this.add.rectangle(0, 0, width, height, 0x10101c, 0.82).setOrigin(0);

    this.add
      .text(width / 2, 28, 'CODEX', {
        fontFamily: 'Georgia, serif', fontSize: '30px', color: '#f2c14e', stroke: '#21161f', strokeThickness: 5,
      })
      .setOrigin(0.5);

    // Tabs.
    const tabY = 60;
    const tabGap = 160;
    const tabStart = width / 2 - tabGap;
    TABS.forEach((label, i) => {
      const t = this.add
        .text(tabStart + i * tabGap, tabY, label, {
          fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#9aa0b4',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => this.setTab(i));
      this.tabTexts.push(t);
    });
    this.input.keyboard?.on('keydown-ONE', () => this.setTab(0));
    this.input.keyboard?.on('keydown-TWO', () => this.setTab(1));
    this.input.keyboard?.on('keydown-THREE', () => this.setTab(2));
    this.input.keyboard?.on('keydown-LEFT', () => this.flip(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.flip(1));

    this.list = this.add.container(0, 0);

    // Pager.
    const prev = this.add.text(width / 2 - 90, height - 30, '◀', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#6ad8ff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const next = this.add.text(width / 2 + 90, height - 30, '▶', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#6ad8ff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    prev.on('pointerdown', () => this.flip(-1));
    next.on('pointerdown', () => this.flip(1));
    this.pageText = this.add.text(width / 2, height - 30, '', { fontFamily: 'Courier New, monospace', fontSize: '14px', color: '#cfd6e6' }).setOrigin(0.5);

    const back = this.add
      .text(40, 28, '◀ Title', { fontFamily: 'Courier New, monospace', fontSize: '16px', color: '#cfd6e6' })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('TitleScene'));
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('TitleScene'));

    this.render();
  }

  private entriesFor(tab: number): Entry[] {
    if (tab === 0) {
      return Object.values(WEAPONS).map((w) => ({
        icon: w.textureKey,
        name: w.name,
        sub: `${w.evolvedFrom ? 'Evolution · ' : ''}${w.type} · dmg ${w.damage}`,
      }));
    }
    if (tab === 1) {
      const regs = Object.values(ENEMIES).map((e) => ({
        icon: e.textureKey,
        name: prettify(e.id),
        sub: `${(e.chestChance ?? 0) >= 1 ? 'Elite · ' : ''}hp ${e.hp} · ${e.behavior}`,
      }));
      const bosses = Object.values(BOSSES).map((e) => ({
        icon: e.textureKey,
        name: e.name ?? prettify(e.id),
        sub: `Boss · hp ${e.hp}`,
      }));
      return [...regs, ...bosses];
    }
    return PASSIVE_UPGRADES.map((p) => ({ icon: p.icon, name: p.name, sub: p.description }));
  }

  private setTab(i: number): void {
    if (i === this.tab) return;
    this.tab = i;
    this.page = 0;
    this.render();
  }

  private flip(dir: number): void {
    const entries = this.entriesFor(this.tab);
    const pages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
    this.page = Phaser.Math.Wrap(this.page + dir, 0, pages);
    this.render();
  }

  private render(): void {
    const { width } = this.scale;
    this.tabTexts.forEach((t, i) => t.setColor(i === this.tab ? '#f2c14e' : '#9aa0b4').setScale(i === this.tab ? 1.1 : 1));

    this.list.removeAll(true);
    const entries = this.entriesFor(this.tab);
    const pages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
    const start = this.page * PER_PAGE;
    const slice = entries.slice(start, start + PER_PAGE);

    const colW = 440;
    const rowH = 62;
    const startX = (width - (colW * 2 + 16)) / 2;
    const startY = 96;
    slice.forEach((e, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (colW + 16);
      const y = startY + row * rowH;
      const bg = this.add.rectangle(x, y, colW, rowH - 8, 0x1a1726, 0.85).setOrigin(0, 0).setStrokeStyle(1, 0x3f3f50);
      const img = this.add.image(x + 26, y + (rowH - 8) / 2, e.icon).setScale(GAME.spriteScale * 0.8);
      // Clamp oversized icons (e.g. field textures) to the cell.
      if (img.displayWidth > 40) img.setDisplaySize(40, 40);
      const name = this.add.text(x + 52, y + 8, e.name, { fontFamily: 'Georgia, serif', fontSize: '15px', color: '#ffffff' }).setOrigin(0, 0);
      const sub = this.add.text(x + 52, y + 30, e.sub, { fontFamily: 'Courier New, monospace', fontSize: '11px', color: '#9aa0b4', wordWrap: { width: colW - 64 } }).setOrigin(0, 0);
      this.list.add([bg, img, name, sub]);
    });

    this.pageText.setText(`${this.page + 1} / ${pages}`);
  }
}
