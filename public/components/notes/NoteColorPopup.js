export default class NoteColorPopup {
  constructor() {
    this.promise = new Promise((res, rej) => {
      this.resolve = res;
      this.rej = rej;
    });
    this.base = document.createElement("div");
    this.base.classList.add("popup-base", "page-hide");

    // create color buttons
    for (let i = 1; i <= 6; i++) {
      const btn = document.createElement("div");
      btn.classList.add("popup-button", `note-theme-${i}`);
      btn.onclick = (e) => {
        this.resolve(i);
        // reset for the next usage
        this.promise = new Promise((res, rej) => {
          this.resolve = res;
          this.rej = rej;
        });
        this.hide();
      };
      this.base.appendChild(btn);
    }
  }

  show(x, y) {
    console.log("popup shown");
    this.base.classList.remove("page-hide");
    this.base.style.left = x;
    this.base.style.top = y;
  }

  hide() {
    this.base.classList.add("page-hide");
  }

  // returns a promise that resolves when this note popup finishes.
  getSelection(x, y) {
    this.show(x, y);
    return this.promise;
  }
}
