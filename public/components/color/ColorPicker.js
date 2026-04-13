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

    return this.promise;
  }
}
