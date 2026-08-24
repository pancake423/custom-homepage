import { create, errorMessage } from "../helpers.js";
import Page from "../Page.js";
import CloudApi from "./CloudApi.js";
import ErrorToast from "./ErrorToast.js";
import {
  exportLocalStorage,
  getContentHash,
  importLocalStorage,
  unixTimestampSeconds,
} from "./export.js";

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

    this.userText = create(
      "b",
      ["red"],
      create("p", [], this.statusPage, { innerText: "Logged in as " }),
    );
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
    this.logoutButton = create("button", [], this.statusPage, {
      innerText: "log out",
    });

    this.syncText = create(
      "b",
      ["red"],
      create("p", [], this.statusPage, { innerText: "Last synced at " }),
    );

    this.syncButton = create("button", [], this.statusPage, {
      innerText: "sync now",
    });

    this.showPass.onchange = () => this.togglePasswordVisibility();
    this.loginButton.onclick = () => this.login();
    this.logoutButton.onclick = () => this.logout();
    this.registerButton.onclick = () => this.register();
    this.syncButton.onclick = () => this.saveOrSyncIfNeeded();

    // run a background task every 30s that checks for changes and tries to sync to the server
    window.setInterval(() => this.saveOrSyncIfNeeded(), 30000);

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
      await this.saveOrSyncIfNeeded();
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
    await this.checkLoginStatus();
    return true;
  }

  async saveOrSyncIfNeeded() {
    this.syncText.innerText = new Date().toLocaleTimeString();

    if (!this.loggedIn) return;

    // get the current hash, compare to stored hash, check if we need to update timestamp.
    const contents = await exportLocalStorage();
    const hash = await getContentHash(contents);

    const timestamp = parseInt(localStorage.getItem("timestamp") ?? 0);
    const serverTimestamp = (await CloudApi.status()).lastUpdated[0] ?? 0;

    console.log(hash, timestamp, serverTimestamp);

    let localContentHasUpdate = hash != localStorage.getItem("content-hash");
    let remoteHasUpdate = serverTimestamp > timestamp;

    if (localContentHasUpdate && remoteHasUpdate) {
      const preferRemote = timestamp == 0 ? true : confirm(
        "The save on your local machine conflicts with the save on the cloud. Do you want to use the save on the cloud?",
      );
      if (preferRemote) {
        localContentHasUpdate = false;
      } else {
        remoteHasUpdate = false;
      }
    }

    if (localContentHasUpdate) {
      console.log("attempting to save local changes.");
      localStorage.setItem("content-hash", hash);
      localStorage.setItem("timestamp", unixTimestampSeconds());

      // if we do, send our current updated content to the server.
      await CloudApi.saveData(0, contents);

      return;
    }
    // make a request to the server and get its timestamp
    // if the server has newer content than us, load it.
    if (remoteHasUpdate) {
      console.log("attempting to fetch remote changes.");
      const serverContents = await CloudApi.getData(0);
      await importLocalStorage(serverContents);
      localStorage.setItem("content-hash", await getContentHash(await exportLocalStorage()));
      localStorage.setItem("timestamp", unixTimestampSeconds());

      // this is lazy, but the easiest way to get changes to show up on the page.
      // I am not smart enough to be more clever right now.
      window.location.reload();
    }
  }
}
