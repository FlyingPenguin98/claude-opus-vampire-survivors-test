import Phaser from 'phaser';

/**
 * Weapon visuals use soft radial glows (drawn via Graphics) intended to be shown
 * with ADD blend mode for a magical 16-bit "spell" look, plus a crisp orbiting blade.
 */

/** Stacked translucent circles -> a soft radial gradient glow texture. */
function radialGlow(
  scene: Phaser.Scene,
  key: string,
  radius: number,
  inner: number,
  outer: number
): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const steps = radius;
  for (let i = steps; i > 0; i--) {
    const t = i / steps;
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(outer),
      Phaser.Display.Color.ValueToColor(inner),
      steps,
      steps - i
    );
    const c = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    g.fillStyle(c, 1 - t * 0.85);
    g.fillCircle(radius, radius, i);
  }
  // bright core
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(radius, radius, Math.max(1, Math.floor(radius * 0.25)));
  g.generateTexture(key, radius * 2, radius * 2);
  g.destroy();
}

export function generateProjectiles(scene: Phaser.Scene): void {
  // Magic bolt (cyan), holy spark (gold), shadow orb (violet), fireball (red),
  // lightning (white), and the hostile enemy shot (crimson).
  radialGlow(scene, 'bolt-cyan', 7, 0x9ff0ff, 0x1f6fd0);
  radialGlow(scene, 'bolt-gold', 7, 0xfff3bf, 0xe09a18);
  radialGlow(scene, 'bolt-violet', 8, 0xe6b0ff, 0x7a2fd0);
  radialGlow(scene, 'bolt-red', 9, 0xffd9a0, 0xe0431a);
  radialGlow(scene, 'bolt-white', 6, 0xffffff, 0x9ab0ff);
  radialGlow(scene, 'enemy-shot', 7, 0xffb0b0, 0xc4203a);

  // Aura field: large soft ring.
  const aura = scene.make.graphics({ x: 0, y: 0 }, false);
  const ar = 64;
  for (let i = ar; i > 0; i--) {
    const t = i / ar;
    aura.fillStyle(0x6ad8ff, (1 - t) * 0.25);
    aura.fillCircle(ar, ar, i);
  }
  aura.generateTexture('aura-field', ar * 2, ar * 2);
  aura.destroy();

  // Orbiting blade: a crisp diamond shard. Drawn as nested diamonds so the
  // corners of the texture stay transparent (no dark square background).
  const blade = scene.make.graphics({ x: 0, y: 0 }, false);
  // Dark outline diamond (fills to the edge midpoints, corners transparent).
  blade.fillStyle(0x21161f, 1);
  blade.beginPath();
  blade.moveTo(7, 0);
  blade.lineTo(14, 7);
  blade.lineTo(7, 14);
  blade.lineTo(0, 7);
  blade.closePath();
  blade.fillPath();
  // Inner steel diamond.
  blade.fillStyle(0xcfd6e6, 1);
  blade.beginPath();
  blade.moveTo(7, 2);
  blade.lineTo(12, 7);
  blade.lineTo(7, 12);
  blade.lineTo(2, 7);
  blade.closePath();
  blade.fillPath();
  // Highlight glint.
  blade.fillStyle(0xffffff, 1);
  blade.beginPath();
  blade.moveTo(7, 3);
  blade.lineTo(10, 6);
  blade.lineTo(7, 6);
  blade.closePath();
  blade.fillPath();
  blade.generateTexture('blade', 14, 14);
  blade.destroy();

  // Throwing knife: a slim steel shard (drawn pointing right).
  const knife = scene.make.graphics({ x: 0, y: 0 }, false);
  knife.fillStyle(0x21161f, 1);
  knife.beginPath();
  knife.moveTo(0, 3);
  knife.lineTo(12, 6);
  knife.lineTo(0, 9);
  knife.closePath();
  knife.fillPath();
  knife.fillStyle(0xcfd6e6, 1);
  knife.beginPath();
  knife.moveTo(1, 5);
  knife.lineTo(10, 6);
  knife.lineTo(1, 7);
  knife.closePath();
  knife.fillPath();
  knife.generateTexture('knife', 12, 12);
  knife.destroy();

  // Spirit tome: a small closed book.
  const tome = scene.make.graphics({ x: 0, y: 0 }, false);
  tome.fillStyle(0x21161f, 1);
  tome.fillRect(1, 1, 12, 12);
  tome.fillStyle(0x6b3fc0, 1);
  tome.fillRect(2, 2, 10, 10);
  tome.fillStyle(0xa87af0, 1);
  tome.fillRect(2, 2, 10, 2);
  tome.fillStyle(0xf2c14e, 1);
  tome.fillRect(6, 3, 2, 8); // spine clasp
  tome.fillStyle(0xcfd6e6, 1);
  tome.fillRect(11, 3, 1, 8); // pages
  tome.generateTexture('tome', 14, 14);
  tome.destroy();

  // Whirling saw: a spiked steel disc.
  const saw = scene.make.graphics({ x: 0, y: 0 }, false);
  const sc = 9;
  saw.fillStyle(0x21161f, 1);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    saw.fillRect(sc + Math.cos(a) * 7 - 1, sc + Math.sin(a) * 7 - 1, 3, 3);
  }
  saw.fillStyle(0x9aa0b4, 1);
  saw.fillCircle(sc, sc, 6);
  saw.fillStyle(0xe6e6f0, 1);
  saw.fillCircle(sc, sc, 3);
  saw.fillStyle(0x21161f, 1);
  saw.fillCircle(sc, sc, 1);
  saw.generateTexture('sawblade', 18, 18);
  saw.destroy();
}
