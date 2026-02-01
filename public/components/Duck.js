import { Sprite } from "./Sprite.js";
import Vec2 from "./Vec2.js";

const MAX_ANGLE = Math.PI / 4;
const MIN_ANGLE = Math.PI / 6;
const ANIM_SPEED = 3;

const JUMP_HEIGHT = 500;
const RUN_SPEED = 1000;
const FRICTION = 300;
const GRAVITY = 1000;

const MAX_VEL_X = 1000;
const MAX_VEL_Y = 1000;

const TOP_SPEED = 500;

let MAX_CLIMB_PX = 20;
let MIN_FPS = 60; // act like 60fps even if we dip lower (so physics don't break)

const ELASTICITY = 0.8;

export default class Duck extends Sprite {
  constructor(texture, footTexture) {
    super(texture);
    this.flapAnim = 0;
    this.t0 = Date.now();
    this.foot1 = new Sprite(footTexture);
    this.foot2 = new Sprite(footTexture);
    this.mass = 1;
    this.onFloor = false;
    this.rider = null;
    this.passenger = null;
    this.size = new Vec2(this.size.x, this.size.y * 0.86);
    this.displayOffset = new Vec2(0, this.displaySize.y * -0.07);
    this.foot1.displayOffset = new Vec2(0, this.displaySize.y * -0.07);
    this.foot2.displayOffset = new Vec2(0, this.displaySize.y * -0.07);
    this.addChild(this.foot1);
    this.addChild(this.foot2);
  }

  #anim_scale() {
    return 0.5 * Math.cos(2 * Math.PI * this.flapAnim) + 0.5;
  }

  update() {
    this.rider = null;
    const now = Date.now();
    this.dt = Math.min((now - this.t0) / 1000, 1 / MIN_FPS);
    this.t0 = now;
    if (this.flapAnim > 0) {
      this.flapAnim += this.dt * ANIM_SPEED;
    }
    if (this.flapAnim > 1) {
      this.flapAnim = 0;
    }
    // set the position of the feet based on flapAnim
    // assume flapAnim increases linearly from 0 to 1, then gets reset to 0.
    // so flapAnim = 0 and flapAnim = 1 should look the same.
    const baseAngle = Math.PI / 2;
    const offset = this.#anim_scale() * (MAX_ANGLE - MIN_ANGLE) + MIN_ANGLE;
    this.foot1.pos = new Vec2(
      (this.displaySize.x / 2) * Math.cos(baseAngle + offset),
      (this.displaySize.y / 2) * Math.sin(baseAngle + offset),
    );
    this.foot2.pos = new Vec2(
      (this.displaySize.x / 2) * Math.cos(baseAngle - offset),
      (this.displaySize.y / 2) * Math.sin(baseAngle - offset),
    );

    this.vel.y += this.dt * GRAVITY;
    this.pos.x += this.dt * this.vel.x;
    if (this.passenger) {
      this.oldPassenger = this.passenger;
      this.pos.x += this.dt * this.passenger.vel.x;
    }
    this.pos.y += this.dt * this.vel.y;

    if (Math.abs(this.vel.y) > MAX_VEL_Y) {
      this.vel.y = Math.sign(this.vel.y) * MAX_VEL_Y;
    }

    if (Math.abs(this.vel.x) > MAX_VEL_X) {
      this.vel.x = Math.sign(this.vel.x) * MAX_VEL_X;
    }

    this.onFloor = false;
    if (this.pos.y > 1000 - this.size.y / 2) {
      this.pos.y = 1000 - this.size.y / 2;
      if (this.vel.y > 0) {
        this.vel.y = 0;
        this.onFloor = true;
      }
    }

    this.vel.x -= Math.sign(this.vel.x) * this.dt * FRICTION;
    if (Math.abs(this.vel.x) < FRICTION * this.dt) {
      this.vel.x = 0;
    }

    if (!this.passenger && this.oldPassenger) {
      this.vel.x += this.oldPassenger.vel.x;
      this.oldPassenger = null;
    }
    this.passenger = null;
  }

  flap() {
    if (this.flapAnim == 0) {
      this.t0 = Date.now();
      this.flapAnim = 0.001;
    }
  }

  jump() {
    this.vel.y = -JUMP_HEIGHT;
    this.flap();
  }

  left() {
    if (Math.abs(this.vel.x) > TOP_SPEED && !this.passenger) return;
    this.vel.x -= RUN_SPEED * this.dt;
    this.flap();
  }
  right() {
    if (Math.abs(this.vel.x) > TOP_SPEED && !this.passenger) return;
    this.vel.x += RUN_SPEED * this.dt;
    this.flap();
  }

  wrap(maxW) {
    if (this.pos.x > maxW + 200) {
      this.pos.x = 0 - 200;
    }

    if (this.pos.x < 0 - 200) {
      this.pos.x = maxW + 200;
    }
  }

  collide(sprite) {
    const mv_y_dir = Math.sign(this.pos.y - sprite.pos.y);
    if (this.isColliding(sprite)) {
      this.origPos = new Vec2(...this.pos);
      let can_climb = false;
      for (let i = 0; i < MAX_CLIMB_PX; i++) {
        this.pos.y += mv_y_dir;
        if (!this.isColliding(sprite)) {
          can_climb = true;
          break;
        }
      }

      this.pos = this.origPos;
      if (can_climb) {
        const temp = this.vel.y;
        this.vel.y = sprite.vel.y * ELASTICITY * (sprite.mass / this.mass);
        sprite.vel.y = temp * ELASTICITY * (this.mass / sprite.mass);

        if (mv_y_dir == 1) {
          this.rider = sprite;
          sprite.passenger = this;
        } else {
          sprite.rider = this;
          this.passenger = sprite;
        }

        if (!this.onFloor) {
          if (this.pos.y < sprite.pos.y) {
            this.pos.y = sprite.pos.y - this.size.y / 2 - sprite.size.y / 2;
          } else {
            this.pos.y = sprite.pos.y + this.size.y / 2 + sprite.size.y / 2;
          }
        } else {
          sprite.pos.y = this.pos.y - this.size.y / 2 - sprite.size.y / 2;
        }
      } else {
        const temp = this.vel.x;
        this.vel.x = sprite.vel.x * ELASTICITY * (sprite.mass / this.mass);
        sprite.vel.x = temp * ELASTICITY * (this.mass / sprite.mass);
        if (this.pos.x < sprite.pos.x) {
          this.pos.x = sprite.pos.x - this.size.x / 2 - sprite.size.x / 2 - 1;
        } else {
          this.pos.x = sprite.pos.x + this.size.x / 2 + sprite.size.x / 2 + 1;
        }
      }
    }
  }
}
