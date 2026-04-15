export default class HistoryManager {
  static #list = [];
  static #key = "ch-list";
  static #cap = 16;

  static init() {
    this.#list = this.#get();
  }

  static #save(v) {
    localStorage.setItem(this.#key, JSON.stringify(v));
  }

  static #get() {
    const saved = localStorage.getItem(this.#key);
    if (saved == null) {
      this.#save([]);
      return [];
    }

    return JSON.parse(saved);
  }

  // add a color to the history list (if necessary)
  static saveColor(c) {
    console.log("save color", c);

    const idx = this.#list.indexOf(c);

    if (idx == -1) {
      this.#list = [c, ...this.#list.slice(0, this.#cap - 1)];
    } else {
      this.#list = [
        c,
        ...this.#list.slice(0, idx),
        ...this.#list.slice(idx + 1, this.#cap),
      ];
    }

    this.#save(this.#list);
  }

  // get the list of colors.
  static getColors() {
    return this.#list;
  }
}
