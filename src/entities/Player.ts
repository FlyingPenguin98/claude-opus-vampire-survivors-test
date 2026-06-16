import Phaser from 'phaser';
import { GAME, PLAYER } from '../config/GameConfig';
import { AudioSystem } from '../systems/AudioSystem';
import type { RunState } from '../state/RunState';

/**
 * The player avatar. Handles WASD movement, an active dash/dodge (Shift/Space) with
 * brief i-frames, walk/idle animation, facing flip, and post-hit invulnerability.
 * Combat damage is applied externally by GameScene.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private keys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  private dashKeys: Phaser.Input.Keyboard.Key[] = [];
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private invulnUntil = 0;
  private dashUntil = 0;
  private dashCdUntil = 0;
  private facing = new Phaser.Math.Vector2(1, 0);
  private run: RunState;
  /** Animation key prefix for this character's sprite. */
  private spriteKey: string;
  /** A soft shadow drawn under the player for grounding. */
  private shadow: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number, run: RunState, spriteKey = 'player') {
    super(scene, x, y, spriteKey);
    this.run = run;
    this.spriteKey = spriteKey;
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
    this.dashKeys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    ];

    this.play(`${this.spriteKey}-idle`);
  }

  get isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnUntil;
  }

  /** 0 = dash ready, 1 = just used (for the HUD pip). */
  get dashCooldownProgress(): number {
    const now = this.scene.time.now;
    if (now >= this.dashCdUntil) return 0;
    return (this.dashCdUntil - now) / PLAYER.dashCooldownMs;
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
    if (dir.lengthSq() > 0) this.facing.copy(dir).normalize();

    // Dash trigger (Shift / Space) — burst in move dir (or facing) with i-frames.
    const dashPressed = this.dashKeys.some((k) => Phaser.Input.Keyboard.JustDown(k));
    if (dashPressed && time >= this.dashCdUntil) {
      const d = (dir.lengthSq() > 0 ? dir.clone().normalize() : this.facing.clone()).scale(PLAYER.dashSpeed);
      this.setVelocity(d.x, d.y);
      this.dashUntil = time + PLAYER.dashDurationMs;
      this.dashCdUntil = time + PLAYER.dashCooldownMs;
      this.invulnUntil = Math.max(this.invulnUntil, time + PLAYER.dashInvulnMs);
      if (d.x < 0) this.setFlipX(true);
      else if (d.x > 0) this.setFlipX(false);
      this.scene.tweens.add({ targets: this, alpha: 0.4, yoyo: true, duration: PLAYER.dashDurationMs / 2, onComplete: () => this.setAlpha(1) });
      AudioSystem.dash();
    }

    // While dashing, keep the burst velocity and skip normal movement.
    if (time < this.dashUntil) {
      this.shadow.setPosition(this.x, this.y + 5 * GAME.spriteScale);
      return;
    }

    const speed = PLAYER.speed * this.run.moveSpeedMult;
    if (dir.lengthSq() > 0) {
      dir.normalize().scale(speed);
      this.setVelocity(dir.x, dir.y);
      if (left) this.setFlipX(true);
      else if (right) this.setFlipX(false);
      const walk = `${this.spriteKey}-walk`;
      if (this.anims.currentAnim?.key !== walk) this.play(walk);
    } else {
      this.setVelocity(0, 0);
      const idle = `${this.spriteKey}-idle`;
      if (this.anims.currentAnim?.key !== idle) this.play(idle);
    }

    // Keep the shadow anchored beneath the feet.
    this.shadow.setPosition(this.x, this.y + 5 * GAME.spriteScale);
  }

  destroy(fromScene?: boolean): void {
    this.shadow?.destroy();
    super.destroy(fromScene);
  }
}
