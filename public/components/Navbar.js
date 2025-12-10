/*
navbar/tab bar for switching between applications.
*/

import Page from "./Page.js";
import ColorManager from "./ColorManager.js";

export default class Navbar {
  /**
   *
   * @param  {...Page} pages - pages to navigate between.
   */
  constructor(...pages) {
    this.base = document.createElement("div");
    this.base.classList.add("navbar-base");
    for (const page of pages) {
      const button = document.createElement("button");
      button.classList.add("navbar-button");
      button.innerText = page.name;
      this.base.appendChild(button);
      button.onclick = (e) => {
        this.navigate(page);
      };
    }
    document.body.appendChild(this.base);
  }
  navigate(page) {
    Page.hideAll();
    page.show();
  }
}
