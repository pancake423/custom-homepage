export default class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * create a new vector from magnitude and angle values.
   * @param {number} mag- the magnitude of the vector.
   * @param {number} angle- the angle, in radians, of the vector.
   * @returns
   */
  static fromMagAngle(mag, angle) {
    return new Vec2(mag * Math.cos(angle), mag * Math.sin(angle));
  }

  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
  }

  /**
   * adds two vectors.
   *
   * @param {Vec2} a
   * @param {Vec2} b
   * @returns {Vec2}
   */
  static add(a, b) {
    return new Vec2(a.x + b.x, a.y + b.y);
  }

  /**
   *
   * @param {Vec2} a
   * @param {number} x
   * @returns {Vec2}
   */
  static translateX(a, x) {
    return new Vec2(a.x + x, a.y);
  }

  /**
   *
   * @param {Vec2} a
   * @param {number} y
   * @returns {Vec2}
   */
  static translateY(a, y) {
    return new Vec2(a.x, a.y + y);
  }

  /**
   *
   * @param {Vec2} a
   * @param {number} n
   * @returns {Vec2}
   */
  static scale(a, n) {
    return new Vec2(a.x * n, a.y * n);
  }
}
