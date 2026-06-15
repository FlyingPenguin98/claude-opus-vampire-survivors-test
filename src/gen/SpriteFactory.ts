import Phaser from 'phaser';
import { generatePlayer } from './generators/playerGen';
import { generateAllEnemies } from './generators/enemyGen';
import { generateGems } from './generators/gemGen';
import { generateProjectiles } from './generators/projectileGen';
import { generateTiles } from './generators/tileGen';

/**
 * Builds every texture and animation used by the game, entirely in code. Run once
 * from PreloadScene before any gameplay scene starts. Because anims are registered
 * on the global AnimationManager they are reachable from every scene.
 */
export const SpriteFactory = {
  generateAll(scene: Phaser.Scene): void {
    generateTiles(scene);
    generatePlayer(scene);
    generateAllEnemies(scene);
    generateGems(scene);
    generateProjectiles(scene);
  },
};
