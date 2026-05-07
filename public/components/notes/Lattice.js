import { cssVar, create } from "../helpers.js";
import BackgroundStyle from "./BackgroundStyle.js";

/**
 * Lattice background decoration for notes page.
 */
export default class Lattice {
  /**
   *
   * @param {HTMLElement} parent - parent element to place canvas in
   */
  constructor(parent) {
    this.base = create("canvas", ["notes-bg-canvas"], parent);
    this.ctx = this.base.getContext("2d");
    this.config = new BackgroundStyle();
    // vines under, lattice, vines over, flowers
    this.layers = [[], [], [], []];

    this.width = 0;
    this.height = 0;
    this.setSize();
    window.addEventListener("resize", () => this.setSize());
    window.addEventListener("colorupdate", () => {
      this.generate();
      this.draw();
    });

    this.generate();
    this.draw();
  }

  leafFunc(angle) {
    const size = this.config.get("leaf-size");
    return (theta) =>
      size * (Math.sin(theta + angle) + 0.5 * Math.cos(4 * (theta + angle)));
  }

  flowerFunc(petals) {
    const size = this.config.get("flower-size");
    const offset = Math.random() * 2 * Math.PI;
    return (theta) => size * Math.cos(petals * (theta + offset));
  }

  generate() {
    this.layers = [[], [], [], []];

    const spH = this.config.get("spacing-horiz");
    const spV = this.config.get("spacing-vert");

    const slope = spV / spH;

    const screenW = window.screen.width;
    const screenH = window.screen.height;
    const maxW = Math.ceil(window.screen.width / spH) * spH;

    // generate the lattice pattern
    for (let x = 0; x < screenW; x += this.config.get("spacing-horiz")) {
      this.layers[1].push(
        new LineSegment(this, x, 0, x + screenH / slope, screenH),
        new LineSegment(this, x, 0, x - screenH / slope, screenH),
      );
    }

    for (
      let y = 0;
      y < window.screen.height;
      y += this.config.get("spacing-vert")
    ) {
      this.layers[1].push(
        new LineSegment(this, 0, y, (screenH - y) / slope, screenH),
        new LineSegment(this, maxW, y, maxW - (screenH - y) / slope, screenH),
      );
    }

    // add vines
    for (const line of this.layers[1]) {
      if (Math.random() > this.config.get("vine-prob")) {
        continue;
      }
      let x = line.sx;
      let y = line.sy;
      const dx =
        (spH * Math.sign(line.ex - line.sx)) /
        this.config.get("vine-tightness");
      const dy = spV / this.config.get("vine-tightness");

      this.layers[0].push(
        new VineSegment(this, x - dx / 2, y - dy / 2, x, y, 0, 0.5),
      );

      let theta = 0.5;
      let layer = 2;

      while (y < line.ey + dy) {
        this.layers[layer].push(
          new VineSegment(this, x, y, x + dx, y + dy, theta, theta + 1),
        );
        if (Math.random() <= this.config.get("leaf-prob")) {
          const anglePrimary = Math.atan2(dx, dy);
          let angleOffset = anglePrimary + Math.PI / 2;
          if (layer == 0) {
            angleOffset += Math.PI;
          }
          if (dx < 0) {
            angleOffset += Math.PI;
          }
          const pos = [
            ...add([x, y], vector(this.config.get("vine-width"), angleOffset)),
            0,
            2 * Math.PI,
          ];
          this.layers[dx < 0 ? 0 : 2].push(
            new PolarFill(
              this,
              this.leafFunc(angleOffset + (dx < 0 ? 0 : Math.PI)),
              cssVar("--notes-lattice-vines"),
              ...pos,
            ),
          );
          if (Math.random() <= this.config.get("flower-prob")) {
            const id = Math.random() < 0.5 ? 1 : 2;
            this.layers[3].push(
              new PolarFill(
                this,
                this.flowerFunc(this.config.get(`f${id}-petals`)),
                cssVar(`--f${id}-color`),
                ...pos,
              ),
              new PolarFill(
                this,
                () => this.config.get("flower-center-size"),
                cssVar(`--f${id}-center`),
                ...pos,
              ),
            );
          }
        }
        x += dx;
        y += dy;
        theta += 1;
        layer = layer == 0 ? 2 : 0;
      }
    }
  }

  setSize() {
    this.width = this.base.width = window.innerWidth;
    this.height = this.base.height = window.innerHeight;
    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (const layer of this.layers) {
      for (const item of layer) {
        item.draw();
      }
    }
  }

  loop() {
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// random vector helper funcs

const vector = (length, angle) => [
  length * Math.cos(angle),
  length * Math.sin(angle),
];

const add = (a, b) => {
  return [a[0] + b[0], a[1] + b[1]];
};

class LineSegment {
  constructor(parent, sx, sy, ex, ey) {
    this.ctx = parent.ctx;
    this.config = parent.config;
    this.sx = sx;
    this.sy = sy;
    this.ex = ex;
    this.ey = ey;
  }

  draw() {
    /** @type {CanvasRenderingContext2D} */
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.strokeStyle = cssVar("--notes-lattice-lines");
    ctx.lineWidth = this.config.get("line-width");

    ctx.moveTo(this.sx, this.sy);
    ctx.lineTo(this.ex, this.ey);
    ctx.stroke();
  }
}

class VineSegment {
  constructor(parent, sx, sy, ex, ey, st, et) {
    this.ctx = parent.ctx;
    this.config = parent.config;
    this.sx = sx;
    this.sy = sy;
    this.ex = ex;
    this.ey = ey;
    this.st = st;
    this.et = et;
  }

  draw() {
    /** @type {CanvasRenderingContext2D} */
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.strokeStyle = cssVar("--notes-lattice-vines");
    ctx.lineWidth = this.config.get("line-width");
    ctx.lineCap = "round";

    const anglePrimary = Math.atan2(this.ey - this.sy, this.ex - this.sx);
    const angleOffset = anglePrimary + Math.PI / 2;
    const dt = 0.01;

    const getPos = (t) => {
      const dy = this.ey - this.sy;
      const dx = this.ex - this.sx;
      const dtheta = this.et - this.st;

      return add(
        [this.sx + dx * t, this.sy + dy * t],
        vector(
          Math.sin(Math.PI * (this.st + dtheta * t)) *
            this.config.get("vine-width"),
          angleOffset,
        ),
      );
    };

    let t = 0;
    ctx.moveTo(...getPos(t));
    while (t <= 1) {
      t += dt;
      ctx.lineTo(...getPos(t));
    }

    ctx.stroke();
  }
}

class PolarFill {
  constructor(parent, fn, color, sx, sy, st, et) {
    this.ctx = parent.ctx;
    this.config = parent.config;
    this.fn = fn;
    this.color = color;
    this.sx = sx;
    this.sy = sy;
    this.st = st;
    this.et = et;
  }

  draw() {
    /** @type {CanvasRenderingContext2D} */
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.fillStyle = this.color;

    let theta = this.st;
    const dt = 0.1;

    while (theta <= this.et) {
      const r = this.fn(theta);
      ctx.lineTo(...add([this.sx, this.sy], vector(r, theta)));
      theta += dt;
    }

    ctx.fill();
  }
}
