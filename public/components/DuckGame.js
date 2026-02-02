import Canvas from "./Canvas.js";
import Duck from "./Duck.js";
import { loadImageBitmap, loadSVG } from "./helpers.js";
import Vec2 from "./Vec2.js";

export default class DuckGame extends Canvas {
  constructor(parent) {
    super(parent);
    this.active = true;
    this.a = false;
    this.d = false;
    this.leftArrow = false;
    this.rightArrow = false;

    this.resize();
    this.resizeTo((this.width / this.height) * 1000, 1000);

    window.addEventListener("resize", () => {
      this.resize();
      this.resizeTo((this.width / this.height) * 1000, 1000);
    });
  }

  /**
   * since JS doesn't allow async constructors, you have to call init separately.
   */
  async init() {
    this.steve = new Duck(
      await loadImageBitmap("/assets/images/steve-no-foot.svg"),
      await loadImageBitmap("/assets/images/steve-foot.svg"),
    );
    this.steve.pos = new Vec2(this.width - 200, this.height - 400);
    this.jeeve = new Duck(
      await loadImageBitmap("/assets/images/jeeve-no-foot.svg"),
      await loadImageBitmap("/assets/images/jeeve-foot.svg"),
    );
    this.jeeve.pos = new Vec2(this.width - 200, this.height - 200);
    this.jeeve.mass = 1.5;
    this.scaleDucks();
    addEventListener("keydown", (e) => {
      if (!this.active) return;
      switch (e.code) {
        case "KeyW":
          this.steve.jump();
          break;
        case "ArrowUp":
          this.jeeve.jump();
          break;
        case "KeyA":
          this.a = true;
          break;
        case "ArrowLeft":
          this.leftArrow = true;
          break;
        case "KeyD":
          this.d = true;
          break;
        case "ArrowRight":
          this.rightArrow = true;
          break;
      }
    });
    addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyA":
          this.a = false;
          break;
        case "ArrowLeft":
          this.leftArrow = false;
          break;
        case "KeyD":
          this.d = false;
          break;
        case "ArrowRight":
          this.rightArrow = false;
          break;
      }
    });
    requestAnimationFrame(() => this.loop());
  }

  scaleDucks() {
    this.steve.scaleWidth(100);
    this.jeeve.scaleWidth(150);
  }

  draw() {
    this.clear();
    if (this.jeeve.pos.y < this.steve.pos.y) {
      this.jeeve.draw(this.ctx);
      this.steve.draw(this.ctx);
    } else {
      this.steve.draw(this.ctx);
      this.jeeve.draw(this.ctx);
    }
  }

  loop() {
    this.draw();
    this.steve.update();
    this.jeeve.update();
    //this.jeeve.collide(this.steve);
    this.steve.collide(this.jeeve);
    this.steve.wrap(this.width);
    this.jeeve.wrap(this.width);
    if (this.leftArrow) {
      this.jeeve.left();
    }
    if (this.rightArrow) {
      this.jeeve.right();
    }
    if (this.a) {
      this.steve.left();
    }
    if (this.d) {
      this.steve.right();
    }
    requestAnimationFrame(() => this.loop());
  }
}
