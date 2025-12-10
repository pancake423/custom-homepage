/*
container for a single page of the overall site.
manages showing/hiding content
*/
export default class Page {
  static all = [];

  /**
   * create a new page for the application.
   *
   * @param {string} name - the name of this page.
   */
  constructor(name) {
    this.name = name;
    this.base = document.createElement("div");
    this.base.classList.add("page-base");
    document.body.appendChild(this.base);
    this.hide();
    Page.all.push(this);
  }

  show() {
    this.base.classList.remove("page-hide");
    document.title = this.name;
  }

  hide() {
    this.base.classList.add("page-hide");
  }

  static hideAll() {
    for (const page of Page.all) {
      page.hide();
    }
  }
}
