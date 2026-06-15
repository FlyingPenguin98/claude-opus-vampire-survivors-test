import Phaser from 'phaser';
import { GAME, XP } from '../config/GameConfig';

/**
 * A pooled experience gem. Sits where it dropped until the player's pickup radius
 * reaches it, then accelerates toward the player ("magnet"). Three visual tiers map
 * to XP value. Also reused for gold coins (value 0, isGold flag).
 */
export class XPGem extends Phaser.Physics.Arcade.Sprite {
  value = 1;
  isGold = false;
  private magnetized = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Registration/physics handled by the owning Arcade Group (classType).
    super(scene, x, y, 'gem-blue');
    this.setDepth(15);
  }

  private textureForValue(value: number): string {
    if (value >= 5) return 'gem-gold';
    if (value >= 3) return 'gem-green';
    return 'gem-blue';
  }

  spawn(x: number, y: number, value: number, isGold = false): void {
    this.value = value;
    this.isGold = isGold;
    this.magnetized = false;
    const tex = isGold ? 'coin' : this.textureForValue(value);
    this.setTexture(tex);
    this.enableBody(true, x, y, true, true);
    this.setActive(true).setVisible(true);
    this.setScale(GAME.spriteScale);
    this.setVelocity(0, 0);

    const animKey = `${tex}-sparkle`;
    if (this.scene.anims.exists(animKey)) this.play(animKey);

    // Little pop when dropped.
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scale: GAME.spriteScale,
      duration: 150,
      ease: 'Back.out',
    });
  }

  /** Called each frame by the XP system with the player's position and pickup radius. */
  updateMagnet(px: number, py: number, radius: number): void {
    const dx = px - this.x;
    const dy = py - this.y;
    const distSq = dx * dx + dy * dy;
    if (this.magnetized || distSq < radius * radius) {
      this.magnetized = true;
      const angle = Math.atan2(dy, dx);
      this.setVelocity(Math.cos(angle) * XP.magnetSpeed, Math.sin(angle) * XP.magnetSpeed);
    }
  }

  kill(): void {
    this.disableBody(true, true);
    this.setActive(false).setVisible(false);
  }
}
