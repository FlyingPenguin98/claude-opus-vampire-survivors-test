import Phaser from 'phaser';
import { GAME, PLAYER } from '../config/GameConfig';
import type { RunState } from '../state/RunState';

/**
 * The player avatar. Handles WASD movement, walk/idle animation, facing flip, and
 * post-hit invulnerability frames. Combat damage is applied externally by GameScene.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private keys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private invulnUntil = 0;
  private run: RunState;
  /** A soft shadow drawn under the player for grounding. */
  private shadow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, run: RunState) {
    super(scene, x, y, 'player');
    this.run = run;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(GAME.spriteScale);
    this.setDepth(50);
    this.setCollideWorldBounds(true);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(
      PLAYER.bodyRadius,
      8 - PLAYER.bodyRadius,
      9 - PLAYER.bodyRadius
    );

    this.shadow = scene.add
      .image(x, y + 6 * GAME.spriteScale, 'shadow')
      .setScale(GAME.spriteScale * 1.2, GAME.spriteScale * 0.6)
      .setDepth(40)
      .setAlpha(0.5);

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.keys = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.play('player-idle');
  }

  get isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnUntil;
  }

  /** Begin i-frames and a blink flash. Returns false if currently invulnerable. */
  takeHit(): boolean {
    if (this.isInvulnerable) return false;
    this.invulnUntil = this.scene.time.now + PLAYER.invulnSeconds * 1000;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      yoyo: true,
      repeat: 3,
      duration: PLAYER.invulnSeconds * 125,
      onComplete: () => this.setAlpha(1),
    });
    return true;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    const left = this.keys.left.isDown || this.cursors.left.isDown;
    const right = this.keys.right.isDown || this.cursors.right.isDown;
    const up = this.keys.up.isDown || this.cursors.up.isDown;
    const down = this.keys.down.isDown || this.cursors.down.isDown;

    const dir = new Phaser.Math.Vector2(
      (right ? 1 : 0) - (left ? 1 : 0),
      (down ? 1 : 0) - (up ? 1 : 0)
    );

    const speed = PLAYER.speed * this.run.moveSpeedMult;
    if (dir.lengthSq() > 0) {
      dir.normalize().scale(speed);
      this.setVelocity(dir.x, dir.y);
      if (left) this.setFlipX(true);
      else if (right) this.setFlipX(false);
      if (this.anims.currentAnim?.key !== 'player-walk') this.play('player-walk');
    } else {
      this.setVelocity(0, 0);
      if (this.anims.currentAnim?.key !== 'player-idle') this.play('player-idle');
    }

    // Keep the shadow anchored beneath the feet.
    this.shadow.setPosition(this.x, this.y + 5 * GAME.spriteScale);
  }

  destroy(fromScene?: boolean): void {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
