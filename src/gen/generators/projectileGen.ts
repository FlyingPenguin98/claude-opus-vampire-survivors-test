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
  // Magic bolt (cyan), holy spark (gold), shadow orb (violet).
  radialGlow(scene, 'bolt-cyan', 7, 0x9ff0ff, 0x1f6fd0);
  radialGlow(scene, 'bolt-gold', 7, 0xfff3bf, 0xe09a18);
  radialGlow(scene, 'bolt-violet', 8, 0xe6b0ff, 0x7a2fd0);

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
}
