import ColorTile from "./ColorTile.js";
import HistoryManager from "./HistoryManager.js";

export default class ColorHistory {
  constructor(parent, callback) {
    this.base = document.createElement("div");
    parent.appendChild(this.base);
    this.base.classList.add("ch-base");

    this.callback = callback;

    this.loadTiles();
  }

  loadTiles() {
    this.base.innerHTML = "";
    const l = HistoryManager.getColors();
    for (const c of l) {
      const ct = new ColorTile(c);
      ct.makeClickable((color) => {
        this.callback(color);
      });
      this.base.appendChild(ct.base);
    }
  }
}
