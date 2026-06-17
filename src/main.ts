import Phaser from 'phaser';
import { GAME } from './config/GameConfig';
import { AudioSystem } from './systems/AudioSystem';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { ShopScene } from './scenes/ShopScene';
import { SettingsScene } from './scenes/SettingsScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { PauseScene } from './scenes/PauseScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: GAME.backgroundColor,
  // Crisp nearest-neighbor scaling for the 16-bit pixel-art look.
  pixelArt: true,
  roundPixels: true,
  // Allow multiple simultaneous touch points so mobile players can move with the
  // joystick and tap dash/pause at the same time (default is a single pointer).
  input: { activePointers: 3 },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME.width,
    height: GAME.height,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    CharacterSelectScene,
    ShopScene,
    SettingsScene,
    GameScene,
    UIScene,
    LevelUpScene,
    PauseScene,
    GameOverScene,
  ],
};

let game: Phaser.Game;
try {
  game = new Phaser.Game(config);
} catch (err) {
  const overlay = document.getElementById('nf-error');
  const msg = document.getElementById('nf-error-msg');
  if (msg) msg.textContent = err instanceof Error ? err.message : String(err);
  if (overlay) overlay.style.display = 'flex';
  throw err;
}

/** Pause active gameplay (used on backgrounding / rotate to portrait). */
function pauseGameplay(): void {
  const gs = game.scene.getScene('GameScene') as
    | (Phaser.Scene & { requestPause?: () => void })
    | null;
  if (gs && game.scene.isActive('GameScene') && !game.scene.isPaused('GameScene')) {
    gs.requestPause?.();
  }
}

// --- App lifecycle: pause + free audio when backgrounded; resume audio on return. ---
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    AudioSystem.suspend();
    pauseGameplay();
  } else {
    AudioSystem.resume();
  }
});
window.addEventListener('blur', () => {
  AudioSystem.suspend();
  pauseGameplay();
});
window.addEventListener('focus', () => AudioSystem.resume());

// --- Orientation: prompt to rotate (and pause) when held in portrait. ---
const rotateEl = document.getElementById('nf-rotate');
const portraitMq = window.matchMedia('(orientation: portrait)');
function applyOrientation(): void {
  const portrait = portraitMq.matches;
  if (rotateEl) rotateEl.style.display = portrait ? 'flex' : 'none';
  if (portrait) pauseGameplay();
}
portraitMq.addEventListener('change', applyOrientation);
applyOrientation();
