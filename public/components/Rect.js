import Vec2 from "./Vec2.js";

export default class Rect {
  /**
   * create a new object representing a rectangle (collision box)
   *
   * @param {number} x - x position of rectangle (top left)
   * @param {number} y - y position of rectangle (top left)
   * @param {number} w - width of rectangle
   * @param {number} h - height of rectangle
   */
  constructor(x, y, w, h) {
    this.pos = new Vec2(x, y);
    this.size = new Vec2(w, h);
  }

  /**
   * internal half collision function
   *
   * @param {Rect} other
   * @returns {boolean}
   */
  _collide_internal(other) {
    return (
      this.pointInRect(other.pos) ||
      this.pointInRect(Vec2.translateX(other.pos, other.size.x)) ||
      this.pointInRect(Vec2.translateY(other.pos, other.size.y)) ||
      this.pointInRect(Vec2.add(other.pos, other.size))
    );
  }

  /**
   * check if this rect is colliding with another rect.
   *
   * @param {Rect} other
   * @returns {boolean}
   */
  isColliding(other) {
    return this._collide_internal(other) || other._collide_internal(this);
  }

  /**
   * check if a point is inside the rect.
   *
   * @param {Vec2} point
   * @returns {boolean}
   */
  pointInRect(point) {
    return (
      point.x >= this.pos.x &&
      point.x <= this.pos.x + this.size.x &&
      point.y >= this.pos.y &&
      point.y <= this.pos.y + this.size.y
    );
  }
}
