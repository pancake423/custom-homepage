import { create, errorMessage } from "../helpers.js";
import Page from "../Page.js";
import CloudApi from "./CloudApi.js";
import ErrorToast from "./ErrorToast.js";

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
      ["cloud-login-panel", "flex-col", "flex-self-bottom", "page-hide"],
       this.panel,
    );


    this.userText = create("b", ["red"], create("p", [], this.statusPage, {innerText: "Logged in as "}));
    this.loggedIn = false;

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
        "Disclaimer: the security on this website was made as a hobby project. " +
        "I tried my best, but don't use your bank account password or anything.",
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
    this.loginButton = create("button", [], r4, { innerText: "log in" });
    this.registerButton = create("button", [], r4, {
      innerText: "register",
    });
    this.logoutButton = create("button", [], this.statusPage, { innerText: "log out" });

    this.showPass.onchange = () => this.togglePasmessageswordVisibility();
    this.loginButton.onclick = () => this.login();
    this.logoutButton.onclick = () => this.logout();
    this.registerButton.onclick = () => this.register();

    // run a background task every minute that checks for changes and tries to sync to the server
    window.setInterval(() => this.saveIfNeeded(), 60000);

    this.checkLoginStatus();
  }

  getLoginData() {
    const format = (v) => {
      const stripped = v.trim();
      return stripped == "" ? null : stripped;
    };
    return {
      username: format(this.username.value),
      password: format(this.password.value),
    };
  }

  togglePasswordVisibility() {
    if (this.showPass.checked) {
      this.password.type = "text";
    } else {
      this.password.type = "password";
    }
  }

  async checkLoginStatus() {
    const data = await CloudApi.status();
    this.userText.innerHTML = data.username;
    this.loggedIn = data.loggedIn;
    console.log(data);

    if (this.loggedIn) {
      this.loginForm.classList.add("page-hide");
      this.statusPage.classList.remove("page-hide");
      return;
    }
    this.loginForm.classList.remove("page-hide");
    this.statusPage.classList.add("page-hide");
  }

  async login() {
    const res = await CloudApi.login(this.getLoginData());
    if (res.status !== 200) {
      ErrorToast.notify("Failed to log in: " + errorMessage(res), 5);
      return false;
    }
    // TODO: handle login (switch to the correct panel, check for sync data, etc.)
    console.log(res);
    await this.checkLoginStatus();
    return true;
  }

  async logout() {
    await CloudApi.logout();
    await this.checkLoginStatus();
  }

  async register() {
    const res = await CloudApi.register(this.getLoginData());
    if (res.status !== 201) {
      ErrorToast.notify("Failed to register: " + errorMessage(res), 3);
      return false;
    }
    // TODO: handle register (switch to the correct panel, create sync data, etc.)
    console.log(res);
    return true;
  }

  async saveIfNeeded() {
    if (!this.loggedIn) return;

    // get the current hash, compare to stored hash, check if we need to update timestamp.
    // if we do, send our current updated content to the server.
    // make a request to the server and get its timestamp
    // if the server has newer content than us, load it.
  }
}
