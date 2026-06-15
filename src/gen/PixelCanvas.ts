import Phaser from 'phaser';
import type { Palette } from './Palette';

/**
 * A tiny pixel-art authoring helper. Sprites are described as a grid of palette
 * indices (a "pixel map"); we render that grid 1px-per-cell into a Phaser
 * CanvasTexture so the result is crisp under nearest-neighbor scaling.
 *
 * Supports multi-frame sheets: call `frame()` to advance to the next horizontal
 * frame slot before drawing each animation frame.
 */
export class PixelCanvas {
  readonly key: string;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly frames: number;

  private ctx: CanvasRenderingContext2D;
  private texture: Phaser.Textures.CanvasTexture;
  private current = 0;

  constructor(
    scene: Phaser.Scene,
    key: string,
    frameWidth: number,
    frameHeight: number,
    frames = 1
  ) {
    this.key = key;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frames = frames;

    // Remove a stale texture if regenerating (e.g. hot reload).
    if (scene.textures.exists(key)) scene.textures.remove(key);
    this.texture = scene.textures.createCanvas(
      key,
      frameWidth * frames,
      frameHeight
    )!;
    this.ctx = this.texture.getContext();
    this.ctx.imageSmoothingEnabled = false;
  }

  /** Select which frame slot subsequent draw calls target. */
  frame(index: number): this {
    this.current = index;
    return this;
  }

  private get ox(): number {
    return this.current * this.frameWidth;
  }

  px(x: number, y: number, color: string | null): this {
    if (!color) return this;
    if (x < 0 || y < 0 || x >= this.frameWidth || y >= this.frameHeight) return this;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.ox + x, y, 1, 1);
    return this;
  }

  rect(x: number, y: number, w: number, h: number, color: string | null): this {
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) this.px(x + xx, y + yy, color);
    return this;
  }

  /**
   * Draw a pixel-map (rows of palette indices) at an offset. Index 0 / undefined
   * cells are skipped (transparent). Returns this for chaining.
   */
  map(grid: number[][], palette: Palette, offsetX = 0, offsetY = 0): this {
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const idx = row[x];
        if (idx > 0) this.px(offsetX + x, offsetY + y, palette[idx] ?? null);
      }
    }
    return this;
  }

  /** Mirror the left half onto the right half within the current frame (for symmetric sprites). */
  mirrorX(): this {
    const img = this.ctx.getImageData(this.ox, 0, this.frameWidth, this.frameHeight);
    const half = Math.floor(this.frameWidth / 2);
    for (let y = 0; y < this.frameHeight; y++) {
      for (let x = 0; x < half; x++) {
        const src = (y * this.frameWidth + x) * 4;
        const dx = this.frameWidth - 1 - x;
        const dst = (y * this.frameWidth + dx) * 4;
        img.data[dst] = img.data[src];
        img.data[dst + 1] = img.data[src + 1];
        img.data[dst + 2] = img.data[src + 2];
        img.data[dst + 3] = img.data[src + 3];
      }
    }
    this.ctx.putImageData(img, this.ox, 0);
    return this;
  }

  /**
   * Auto-add a 1px dark outline around every opaque pixel that borders empty space.
   * Gives sprites the clean read of hand-drawn pixel art.
   */
  outline(color: string): this {
    const img = this.ctx.getImageData(this.ox, 0, this.frameWidth, this.frameHeight);
    const w = this.frameWidth;
    const h = this.frameHeight;
    const opaque = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return false;
      return img.data[(y * w + x) * 4 + 3] > 0;
    };
    const toOutline: Array<[number, number]> = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (opaque(x, y)) continue;
        if (
          opaque(x - 1, y) ||
          opaque(x + 1, y) ||
          opaque(x, y - 1) ||
          opaque(x, y + 1)
        ) {
          toOutline.push([x, y]);
        }
      }
    }
    this.ctx.fillStyle = color;
    for (const [x, y] of toOutline) this.ctx.fillRect(this.ox + x, y, 1, 1);
    return this;
  }

  /** Finalize: push pixels to the GPU and register as a sprite sheet if multi-frame. */
  commit(scene: Phaser.Scene): this {
    this.texture.refresh();
    if (this.frames > 1) {
      // Define each frame so animations can address them by index.
      for (let i = 0; i < this.frames; i++) {
        this.texture.add(i, 0, i * this.frameWidth, 0, this.frameWidth, this.frameHeight);
      }
    }
    void scene;
    return this;
  }
}
