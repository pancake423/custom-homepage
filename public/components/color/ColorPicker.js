import ColorHistory from "./ColorHistory.js";
import ColorTile from "./ColorTile.js";
import HistoryManager from "./HistoryManager.js";
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
    document.body.appendChild(this.popup);
    this.popup.classList.add("cp-popup", "page-hide");

    this.popupOpen = false;

    this.popupBlocker = document.createElement("div");
    this.popupBlocker.classList.add("page-hide", "cp-popup-blocker");
    document.body.appendChild(this.popupBlocker);

    this.selectors = {
      R: new SelectorRow("R:", 0, 255),
      G: new SelectorRow("G:", 0, 255),
      B: new SelectorRow("B:", 0, 255),
      A: new SelectorRow("A:", 0, 1, 0.01),
    };
    Object.values(this.selectors).forEach((s) => {
      this.popup.appendChild(s.base);
      s.setUpdateCallback(() => this.updateHexLabel());
    });

    this.selectors.R.setSliderColor("#ff0000");
    this.selectors.G.setSliderColor("#00ff00");
    this.selectors.B.setSliderColor("#0000ff");
    this.selectors.A.setSliderColor("#000000");

    this.addSep(true);

    this.hexContainer = this.createLabeledRow("HEX/RGB:");

    this.strInput = document.createElement("input");
    this.strInput.classList.add("cp-str-input");
    this.strInput.name = "hex";

    this.strInput.onchange = () => {
      this.setPopupColor(this.strInput.value);
    };

    this.hexContainer.appendChild(this.strInput);

    this.addSep();

    this.previewContainer = this.createLabeledRow("Preview:");
    this.preview = new ColorTile(this.color);
    this.previewContainer.appendChild(this.preview.base);

    this.addSep();

    this.createLabeledRow("History:");

    this.history = new ColorHistory(this.popup, (c) => {
      this.setPopupColor(c);
    });

    this.addSep();

    this.submit = document.createElement("button");
    this.submit.classList.add("cp-submit");
    this.submit.innerText = "Done";

    this.cancel = document.createElement("button");
    this.cancel.classList.add("cp-cancel");
    this.cancel.innerText = "Cancel";

    this.submit.onclick = () => {
      const c = this.preview.getColor();
      HistoryManager.saveColor(c);
      this.popup.classList.add("page-hide");
      this.popupBlocker.classList.add("page-hide");
      this.popupOpen = false;
      this.resolve(c);
    };

    this.cancel.onclick = () => {
      this.popup.classList.add("page-hide");
      this.popupBlocker.classList.add("page-hide");
      this.popupOpen = false;
      this.rej();
    };

    const btnRow = this.createLabeledRow();

    this.popup.appendChild(btnRow);
    btnRow.appendChild(this.submit);
    btnRow.appendChild(this.cancel);

    this.base.onclick = async () => {
      if (this.popupOpen) return;
      try {
        this.setColor(await this.getPopupResults());
      } catch {
        // popup cancelled, safe to ignore
      }
    };
  }

  addSep(invis = false) {
    const sep = document.createElement("div");
    sep.classList.add("cp-hline");

    if (invis) {
      sep.style.backgroundColor = "white";
    }

    this.popup.appendChild(sep);
  }

  createLabeledRow(name) {
    const row = document.createElement("div");
    row.classList.add("cp-selector-base");

    if (name !== undefined) {
      const label = document.createElement("label");
      label.for = name;
      label.innerText = name;

      row.appendChild(label);
    }
    this.popup.appendChild(row);

    return row;
  }

  contrastColor(r, g, b, a) {
    return this.colorToRGB((255 - r) * a, (255 - g) * a, (255 - b) * a, 1);
  }

  setStrStyles(r, g, b, a) {
    this.strInput.value = this.colorToRGB(r, g, b, a);
    // this.strInput.style.backgroundColor = this.colorToRGB(r, g, b, a);
    // this.strInput.style.color = this.contrastColor(r, g, b, a);
    this.preview.setColor(this.colorToRGB(r, g, b, a));
  }

  updateHexLabel() {
    // get the colors from the RGBA sliders
    const [r, g, b, a] = [
      this.selectors.R.getValue(),
      this.selectors.G.getValue(),
      this.selectors.B.getValue(),
      this.selectors.A.getValue(),
    ];

    this.setStrStyles(r, g, b, a);
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
    this.popupBlocker.classList.remove("page-hide");
    this.popupOpen = true;
    this.promise = new Promise((res, rej) => {
      this.resolve = res;
      this.rej = rej;
    });

    // sync the popup to the stored color
    this.setPopupColor(this.color);
    this.history.loadTiles();

    return this.promise;
  }

  setPopupColor(c) {
    const [r, g, b, a] = this.parseColorComponents(c);
    if (r == -1) return;

    this.selectors.R.setValue(r);
    this.selectors.G.setValue(g);
    this.selectors.B.setValue(b);
    this.selectors.A.setValue(a);

    this.setStrStyles(r, g, b, a);
  }

  colorToHex(r, g, b, a) {
    const toHexString = (n) => n.toString(16);

    return `#${toHexString(r)}${toHexString(g)}${toHexString(b)}${a == 1 ? "" : toHexString(a * 255)}`;
  }

  colorToRGB(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  parseColorComponents(c) {
    const lower = c.toLowerCase();
    // handle rgba, rgb, hex strings
    if (lower.startsWith("#")) {
      return parseHexColor(lower);
    } else if (lower.startsWith("rgb")) {
      return parseRGBColor(lower);
    } else {
      console.error(`invalid color string "${c}" (must be hex or RGB)`);
    }
    return [-1, -1, -1, -1];
  }
}

function parseHexColor(c) {
  if (c.length != 7 && c.length != 9) {
    console.error(`invalid hex string "${c}" (incorrect length)`);
    return [-1, -1, -1, -1];
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

  // hex string to int, convert alpha to [0, 1]
  const hexToInt = (s) => Number(`0x${s}`);

  return [hexToInt(r), hexToInt(g), hexToInt(b), hexToInt(a) / 255];
}

function parseRGBColor(c) {
  try {
    const components = c
      .split("(")[1]
      .split(")")[0]
      .split(",")
      .map((s) => Number(s.trim()));

    for (let i = 0; i < 3; i++) {
      components[i] = Math.floor(Math.min(Math.max(0, components[i]), 255));
    }

    if (components.length == 3) {
      return [...components, 1];
    }

    components[3] = Math.max(Math.min(components[3], 1), 0);

    return components;
  } catch (e) {
    console.log(e);
    console.error(`invalid RGB(A) string "${c}"`);
  }

  return [-1, -1, -1, -1];
}
