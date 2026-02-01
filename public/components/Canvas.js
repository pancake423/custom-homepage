import { substring } from "./helpers.js";

export default class Canvas {
  /**
   * create a new HTML canvas
   *
   * @param {HTMLElement} parent - parent element to append this canvas to
   */
  constructor(parent) {
    this.parent = parent;
    this.base = document.createElement("canvas");
    this.base.classList.add("canvas-base");
    this.parent.prepend(this.base);
    this.ctx = this.base.getContext("2d");
    this.width = 0;
    this.height = 0;
  }

  resize() {
    const style = getComputedStyle(this.base);
    const pxToInt = (s) => Math.floor(Number(substring(s, 0, -2)));

    this.resizeTo(pxToInt(style.width), pxToInt(style.height));
  }

  resizeTo(w, h) {
    this.base.width = this.width = w;
    this.base.height = this.height = h;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
