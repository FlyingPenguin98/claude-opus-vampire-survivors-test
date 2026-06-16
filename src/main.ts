import Phaser from 'phaser';
import { GAME } from './config/GameConfig';
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

new Phaser.Game(config);
