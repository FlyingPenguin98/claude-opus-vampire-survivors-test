import Phaser from 'phaser';
import { GAME, SPAWN } from '../config/GameConfig';
import { EVENTS } from '../util/Events';
import { RunState } from '../state/RunState';
import { MetaState } from '../state/MetaState';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { XPGem } from '../entities/XPGem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { XPSystem } from '../systems/XPSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { Spawner } from '../systems/Spawner';
import { STARTING_WEAPON } from '../data/weapons';
import type { UpgradeChoice } from '../types';

/**
 * The core simulation: owns the world, the player, all entity pools, and every
 * gameplay system. Drives them from update(), and routes all enemy damage through
 * a single `damageEnemy` path so projectile, aura, and orbit weapons behave alike.
 */
export class GameScene extends Phaser.Scene {
  private run!: RunState;
  private player!: Player;
  private playerPos = new Phaser.Math.Vector2();

  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private gems!: Phaser.Physics.Arcade.Group;

  private weapons!: WeaponSystem;
  private xp!: XPSystem;
  private upgrades!: UpgradeSystem;
  private spawner!: Spawner;

  private pendingLevelUps = 0;
  private leveling = false;
  private gameOver = false;
  private timerEmitAccum = 0;

  /** Current boss enemy, exposed so the UI can render its health bar. */
  boss?: Enemy;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.gameOver = false;
    this.leveling = false;
    this.pendingLevelUps = 0;
    this.run = new RunState();

    // World + background.
    this.physics.world.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.add
      .tileSprite(0, 0, GAME.worldWidth, GAME.worldHeight, 'grass')
      .setOrigin(0)
      .setTileScale(GAME.spriteScale)
      .setDepth(-10);

    // Player at the center of the world.
    const cx = GAME.worldWidth / 2;
    const cy = GAME.worldHeight / 2;
    this.player = new Player(this, cx, cy, this.run);
    this.playerPos.set(cx, cy);

    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setBackgroundColor(GAME.backgroundColor);

    // Entity pools.
    this.enemies = this.physics.add.group({
      classType: Enemy,
      maxSize: SPAWN.maxAlive,
    });
    this.projectiles = this.physics.add.group({
      classType: Projectile,
      maxSize: 500,
    });
    this.gems = this.physics.add.group({ classType: XPGem, maxSize: 800 });

    // Systems.
    this.xp = new XPSystem(this.run);
    this.weapons = new WeaponSystem({
      scene: this,
      run: this.run,
      player: this.player,
      enemies: this.enemies,
      getProjectile: () => this.projectiles.get() as Projectile | null,
      damageEnemy: (e, amt) => this.damageEnemy(e, amt),
    });
    this.weapons.addWeapon(STARTING_WEAPON);
    this.upgrades = new UpgradeSystem(this.run, this.weapons);
    this.spawner = new Spawner(this, this.enemies, this.playerPos, (b) =>
      this.onBossSpawned(b)
    );

    this.setupCollisions();

    // UI overlay.
    this.scene.launch('UIScene');
    // Push initial state to the UI once it is ready.
    this.time.delayedCall(0, () => this.emitFullState());
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      (p, e) => this.onProjectileHit(p as Projectile, e as Enemy),
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_pl, e) => this.onPlayerContact(e as Enemy),
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.gems,
      (_pl, g) => this.onCollectGem(g as XPGem),
      undefined,
      this
    );
  }

  // --- Combat ---

  private onProjectileHit(proj: Projectile, enemy: Enemy): void {
    if (!proj.active || !enemy.active) return;
    if (proj.alreadyHit(enemy)) return;
    this.damageEnemy(enemy, proj.damage);
    if (proj.onHit(enemy)) proj.kill();
  }

  /** Single source of truth for hurting an enemy (used by all weapon types). */
  private damageEnemy(enemy: Enemy, amount: number): void {
    if (!enemy.active) return;
    const dead = enemy.damage(amount);
    if (dead) this.killEnemy(enemy);
  }

  private killEnemy(enemy: Enemy): void {
    this.run.kills += 1;
    this.events.emit(EVENTS.KILLS_CHANGED, this.run.kills);

    this.spawnGem(enemy.x, enemy.y, enemy.def.xpValue, false);
    if (Math.random() < enemy.def.goldChance) {
      this.spawnGem(enemy.x, enemy.y, 0, true);
    }

    if (enemy.isBoss) {
      this.boss = undefined;
      this.events.emit(EVENTS.BOSS_DIED);
      this.cameras.main.flash(300, 255, 220, 120);
      // Big reward shower.
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        this.spawnGem(
          enemy.x + Math.cos(a) * 40,
          enemy.y + Math.sin(a) * 40,
          5,
          false
        );
      }
    }

    enemy.kill();
  }

  private spawnGem(x: number, y: number, value: number, isGold: boolean): void {
    const gem = this.gems.get() as XPGem | null;
    if (!gem) return;
    gem.spawn(x, y, value, isGold);
  }

  private onPlayerContact(enemy: Enemy): void {
    if (this.gameOver || !enemy.active) return;
    if (this.player.isInvulnerable) return;
    if (!this.player.takeHit()) return;
    this.run.hp -= enemy.contactDamage;
    this.cameras.main.shake(120, 0.006);
    this.events.emit(EVENTS.HP_CHANGED, Math.max(0, this.run.hp), this.run.maxHp);
    if (this.run.hp <= 0) this.handleDeath();
  }

  private onCollectGem(gem: XPGem): void {
    if (!gem.active) return;
    if (gem.isGold) {
      this.run.gold += 1;
      this.events.emit(EVENTS.GOLD_CHANGED, this.run.gold);
    } else {
      const gained = this.xp.addXP(gem.value);
      this.events.emit(EVENTS.XP_CHANGED, this.xp.progress, this.run.level);
      if (gained > 0) {
        this.pendingLevelUps += gained;
        this.maybeLevelUp();
      }
    }
    gem.kill();
  }

  // --- Level up flow ---

  private maybeLevelUp(): void {
    if (this.leveling || this.pendingLevelUps <= 0) return;
    this.openLevelUp();
  }

  private openLevelUp(): void {
    this.leveling = true;
    this.pendingLevelUps -= 1;
    const choices = this.upgrades.buildChoices(3);
    if (!this.scene.isPaused()) this.scene.pause();
    this.scene.launch('LevelUpScene', { choices, gameScene: this });
  }

  /** Called by LevelUpScene once the player picks a card. */
  onUpgradePicked(choice: UpgradeChoice): void {
    this.upgrades.apply(choice);
    this.leveling = false;
    // Passives may have changed HP / max HP / pickup radius.
    this.events.emit(EVENTS.HP_CHANGED, Math.max(0, this.run.hp), this.run.maxHp);
    this.events.emit(EVENTS.XP_CHANGED, this.xp.progress, this.run.level);
    if (this.pendingLevelUps > 0) this.openLevelUp();
    else this.scene.resume();
  }

  // --- Boss ---

  private onBossSpawned(boss: Enemy): void {
    this.boss = boss;
    this.events.emit(EVENTS.BOSS_SPAWNED);
    this.cameras.main.shake(400, 0.01);
  }

  // --- Death ---

  private handleDeath(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.player.setVelocity(0, 0);
    this.physics.pause();
    this.cameras.main.shake(350, 0.012);
    this.events.emit(EVENTS.PLAYER_DIED);

    const meta = MetaState.recordRun(this.run.gold, this.run.elapsed);
    const summary = {
      timeSec: this.run.elapsed,
      kills: this.run.kills,
      gold: this.run.gold,
      level: this.run.level,
      meta,
    };
    this.time.delayedCall(900, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', summary);
    });
  }

  // --- UI sync ---

  private emitFullState(): void {
    this.events.emit(EVENTS.HP_CHANGED, this.run.hp, this.run.maxHp);
    this.events.emit(EVENTS.XP_CHANGED, this.xp.progress, this.run.level);
    this.events.emit(EVENTS.GOLD_CHANGED, this.run.gold);
    this.events.emit(EVENTS.KILLS_CHANGED, this.run.kills);
    this.events.emit(EVENTS.TIMER, this.run.elapsed);
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    this.playerPos.set(this.player.x, this.player.y);
    this.run.elapsed += delta / 1000;

    this.spawner.update(delta, this.run.elapsed);
    this.weapons.update(_time, delta);

    // Gem magnet pull.
    const radius = this.run.pickupRadius;
    const gemChildren = this.gems.getChildren() as XPGem[];
    for (const g of gemChildren) {
      if (g.active) g.updateMagnet(this.player.x, this.player.y, radius);
    }

    // Throttled timer emit (~4/sec).
    this.timerEmitAccum += delta;
    if (this.timerEmitAccum >= 250) {
      this.timerEmitAccum = 0;
      this.events.emit(EVENTS.TIMER, this.run.elapsed);
    }
  }
}
