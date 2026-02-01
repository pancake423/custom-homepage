import { loadImageBitmap } from "./helpers.js";
import Rect from "./Rect.js";
import Vec2 from "./Vec2.js";

export class Sprite {
  /**
   *
   * @param {CanvasImageSource} texture- canvas-drawable texture source.
   */
  constructor(texture) {
    this.texture = texture;
    this.pos = new Vec2();
    this.vel = new Vec2();
    this.size = new Vec2(texture.width, texture.height);
    this.displaySize = new Vec2(texture.width, texture.height);
    this.displayOffset = new Vec2();
    this.children = [];
  }

  /**
   *
   * @param {Sprite} child
   */
  addChild(child) {
    this.children.push(child);
  }

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} offsetX
   * @param {number} offsetY
   */
  draw(ctx, offsetX = 0, offsetY = 0) {
    const [x, y] = [this.pos.x + offsetX, this.pos.y + offsetY];
    for (const sprite of this.children) {
      sprite.draw(ctx, x, y);
    }
    if (this.texture)
      ctx.drawImage(
        this.texture,
        x - this.displaySize.x / 2 + this.displayOffset.x,
        y - this.displaySize.y / 2 + this.displayOffset.y,
        this.displaySize.x,
        this.displaySize.y,
      );
  }

  /**
   *
   * @returns {Rect}
   */
  getBoundingBox() {
    return new Rect(
      this.pos.x - this.size.x / 2,
      this.pos.y - this.size.y / 2,
      this.size.x,
      this.size.y,
    );
  }

  /**
   *
   * @param {Sprite} other
   * @returns {boolean}
   */
  isColliding(other) {
    return this.getBoundingBox().isColliding(other.getBoundingBox());
  }

  /**
   * scale the sprite up or down proportionally to have a width of w px.
   *
   * @param {number} w - new sprite width.
   */
  scaleWidth(w) {
    const ratio = w / this.size.x;
    this.scale(ratio);
  }

  /**
   * scale the sprite by the given ratio. For example, a ratio of 2 doubles the width and height of the sprite.
   * @param {number} ratio
   */
  scale(ratio) {
    this.size = Vec2.scale(this.size, ratio);
    this.displaySize = Vec2.scale(this.displaySize, ratio);
    this.displayOffset = Vec2.scale(this.displayOffset, ratio);
    for (const child of this.children) {
      child.scale(ratio);
    }
  }
}
