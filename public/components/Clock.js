import { loadPartial } from "./helpers.js";

export class Clock {
  /**
   * create a new clock element.
   *
   * @param {HTMLDivElement} div - div to create the clock inside of
   * @param {string} [format="none"] - clock format
   * @param {boolean} [seconds=true]
   */
  constructor(div, format = "12", seconds = true) {
    loadPartial("/partials/clock.html").then((res) => {
      this.base = res;
      this.format = format;
      this.display = res.querySelector(".clock-display.clock-on");
      this.displayBg = res.querySelector(".clock-display.clock-off");
      this.seconds = seconds;
      [this.am, this.pm] = res.querySelectorAll(".ampm");
      if (this.seconds) {
        this.enableSeconds();
      } else {
        this.disableSeconds();
      }
      div.appendChild(this.base);

      setInterval(() => this.#tick(), 100);
    });
  }

  #tick() {
    const t = new Date();
    const ta = [t.getHours(), t.getMinutes(), t.getSeconds()];
    ta.push(ta[0] == 0 ? 12 : ta[0] % 12);
    const am = ta[0] < 12;
    const b = ta[2] % 2 == 0 && !this.seconds ? " " : ":";
    const [h, m, s, hw] = ta.map((n) => n.toString().padStart(2, "0"));

    this.base.classList.remove("hidden");
    this.am.classList.add("clock-off");
    this.pm.classList.add("clock-off");

    switch (this.format) {
      case "24":
        this.display.innerText = h + b + m;
        if (this.seconds) this.display.innerText += b + s;
        break;
      case "12":
        this.display.innerText = hw + b + m;
        if (this.seconds) this.display.innerText += b + s;
        if (am) {
          this.am.classList.remove("clock-off");
        } else {
          this.pm.classList.remove("clock-off");
        }
        break;

      default:
        this.base.classList.add("hidden");
        break;
    }
  }

  setFormat(fmt) {
    this.format = fmt;
  }

  enableSeconds() {
    this.displayBg.innerText = "88:88:88";
    this.seconds = true;
    this.#tick();
  }

  disableSeconds() {
    this.displayBg.innerText = "88:88";
    this.seconds = false;
    this.#tick();
  }
}
