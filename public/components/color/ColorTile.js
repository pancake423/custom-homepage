export default class ColorTile {
  constructor(color) {
    this.base = document.createElement("div");
    this.base.classList.add("ct-base");

    this.overlay = document.createElement("div");
    this.overlay.classList.add("ct-overlay");

    this.color = color;
    this.setColor(this.color);

    this.base.appendChild(this.overlay);
  }

  setColor(c) {
    this.color = c;
    this.overlay.style.backgroundColor = this.color;
  }

  makeClickable(callback) {
    this.callback = callback;
    this.base.style.cursor = "pointer";
    this.base.onclick = () => this.callback(this.getColor());
  }

  getColor(c) {
    return this.color;
  }
}
