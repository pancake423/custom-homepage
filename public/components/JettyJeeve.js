import Canvas from "./Canvas.js";
import DuckGame from "./DuckGame.js";
import Duck from "./Duck.js";
import { loadImageBitmap } from "./helpers.js";
import Vec2 from "./Vec2.js";
import Rect from "./Rect.js";
import { Sprite } from "./Sprite.js";

const DOUBLE_TAP_SPACING_MS = 200;

const SCORE_DIGITS = 5;

const PIPE_GAP_V = 0.25; // percent of height
const PIPE_GAP_H = 0.5; // percent of height
const PIPE_W = 0.1; // percent of height

const INVULNERABLE_TIME = 2;
const PAUSE_TIME = 0.5;

const LO = 0.2;
const HI = 0.8;

const MIN_FPS = 60;

const BASE_SCROLL_SPEED = 0.2; // percent of height per second
const SCROLL_ACCEL = 0.003;

const JUMP_KEYS = ["KeyW", "ArrowUp", "Space"];

export default class JettyJeeve extends Canvas {
  /**
   *
   * @param {DuckGame} duckGameInstance
   */
  constructor(duckGameInstance) {
    super(document.body);
    this.base.className = "jj-base hidden";
    // save duck game instance to toggle it to pause when jetty jeeve is playing
    this.duckGameInstance = duckGameInstance;

    this.running = false;
    this.highscore = this.getHighscore(); // TODO: load from localstorage
    this.score = 0;
    this.scroll = 0;
    this.health = 3;
    this.pipes = [];
    this.invincible = 0;
    this.offset = 1;
    this.paused = true;
    this.pauseTime = 0;
    this.globalOpacity = 1;
    this.escaped = false;

    this.t0 = Date.now();

    this.presses = [];
    window.addEventListener("keydown", (e) => {
      const now = Date.now();
      this.presses = this.presses.filter(
        (p) => now - p[1] <= DOUBLE_TAP_SPACING_MS,
      );
      if (e.code == "KeyJ") {
        this.presses.push([e.code, now]);
        if (this.presses.length == 2) {
          this.presses = [];
          this.toggleVisibility();
        }
      }
    });
  }

  async init() {
    await this.loadFont();
    this.jeeve = new Duck(
      await loadImageBitmap("/assets/images/jeeve-no-foot.svg"),
      await loadImageBitmap("/assets/images/jeeve-foot.svg"),
    );

    this.topPipe = new Sprite(
      await loadImageBitmap("/assets/images/pipe-top.svg"),
    );
    this.bottomPipe = new Sprite(
      await loadImageBitmap("/assets/images/pipe.svg"),
    );
    this.topPipe.scaleWidth(100);
    this.bottomPipe.scaleWidth(100);
    this.healthIcon = new Sprite(
      await loadImageBitmap("/assets/images/jeeve.svg"),
    );
    this.healthIcon.scaleWidth(75);

    this.resize();
    this.jeeve.scaleWidth(125);
    this.jeeve.size = Vec2.scale(this.jeeve.size, 0.9);
    this.jeeve.floorEnabled = false;
    this.resizeTo((this.width / this.height) * 1000, 1000);
    window.addEventListener("resize", () => {
      this.resize();
      this.resizeTo((this.width / this.height) * 1000, 1000);
      this.jeeve.pos.x = this.width / 3;
    });

    window.addEventListener("keydown", (e) => {
      if (!this.running) return;
      if (JUMP_KEYS.includes(e.code)) {
        this.jeeve.jump();
        this.paused = false;
      }

      if (e.code == "Escape") {
        if (!this.paused) {
          this.paused = true;
          this.escaped = true;
        } else {
          if (this.escaped) {
            this.escaped = false;
            this.paused = false;
          }
        }
      }
    });

    this.loop();
  }

  async loadFont() {
    const font = new FontFace(
      "Jersey10",
      "url('/assets/fonts/Jersey10-Regular.ttf')",
    );
    document.fonts.add(font);
    await font.load();
  }

  reset() {
    this.score = 0;
    this.scroll = 0;
    this.pipes = [];
    this.health = 3;
    this.offset = 1;
    this.invincible = 0;
    this.paused = true;
    this.escaped = false;
    this.pauseTime = 0;

    this.globalOpacity = 1;
    this.generatePipes();

    this.jeeve.pos = new Vec2(this.width / 3, this.height / 2);
    this.jeeve.vel = new Vec2();
    this.jeeve.updateFeet();
  }

  generatePipes(n = 100) {
    for (let i = 0; i < n; i++) {
      this.pipes.push(Math.random() * (HI - LO) + LO);
    }
  }

  toggleVisibility() {
    this.running = !this.running;
    if (this.running) {
      this.reset();
    }
    this.base.classList.toggle("hidden");
  }

  loop() {
    const now = Date.now();
    this.dt = Math.min((now - this.t0) / 1000, 1 / MIN_FPS);
    this.t0 = now;

    if (this.running) {
      if (this.health > 0 && this.globalOpacity > 0) {
        this.globalOpacity -= this.dt * 2;
      }
      if (this.health == 0 && this.globalOpacity < 1) {
        this.globalOpacity += this.dt * 2;
      }

      if (this.globalOpacity < 0) {
        this.globalOpacity = 0;
      }

      this.draw();
      if (this.pauseTime > 0) {
        this.pauseTime -= this.dt;
        if (this.pauseTime <= 0) {
          this.paused = false;
        }
      }
      if (!this.paused) {
        this.scroll +=
          (BASE_SCROLL_SPEED + SCROLL_ACCEL * this.score) * this.dt;
        if (this.invincible > 0) {
          this.invincible -= this.dt;
        }
        if (
          this.invincible <= 0 &&
          (this.jeeve.pos.y > this.height + this.jeeve.size.y ||
            this.jeeve.pos.y < -this.jeeve.size.y)
        ) {
          this.damage();
          this.jeeve.pos.y = this.height / 2;
          this.jeeve.vel.y = 0;
        }
        this.jeeve.update();
        if (this.health <= 0) {
          this.reset();
        }
      }
    }
    requestAnimationFrame(() => this.loop());
  }

  draw() {
    this.clear();
    this.stepPipes();
    if (this.invincible <= 0 || Math.floor(this.t0 / 200) % 2 == 0) {
      this.ctx.globalAlpha = 1;
    } else {
      this.ctx.globalAlpha = 0.5;
    }
    this.jeeve.draw(this.ctx);
    this.ctx.globalAlpha = 1;
    this.#drawUI();

    this.ctx.globalAlpha = this.globalOpacity;
    this.ctx.fillStyle = "#1b1738";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalAlpha = 1;
  }

  damage() {
    this.health--;
    this.invincible = INVULNERABLE_TIME;
    this.pauseTime = PAUSE_TIME;
    if (this.health <= 0) {
      this.pauseTime *= 2;
    }
    this.paused = true;
  }

  getHighscore() {
    const highscore = window.localStorage.getItem("highscore");
    if (highscore == null) {
      this.setHighscore(0);
      return 0;
    }
    return highscore;
  }

  setHighscore(n) {
    this.highscore = n;
    window.localStorage.setItem("highscore", n);
  }

  stepPipes() {
    let x = this.scroll * -this.height + this.width / 2;
    const distScore = Math.floor((this.scroll + 0.66) / PIPE_GAP_H) - 2;
    if (distScore > this.score) {
      this.score++;
      if (this.score > this.highscore) {
        this.setHighscore(this.score);
      }
    }

    const stepSize = PIPE_GAP_H * this.height;
    x += stepSize * this.offset;
    for (let i = 0; i < this.pipes.length; i++) {
      if (x < -this.topPipe.size.x) {
        this.offset++;
        this.pipes.splice(0, 1);
        if (this.pipes.length < 100) {
          this.generatePipes();
        }
        return this.stepPipes();
      }
      if (x > this.width + this.topPipe.size.x) break;
      // draw the pipe
      this.topPipe.pos = new Vec2(
        x,
        this.height * (this.pipes[i] - PIPE_GAP_V / 2) -
          this.topPipe.size.y / 2,
      );
      this.bottomPipe.pos = new Vec2(
        x,
        this.height * (this.pipes[i] + PIPE_GAP_V / 2) +
          this.bottomPipe.size.y / 2,
      );
      this.topPipe.draw(this.ctx);
      this.bottomPipe.draw(this.ctx);
      // figure out if we're collding with the pipe
      if (
        this.invincible <= 0 &&
        (this.jeeve.isColliding(this.topPipe) ||
          this.jeeve.isColliding(this.bottomPipe))
      ) {
        this.damage();
      }
      x += stepSize;
    }
  }

  #drawUI() {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "white";
    ctx.font = "128px Jersey10";
    ctx.fillText("Jetty Jeeve", this.width / 2, 16);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "48px Jersey10";

    ctx.fillText("SCORE", this.width - 250, 16);
    ctx.textAlign = "center";
    let x = this.width - 16;
    for (let i = 0; i < SCORE_DIGITS; i++) {
      ctx.fillText(Math.floor(this.score / Math.pow(10, i)) % 10, x, 16);
      x -= 20;
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "48px Jersey10";

    ctx.fillText("HI", this.width - 250, 48);
    ctx.textAlign = "center";
    x = this.width - 16;
    for (let i = 0; i < SCORE_DIGITS; i++) {
      ctx.fillText(Math.floor(this.highscore / Math.pow(10, i)) % 10, x, 48);
      x -= 20;
    }

    // draw health meter
    const y = 128;
    x = this.width - 50;
    for (let i = 0; i < this.health; i++) {
      this.healthIcon.pos = new Vec2(x, y);
      this.healthIcon.draw(this.ctx);
      x -= 100;
    }

    if (this.paused && this.pauseTime <= 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";
      ctx.font = "64px Jersey10";
      ctx.fillText(
        this.escaped ? "PAUSED" : "Jump to Start",
        this.width / 2,
        this.height / 2,
      );
    }
  }
}
