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

  // Singularity vortex: dark core with a bright violet rim (ADD blend, spun in-world).
  const vor = scene.make.graphics({ x: 0, y: 0 }, false);
  const vr = 32;
  for (let i = vr; i > 0; i--) {
    const t = i / vr; // 1 at rim, ->0 at center
    const col = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0x140020),
      Phaser.Display.Color.ValueToColor(0xc060ff),
      vr,
      vr - i
    );
    vor.fillStyle(Phaser.Display.Color.GetColor(col.r, col.g, col.b), t * 0.5);
    vor.fillCircle(vr, vr, i);
  }
  vor.fillStyle(0x000000, 0.9);
  vor.fillCircle(vr, vr, Math.floor(vr * 0.45));
  vor.generateTexture('vortex', vr * 2, vr * 2);
  vor.destroy();

  // Nova ring: a bright annulus, transparent inside.
  const ring = scene.make.graphics({ x: 0, y: 0 }, false);
  const nr = 32;
  ring.lineStyle(5, 0xbfe8ff, 1);
  ring.strokeCircle(nr, nr, nr - 4);
  ring.lineStyle(9, 0x6ad8ff, 0.4);
  ring.strokeCircle(nr, nr, nr - 6);
  ring.generateTexture('nova-ring', nr * 2, nr * 2);
  ring.destroy();

  // Meteor telegraph: a thin orange targeting ring.
  const mark = scene.make.graphics({ x: 0, y: 0 }, false);
  mark.lineStyle(2, 0xff8a3a, 0.9);
  mark.strokeCircle(24, 24, 22);
  mark.lineStyle(2, 0xffd23a, 0.5);
  mark.strokeCircle(24, 24, 14);
  mark.generateTexture('meteor-mark', 48, 48);
  mark.destroy();

  // Explosion burst (reused for meteor impacts).
  radialGlow(scene, 'explosion', 16, 0xffffff, 0xff6a2a);

  // Beam: a horizontal gradient bar, bright center line fading to the edges.
  const beam = scene.make.graphics({ x: 0, y: 0 }, false);
  const bw = 64;
  const bh = 16;
  for (let y = 0; y < bh; y++) {
    const d = Math.abs(y - bh / 2) / (bh / 2); // 0 center -> 1 edge
    const a = (1 - d) * 0.9;
    beam.fillStyle(d < 0.25 ? 0xffffff : 0x9ff0ff, a);
    beam.fillRect(0, y, bw, 1);
  }
  beam.generateTexture('beam', bw, bh);
  beam.destroy();

  // Boomerang: a curved double-blade (drawn as two angled diamonds).
  const boom = scene.make.graphics({ x: 0, y: 0 }, false);
  boom.fillStyle(0x21161f, 1);
  boom.fillRect(2, 6, 12, 4);
  boom.fillRect(6, 2, 4, 12);
  boom.fillStyle(0xcfd6e6, 1);
  boom.fillRect(3, 7, 10, 2);
  boom.fillRect(7, 3, 2, 10);
  boom.fillStyle(0xffffff, 1);
  boom.fillRect(7, 7, 2, 2);
  boom.generateTexture('boomerang', 16, 16);
  boom.destroy();
}
