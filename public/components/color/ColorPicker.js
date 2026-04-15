import SelectorRow from "./SelectorRow.js";

export default class ColorPicker {
  constructor(color) {
    this.color = color;
    this.base = document.createElement("div");
    this.base.classList.add("cp-base");

    this.overlay = document.createElement("div");
    this.base.appendChild(this.overlay);
    this.overlay.classList.add("cp-overlay");
    this.overlay.style.backgroundColor = this.color;

    this.popup = document.createElement("div");
    this.base.appendChild(this.popup);
    this.popup.classList.add("cp-popup", "page-hide");

    // TODO: add controls
    // text boxes for R, G, B, A
    // text box for hex color (8-digit w/ alpha)
    // history list of last 10 ? used colors (needs to save to localstorage)

    this.selectors = {
      R: new SelectorRow("R", 0, 255),
      G: new SelectorRow("G", 0, 255),
      B: new SelectorRow("B", 0, 255),
      A: new SelectorRow("A", 0, 1, 0.01),
    };
    Object.values(this.selectors).forEach((s) =>
      this.popup.appendChild(s.base),
    );

    this.base.onclick = async () => {
      this.setColor(await this.getPopupResults());
    };
  }

  setCallback(fn) {
    this.callback = fn;
  }

  setColor(color) {
    this.color = color;
    this.overlay.style.backgroundColor = this.color;

    if (this.callback) {
      this.callback(this.color);
    }
  }

  async getPopupResults() {
    this.popup.classList.remove("page-hide");
    this.promise = new Promise((res, rej) => {
      this.resolve = res;
      this.rej = rej;
    });

    // sync the popup to the stored color
    console.log(this.color);

    return this.promise;
  }

  parseColorComponents() {
    const lower = this.color.toLowerCase();
    // handle rgba, rgb, hex strings
    if (lower.startsWith("#")) {
      return parseHexColor(lower);
    } else if (lower.startsWith("rgb")) {
      return parseRGBColor(lower);
    } else {
      console.error(`failed to parse color string "${this.color}"`);
    }
    return [0, 0, 0, 0];
  }
}

function parseHexColor(c) {
  if (c.length != 7 && c.length != 9) {
    console.error(`invalid hex string "${c}" (incorrect length)`);
    return [0, 0, 0, 0];
  }
  const legal_chars = "0123456789abcdef";
  for (const char of c.substring(1, c.length)) {
    if (!legal_chars.includes(char)) {
      console.error(`invalid hex string "${c}" (illegal character "${char}")`);
    }
  }

  const r = c.substring(1, 3);
  const g = c.substring(3, 5);
  const b = c.substring(5, 7);
  const a = c.length == 7 ? "ff" : c.substring(7, 9);

  // TODO: hex string to int, convert alpha to [0, 1]

  return [0, 0, 0, 0];
}

function parseRGBColor(c) {
  return [0, 0, 0, 0];
}
