import Phaser from 'phaser';

/**
 * A pooled floating damage number. Not a physics body — managed by a plain pool in
 * GameScene. Reused via spawn(); hides itself when its float-up tween completes.
 */
export class DamageNumber extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#21161f',
      strokeThickness: 3,
    });
    this.setOrigin(0.5).setDepth(60).setActive(false).setVisible(false);
  }

  spawn(x: number, y: number, amount: number, crit: boolean): void {
    this.setText(crit ? `${amount}!` : `${amount}`);
    this.setColor(crit ? '#ffd23a' : '#ffffff');
    this.setFontSize(crit ? 20 : 14);
    this.setPosition(x + Phaser.Math.Between(-6, 6), y - 8);
    this.setScale(1).setAlpha(1).setActive(true).setVisible(true);
    this.scene.tweens.add({
      targets: this,
      y: this.y - 28,
      alpha: 0,
      duration: 650,
      ease: 'Quad.out',
      onComplete: () => this.setActive(false).setVisible(false),
    });
  }
}
