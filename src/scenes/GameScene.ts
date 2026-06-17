import Phaser from 'phaser';
import { GAME, SPAWN } from '../config/GameConfig';
import { EVENTS } from '../util/Events';
import { RunState } from '../state/RunState';
import { MetaState } from '../state/MetaState';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { EnemyProjectile } from '../entities/EnemyProjectile';
import { XPGem } from '../entities/XPGem';
import { Chest } from '../entities/Chest';
import { DamageNumber } from '../entities/DamageNumber';
import { WeaponSystem } from '../systems/WeaponSystem';
import type { AoeOpts } from '../systems/weapons/WeaponBehavior';
import { XPSystem } from '../systems/XPSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { Spawner } from '../systems/Spawner';
import { AudioSystem } from '../systems/AudioSystem';
import { Haptics } from '../util/Haptics';
import { WEAPONS } from '../data/weapons';
import { POWERUPS } from '../data/powerups';
import { CHARACTERS, DEFAULT_CHARACTER } from '../data/characters';
import { STAGES, DEFAULT_STAGE } from '../data/stages';
import { DIFFICULTIES, DEFAULT_DIFFICULTY } from '../data/difficulty';
import type {
  LoadoutView,
  UpgradeChoice,
  CharacterDef,
  StageDef,
  DifficultyDef,
  EnemyDef,
  RunConfig,
  RunSummary,
} from '../types';
import type { MetaData } from '../state/MetaState';

type Reward = 'levelup' | 'chest';

/** Background music track per stage (boss theme swaps in while a boss is alive). */
const MUSIC_BY_STAGE: Record<string, string> = { meadow: 'calm', crypt: 'eerie', wastes: 'intense' };

/**
 * The core simulation: owns the world, the player, all entity pools, and every
 * gameplay system. Parameterized by a RunConfig (character + stage + meta). Routes
 * all enemy damage through a single `damageEnemy` path so weapons behave alike.
 */
export class GameScene extends Phaser.Scene {
  private run!: RunState;
  /** Public so the HUD can read dash cooldown / player position. */
  player!: Player;
  private playerPos = new Phaser.Math.Vector2();

  private character!: CharacterDef;
  private stage!: StageDef;
  private difficulty!: DifficultyDef;
  private meta!: MetaData;

  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private enemyShots!: Phaser.Physics.Arcade.Group;
  private gems!: Phaser.Physics.Arcade.Group;
  private chests!: Phaser.Physics.Arcade.Group;
  private damageNumbers: DamageNumber[] = [];

  private weapons!: WeaponSystem;
  private xp!: XPSystem;
  private upgrades!: UpgradeSystem;
  private spawner!: Spawner;

  private rewardQueue: Reward[] = [];
  private processingReward = false;
  private gameOver = false;
  private timerEmitAccum = 0;

  /** Current boss enemy, exposed so the UI can render its health bar. */
  boss?: Enemy;

  /** Current stage's background music track (restored after a boss dies). */
  private musicTrack = 'calm';

  // Virtual joystick (touch movement).
  private joyActive = false;
  private joyId = -1;
  private joyVec = new Phaser.Math.Vector2();
  private joyBase?: Phaser.GameObjects.Arc;
  private joyThumb?: Phaser.GameObjects.Arc;
  private readonly joyMax = 55;

  constructor() {
    super('GameScene');
  }

  init(data: Partial<RunConfig>): void {
    this.meta = data.meta ?? MetaState.get();
    this.character = data.character ?? CHARACTERS[DEFAULT_CHARACTER];
    this.stage = data.stage ?? STAGES[DEFAULT_STAGE];
    this.difficulty = data.difficulty ?? DIFFICULTIES[DEFAULT_DIFFICULTY];
  }

  create(): void {
    this.gameOver = false;
    this.processingReward = false;
    this.rewardQueue = [];
    this.damageNumbers = [];
    this.boss = undefined;
    this.timerEmitAccum = 0;
    this.joyActive = false;
    this.joyId = -1;
    this.joyVec.set(0, 0);

    AudioSystem.configure(this.meta.settings);
    AudioSystem.unlock();
    Haptics.configure(this.meta.settings.haptics);
    this.musicTrack = MUSIC_BY_STAGE[this.stage.id] ?? 'calm';
    AudioSystem.setTrack(this.musicTrack);

    this.run = new RunState();
    this.applyMeta();
    this.applyCharacter();
    this.run.xpMult *= this.difficulty.xpMult;
    this.run.goldMult *= this.difficulty.goldMult;

    // World + background.
    this.physics.world.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.add
      .tileSprite(0, 0, GAME.worldWidth, GAME.worldHeight, this.stage.tileKey)
      .setOrigin(0)
      .setTileScale(GAME.spriteScale)
      .setDepth(-10);
    // Stage ambience tint.
    this.add
      .rectangle(0, 0, GAME.worldWidth, GAME.worldHeight, this.stage.tint, this.stage.tintAlpha)
      .setOrigin(0)
      .setDepth(-9);

    // Player at the center of the world.
    const cx = GAME.worldWidth / 2;
    const cy = GAME.worldHeight / 2;
    this.player = new Player(this, cx, cy, this.run, this.character.spriteKey, () =>
      this.joyActive ? this.joyVec : null
    );
    this.playerPos.set(cx, cy);

    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setBackgroundColor(GAME.backgroundColor);

    // Entity pools.
    this.enemies = this.physics.add.group({ classType: Enemy, maxSize: SPAWN.maxAlive });
    this.projectiles = this.physics.add.group({ classType: Projectile, maxSize: 600 });
    this.enemyShots = this.physics.add.group({ classType: EnemyProjectile, maxSize: 300 });
    this.gems = this.physics.add.group({ classType: XPGem, maxSize: 800 });
    this.chests = this.physics.add.group({ classType: Chest, maxSize: 24 });
    for (let i = 0; i < 80; i++) {
      const dn = new DamageNumber(this, 0, 0);
      this.add.existing(dn);
      this.damageNumbers.push(dn);
    }

    // Systems.
    this.xp = new XPSystem(this.run);
    this.weapons = new WeaponSystem({
      scene: this,
      run: this.run,
      player: this.player,
      enemies: this.enemies,
      getProjectile: () => this.projectiles.get() as Projectile | null,
      damageEnemy: (e, amt, fx, fy, el) => this.damageEnemy(e, amt, fx, fy, el),
      allEnemies: () => this.enemies.getChildren() as Enemy[],
      nearestEnemyTo: (x, y, exclude) => this.nearestEnemyTo(x, y, exclude),
      aoeDamage: (x, y, r, dmg, opts) => this.aoeDamage(x, y, r, dmg, opts),
      cameraShake: (d, i) => this.shake(d, i),
      audio: AudioSystem,
    });
    this.weapons.addWeapon(this.character.startingWeapon);
    this.upgrades = new UpgradeSystem(this.run, this.weapons);
    this.spawner = new Spawner(
      this,
      this.enemies,
      this.playerPos,
      this.stage,
      this.difficulty,
      (x, y, tx, ty, def) => this.fireEnemyShot(x, y, tx, ty, def),
      (b) => this.onBossSpawned(b)
    );

    this.setupCollisions();

    this.input.keyboard?.on('keydown-ESC', this.togglePause, this);
    this.input.keyboard?.on('keydown-P', this.togglePause, this);

    this.setupJoystick();

    this.scene.launch('UIScene');
    this.time.delayedCall(0, () => this.emitFullState());
  }

  /** Apply permanent meta powerups to the fresh RunState. */
  private applyMeta(): void {
    for (const id of Object.keys(this.meta.powerups)) {
      const lvl = this.meta.powerups[id];
      if (lvl > 0) POWERUPS[id]?.apply(this.run, lvl);
    }
  }

  /** Apply the selected character's stat modifiers, then reset HP to full. */
  private applyCharacter(): void {
    const m = this.character.mods;
    if (m.maxHpAdd) this.run.maxHp += m.maxHpAdd;
    if (m.moveSpeedMult) this.run.moveSpeedMult *= m.moveSpeedMult;
    if (m.damageMult) this.run.damageMult *= m.damageMult;
    if (m.cooldownMult) this.run.cooldownMult *= m.cooldownMult;
    if (m.pickupRadiusMult) this.run.pickupRadiusMult *= m.pickupRadiusMult;
    if (m.armor) this.run.armor += m.armor;
    if (m.critChance) this.run.critChance += m.critChance;
    if (m.projectileBonus) this.run.projectileBonus += m.projectileBonus;
    this.run.maxHp = Math.max(20, this.run.maxHp);
    this.run.hp = this.run.maxHp;
  }

  private togglePause(): void {
    if (this.gameOver || this.processingReward || this.scene.isPaused()) return;
    this.scene.pause();
    this.scene.launch('PauseScene', { gameScene: this });
  }

  /** Public entry point for the on-screen (touch) pause button. */
  requestPause(): void {
    this.togglePause();
  }

  // --- Virtual joystick (touch movement, left half of the screen) ---

  private setupJoystick(): void {
    this.joyBase = this.add
      .circle(0, 0, this.joyMax, 0xffffff, 0.12)
      .setStrokeStyle(3, 0xffffff, 0.35)
      .setScrollFactor(0)
      .setDepth(900)
      .setVisible(false);
    this.joyThumb = this.add
      .circle(0, 0, 26, 0xffffff, 0.3)
      .setScrollFactor(0)
      .setDepth(901)
      .setVisible(false);

    this.input.on('pointerdown', this.onJoyDown, this);
    this.input.on('pointermove', this.onJoyMove, this);
    this.input.on('pointerup', this.onJoyUp, this);
    this.input.on('pointerupoutside', this.onJoyUp, this);
  }

  private onJoyDown(pointer: Phaser.Input.Pointer): void {
    if (this.gameOver || this.scene.isPaused() || this.joyActive) return;
    if (!pointer.wasTouch) return; // mouse/desktop unaffected
    if (pointer.x > this.scale.width * 0.55) return; // right side reserved for buttons
    this.joyActive = true;
    this.joyId = pointer.id;
    this.joyVec.set(0, 0);
    this.joyBase?.setPosition(pointer.x, pointer.y).setVisible(true);
    this.joyThumb?.setPosition(pointer.x, pointer.y).setVisible(true);
  }

  private onJoyMove(pointer: Phaser.Input.Pointer): void {
    if (!this.joyActive || pointer.id !== this.joyId || !this.joyBase) return;
    const dx = pointer.x - this.joyBase.x;
    const dy = pointer.y - this.joyBase.y;
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const clamped = Math.min(len, this.joyMax);
    this.joyThumb?.setPosition(this.joyBase.x + Math.cos(ang) * clamped, this.joyBase.y + Math.sin(ang) * clamped);
    if (len > 8) {
      const mag = Math.min(1, len / this.joyMax);
      this.joyVec.set(Math.cos(ang) * mag, Math.sin(ang) * mag);
    } else {
      this.joyVec.set(0, 0);
    }
  }

  private onJoyUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.joyId) return;
    this.joyActive = false;
    this.joyId = -1;
    this.joyVec.set(0, 0);
    this.joyBase?.setVisible(false);
    this.joyThumb?.setVisible(false);
  }

  /** Snapshot of weapons + passives for the loadout UI / pause screen. */
  getLoadout(): LoadoutView {
    return {
      weapons: this.weapons.describeLoadout().map((w) => ({
        name: w.def.name,
        icon: w.def.textureKey,
        level: w.level,
        maxLevel: w.def.maxLevel,
        description: w.def.description,
      })),
      passives: [...this.run.passives.values()],
    };
  }

  private setupCollisions(): void {
    this.physics.add.overlap(this.projectiles, this.enemies, (p, e) =>
      this.onProjectileHit(p as Projectile, e as Enemy)
    );
    this.physics.add.overlap(this.player, this.enemies, (_pl, e) =>
      this.onPlayerContact(e as Enemy)
    );
    this.physics.add.overlap(this.player, this.enemyShots, (_pl, s) =>
      this.onEnemyShotHit(s as EnemyProjectile)
    );
    this.physics.add.overlap(this.player, this.gems, (_pl, g) => this.onCollectGem(g as XPGem));
    this.physics.add.overlap(this.player, this.chests, (_pl, c) => this.onCollectChest(c as Chest));
  }

  // --- Combat ---

  private onProjectileHit(proj: Projectile, enemy: Enemy): void {
    if (!proj.active || !enemy.active) return;
    if (proj.alreadyHit(enemy)) return;
    this.damageEnemy(enemy, proj.damage, proj.x, proj.y, proj.element);
    if (proj.onHit(enemy)) proj.kill();
  }

  /** Weapon-facing damage entry point (used by all weapon types). */
  private damageEnemy(enemy: Enemy, amount: number, fromX?: number, fromY?: number, element?: string): void {
    this.dealDamage(enemy, amount, { fromX, fromY, element });
  }

  /** Single source of truth for hurting an enemy: crit, curse, popups, element, kill. */
  private dealDamage(
    enemy: Enemy,
    amount: number,
    opts: { fromX?: number; fromY?: number; element?: string; dot?: boolean; color?: string }
  ): void {
    if (!enemy.active) return;
    let dmg = amount * enemy.damageTakenMult; // Shadow curse amplifies
    let crit = false;
    if (!opts.dot && this.run.critChance > 0 && Math.random() < this.run.critChance) {
      dmg *= this.run.critMult;
      crit = true;
    }
    dmg = Math.max(1, Math.round(dmg));
    const dead = enemy.damage(dmg, opts.dot ? undefined : opts.fromX, opts.dot ? undefined : opts.fromY);
    if (this.meta.settings.showDamage) this.popDamage(enemy.x, enemy.y, dmg, crit, opts.color);
    if (!opts.dot) AudioSystem.hit();
    if (opts.element && !opts.dot && !dead) this.applyElement(enemy, opts.element, amount);
    if (dead) this.killEnemy(enemy);
  }

  /** Apply an elemental status on hit. `base` is the pre-crit hit damage. */
  private applyElement(enemy: Enemy, element: string, base: number): void {
    switch (element) {
      case 'frost':
        enemy.applySlow(0.55, 1300);
        break;
      case 'flame':
        enemy.applyBurn(base * 0.45, 2000);
        break;
      case 'venom':
        enemy.applyPoison(base * 0.3, 4000);
        break;
      case 'shadow':
        enemy.applyVuln(1.3, 3000);
        break;
      case 'holy':
        this.holySmite(enemy, base);
        break;
    }
  }

  /** Radiant infusion: splash damage to enemies near the struck target. */
  private holySmite(target: Enemy, base: number): void {
    const r2 = 72 * 72;
    const dmg = base * 0.4;
    const children = this.enemies.getChildren() as Enemy[];
    for (const e of children) {
      if (!e.active || e === target) continue;
      if (Phaser.Math.Distance.Squared(target.x, target.y, e.x, e.y) <= r2) {
        this.dealDamage(e, dmg, { dot: true, color: '#fff0a0' });
      }
    }
  }

  private popDamage(x: number, y: number, amount: number, crit: boolean, color?: string): void {
    const dn = this.damageNumbers.find((d) => !d.active);
    if (!dn) return;
    dn.spawn(x, y, amount, crit, color);
  }

  /** Camera shake gated by the Reduced Motion accessibility setting. */
  private shake(duration: number, intensity: number): void {
    if (!this.meta.settings.reducedMotion) this.cameras.main.shake(duration, intensity);
  }

  /** Nearest active enemy to a point, optionally excluding some (e.g. already hit). */
  private nearestEnemyTo(x: number, y: number, exclude?: Set<Enemy>): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = Infinity;
    const children = this.enemies.getChildren() as Enemy[];
    for (const e of children) {
      if (!e.active || exclude?.has(e)) continue;
      const d = Phaser.Math.Distance.Squared(x, y, e.x, e.y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  /** Damage every active enemy within `radius` of (x,y). Used by AoE weapons. */
  private aoeDamage(x: number, y: number, radius: number, dmg: number, opts?: AoeOpts): void {
    const r2 = radius * radius;
    const children = this.enemies.getChildren() as Enemy[];
    for (const e of children) {
      if (!e.active) continue;
      if (Phaser.Math.Distance.Squared(x, y, e.x, e.y) <= r2) {
        this.dealDamage(e, dmg, {
          fromX: opts?.knockback ? x : undefined,
          fromY: opts?.knockback ? y : undefined,
          element: opts?.element,
          dot: opts?.dot,
          color: opts?.color,
        });
      }
    }
  }

  private killEnemy(enemy: Enemy): void {
    const { x, y } = enemy;
    const def = enemy.def;
    this.run.kills += 1;
    this.events.emit(EVENTS.KILLS_CHANGED, this.run.kills);
    AudioSystem.kill();

    this.spawnGem(x, y, def.xpValue, false);
    if (Math.random() < def.goldChance * this.run.luck) this.spawnGem(x, y, 0, true);
    if (def.chestChance && Math.random() < def.chestChance * this.run.luck) this.spawnChest(x, y);

    // Splitter offspring.
    if (def.splitInto) {
      for (let i = 0; i < (def.splitCount ?? 2); i++) {
        const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
        this.spawner.spawnAt(def.splitInto, x + Math.cos(a) * 14, y + Math.sin(a) * 14, 1, 1);
      }
    }

    if (enemy.isBoss) {
      this.run.bossKills += 1;
      this.boss = undefined;
      this.spawner.setBossActive(false);
      AudioSystem.setTrack(this.musicTrack);
      this.events.emit(EVENTS.BOSS_DIED);
      this.cameras.main.flash(300, 255, 220, 120);
      this.spawnChest(x, y);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        this.spawnGem(x + Math.cos(a) * 40, y + Math.sin(a) * 40, 5, false);
      }
    }

    enemy.kill();
  }

  private spawnGem(x: number, y: number, value: number, isGold: boolean): void {
    const gem = this.gems.get() as XPGem | null;
    if (!gem) return;
    gem.spawn(x, y, value, isGold);
  }

  private spawnChest(x: number, y: number): void {
    const chest = this.chests.get() as Chest | null;
    if (!chest) return;
    chest.spawn(x, y);
  }

  private fireEnemyShot(x: number, y: number, tx: number, ty: number, def: EnemyDef): void {
    const speed = def.shotSpeed ?? 200;
    const dmg = def.shotDamage ?? 8;
    const base = Phaser.Math.Angle.Between(x, y, tx, ty);
    const angles = def.boss ? [base - 0.25, base, base + 0.25] : [base];
    for (const a of angles) {
      const shot = this.enemyShots.get() as EnemyProjectile | null;
      if (!shot) break;
      shot.fire(x, y, a, speed, dmg);
    }
  }

  private onPlayerContact(enemy: Enemy): void {
    if (this.gameOver || !enemy.active) return;
    if (this.player.isInvulnerable) return;
    if (!this.player.takeHit()) return;
    this.applyPlayerDamage(enemy.contactDamage);
  }

  private onEnemyShotHit(shot: EnemyProjectile): void {
    if (this.gameOver || !shot.active) return;
    shot.kill();
    if (this.player.isInvulnerable) return;
    if (!this.player.takeHit()) return;
    this.applyPlayerDamage(shot.damage);
  }

  private applyPlayerDamage(raw: number): void {
    const scaled = raw * this.difficulty.enemyDmgMult;
    const dmg = Math.max(1, scaled - this.run.armor);
    this.run.hp -= dmg;
    this.shake(120, 0.006);
    Haptics.vibrate(30);
    AudioSystem.hurt();
    this.events.emit(EVENTS.HP_CHANGED, Math.max(0, this.run.hp), this.run.maxHp);
    if (this.run.hp <= 0) this.handleFatal();
  }

  private handleFatal(): void {
    if (this.run.revives > 0) {
      this.run.revives -= 1;
      this.run.hp = Math.ceil(this.run.maxHp * 0.5);
      this.cameras.main.flash(400, 120, 220, 255);
      this.player.takeHit();
      this.events.emit(EVENTS.HP_CHANGED, this.run.hp, this.run.maxHp);
      return;
    }
    this.handleEnd(false);
  }

  private onCollectGem(gem: XPGem): void {
    if (!gem.active) return;
    if (gem.isGold) {
      this.run.gold += 1;
      this.events.emit(EVENTS.GOLD_CHANGED, this.run.gold);
    } else {
      const gained = this.xp.addXP(Math.max(1, Math.round(gem.value * this.run.xpMult)));
      this.events.emit(EVENTS.XP_CHANGED, this.xp.progress, this.run.level);
      AudioSystem.pickup();
      for (let i = 0; i < gained; i++) this.rewardQueue.push('levelup');
      if (gained > 0) this.openReward();
    }
    gem.kill();
  }

  private onCollectChest(chest: Chest): void {
    if (!chest.active) return;
    chest.kill();
    AudioSystem.chest();
    this.rewardQueue.push('chest');
    this.openReward();
  }

  // --- Reward flow (level-ups + chests, serialized through one queue) ---

  private openReward(): void {
    if (this.processingReward) return;
    if (this.gameOver) return;
    const item = this.rewardQueue.shift();
    if (!item) {
      if (this.scene.isPaused()) this.scene.resume();
      return;
    }
    this.processingReward = true;
    if (!this.scene.isPaused()) this.scene.pause();

    let choices: UpgradeChoice[];
    let title = 'LEVEL UP!';
    if (item === 'chest') {
      const evos = this.weapons.getAvailableEvolutions();
      if (evos.length > 0) {
        const recipe = evos[0];
        const def = WEAPONS[recipe.resultId];
        choices = [
          {
            id: `evo-${recipe.resultId}`,
            name: def.name,
            description: def.description,
            icon: def.textureKey,
            kind: 'evolution',
            badge: 'Evolve!',
            apply: (_r, w) => w.evolve(recipe),
          },
        ];
        title = 'EVOLUTION!';
        AudioSystem.evolve();
      } else {
        choices = this.upgrades.buildChoices(3);
        title = 'TREASURE!';
      }
    } else {
      choices = this.upgrades.buildChoices(3);
    }
    this.scene.launch('LevelUpScene', { choices, gameScene: this, title });
  }

  /** Called by LevelUpScene once the player picks a card. */
  onUpgradePicked(choice: UpgradeChoice): void {
    this.upgrades.apply(choice);
    this.processingReward = false;
    Haptics.vibrate(15);

    if (choice.kind === 'passive' || choice.kind === 'heal') {
      const existing = this.run.passives.get(choice.id);
      if (existing) existing.count += 1;
      else this.run.passives.set(choice.id, { name: choice.name, icon: choice.icon, count: 1 });
    }

    this.events.emit(EVENTS.HP_CHANGED, Math.max(0, this.run.hp), this.run.maxHp);
    this.events.emit(EVENTS.XP_CHANGED, this.xp.progress, this.run.level);
    this.events.emit(EVENTS.LOADOUT_CHANGED, this.getLoadout());
    this.openReward();
  }

  // --- Boss ---

  private onBossSpawned(boss: Enemy): void {
    this.boss = boss;
    this.spawner.setBossActive(true);
    this.events.emit(EVENTS.BOSS_SPAWNED, boss.def.name ?? 'BOSS');
    AudioSystem.setTrack('boss');
    this.shake(400, 0.01);
    Haptics.vibrate([0, 60, 40, 60]);
    AudioSystem.bossSpawn();
  }

  // --- End of run ---

  private handleEnd(victory: boolean): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.player.setVelocity(0, 0);
    this.physics.pause();
    this.shake(350, 0.012);
    Haptics.vibrate(victory ? [0, 80, 60, 120] : 200);
    this.events.emit(EVENTS.PLAYER_DIED);
    if (victory) AudioSystem.levelUp();
    else AudioSystem.death();

    const summary: RunSummary = {
      timeSec: this.run.elapsed,
      kills: this.run.kills,
      gold: Math.round(this.run.gold * this.run.goldMult),
      level: this.run.level,
      stageId: this.stage.id,
      characterId: this.character.id,
      bossKills: this.run.bossKills,
      victory,
    };
    const { meta, newlyUnlocked } = MetaState.processRun(summary);

    this.time.delayedCall(900, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { summary, meta, newlyUnlocked });
    });
  }

  // --- UI sync ---

  private emitFullState(): void {
    this.events.emit(EVENTS.HP_CHANGED, this.run.hp, this.run.maxHp);
    this.events.emit(EVENTS.XP_CHANGED, this.xp.progress, this.run.level);
    this.events.emit(EVENTS.GOLD_CHANGED, this.run.gold);
    this.events.emit(EVENTS.KILLS_CHANGED, this.run.kills);
    this.events.emit(EVENTS.TIMER, this.run.elapsed);
    this.events.emit(EVENTS.LOADOUT_CHANGED, this.getLoadout());
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    this.playerPos.set(this.player.x, this.player.y);
    this.run.elapsed += delta / 1000;

    this.spawner.update(delta, this.run.elapsed);
    this.weapons.update(time, delta);

    // Regen.
    if (this.run.regenPerSec > 0 && this.run.hp < this.run.maxHp) {
      this.run.hp = Math.min(this.run.maxHp, this.run.hp + this.run.regenPerSec * (delta / 1000));
    }

    // Damage-over-time (Flame burn / Venom poison), ticked ~4x/sec per enemy.
    const enemyChildren = this.enemies.getChildren() as Enemy[];
    for (const e of enemyChildren) {
      if (!e.active) continue;
      const burning = time < e.burnUntil;
      const poisoned = time < e.poisonUntil;
      if ((burning || poisoned) && time >= e.nextDotTickAt) {
        e.nextDotTickAt = time + 250;
        const dps = (burning ? e.burnDps : 0) + (poisoned ? e.poisonDps : 0);
        if (dps > 0) this.dealDamage(e, dps * 0.25, { dot: true, color: burning ? '#ff8a3a' : '#8aff5a' });
      }
    }

    // Gem magnet pull.
    const radius = this.run.pickupRadius;
    const gemChildren = this.gems.getChildren() as XPGem[];
    for (const g of gemChildren) {
      if (g.active) g.updateMagnet(this.player.x, this.player.y, radius);
    }

    // Throttled HUD emits (~4/sec).
    this.timerEmitAccum += delta;
    if (this.timerEmitAccum >= 250) {
      this.timerEmitAccum = 0;
      this.events.emit(EVENTS.TIMER, this.run.elapsed);
      this.events.emit(EVENTS.HP_CHANGED, Math.max(0, this.run.hp), this.run.maxHp);
    }

    // Victory: survive to the stage duration.
    if (this.run.elapsed >= this.stage.durationSec) this.handleEnd(true);
  }
}
