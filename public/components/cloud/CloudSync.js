import { create, sendJSON } from "../helpers.js";
import Page from "../Page.js";
import { exportLocalStorage } from "./export.js";

/**
 * general goals for cloud sync:
 * when the page loads, check if the server has newer content than we do
 *
 * periodically check for content updates and push them to the server.
 * assumption: no one will try to use the site on two devices at the same time.
 *
 * assumption: someone might make changes elsewhere, and then come back to an old tab
 * on a different device without reloading. we should check for newer changes on the server periodically.
 *
 * assumption: the user would rather the experience be seamless, with a small chance of accidental overwrites,
 * than be interrupted with prompts whenever they switch devices.
 */

export default class CloudSync extends Page {
  constructor() {
    super("Cloud");
    this.panel = create("div", ["cloud-panel", "flex-col"], this.base);

    this.loginForm = create(
      "div",
      ["cloud-login-panel", "flex-col", "flex-self-bottom"],
      this.panel,
    );
    this.statusPage = create(
      "div",
      ["cloud-login-panel", "flex-col", "flex-self-bottom"],
      //  this.panel,
    );

    this.userText = create("p", [], this.statusPage);
    this.loggedIn = false;
    this.status().then((data) => {
      this.userText.innerHTML = data.message;
      this.loggedIn = data.loggedIn;
    });

    create("h1", [], this.loginForm, { innerText: "Cloud Sync" });

    const r1 = create("div", ["flex-row", "gap-1"], this.loginForm);
    const r2 = create("div", ["flex-row", "gap-1"], this.loginForm);
    const r3 = create(
      "div",
      ["flex-row", "justify-end", "width-100pct"],
      this.loginForm,
    );

    create("p", ["cloud-disclaimer"], this.loginForm, {
      innerText:
        "Disclaimer: the security on this website was made as a hobby project " +
        "by some random guy. I tried my best, but don't use your bank account password or anything.",
    });

    const r4 = create(
      "div",
      ["flex-row", "flex-self-bottom", "space-evenly", "width-100pct"],
      this.loginForm,
    );

    const ulabel = create("label", [], r1, {
      htmlFor: "username",
      innerText: "username: ",
    });
    const plabel = create("label", [], r2, {
      htmlFor: "password",
      innerText: "password: ",
    });
    const vlabel = create("label", [], r3, {
      htmlFor: "visibility",
      innerText: "show password: ",
    });
    this.username = create("input", [], r1, {
      name: "username",
      type: "text",
      required: true,
    });
    this.password = create("input", [], r2, {
      name: "password",
      type: "password",
      required: true,
    });
    this.showPass = create("input", [], r3, {
      name: "visibility",
      type: "checkbox",
    });
    this.login = create("button", [], r4, { innerText: "login" });
    this.register = create("button", [], r4, {
      innerText: "register",
    });

    // change type of password element on toggle
    this.showPass.onchange = () => {
      if (this.showPass.checked) {
        this.password.type = "text";
      } else {
        this.password.type = "password";
      }
    };

    // run a background task every minute that checks for changes and tries to sync to the server
    window.setInterval(() => this.saveIfNeeded(), 60000);
  }

  async saveIfNeeded() {
    if (!this.loggedIn) return;

    // get the current hash, compare to stored hash, check if we need to update timestamp.
    // if we do, send our current updated content to the server.
    // make a request to the server and get its timestamp
    // if the server has newer content than us, load it.
  }

  async online() {
    const res = await sendJSON("/swstatus", "POST", {});
    const data = await res.json();

    return !data.offline;
  }

  async login(username, password) {
    const res = await sendJSON("/api/login", "POST", {
      username: username,
      password: password,
    });
    const data = await res.json();
    console.log(data);
  }

  async logout() {
    const res = await sendJSON("/api/logout", "POST", {});
    const data = await res.json();
    console.log(data);
  }

  async register(username, password) {
    const res = await sendJSON("/api/register", "POST", {
      username: username,
      password: password,
    });
    const data = await res.json();
    console.log(data);
  }

  async status() {
    const res = await sendJSON("/api/status", "POST", {});
    return await res.json();
  }

  async saveData(slot = 0) {
    const res = await sendJSON("/api/saveData", "POST", {
      slot: slot,
      data: exportLocalStorage(),
    });
    const data = await res.json();
    console.log(data);
  }

  async getData(slot = 0) {
    const res = await sendJSON("/api/getData", "POST", {
      slot: slot,
    });
    const data = await res.json();

    return data.data;
  }
}
