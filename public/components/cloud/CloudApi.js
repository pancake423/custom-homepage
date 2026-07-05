import { exportLocalStorage } from "./export.js";
import { sendJSON } from "../helpers.js";

export default class CloudApi {
  static async online() {
    const res = await sendJSON("/swstatus", "POST", {});
    const data = await res.json();

    return !data.offline;
  }

  static async login({ username, password }) {
    const res = await sendJSON("/api/login", "POST", {
      username: username,
      password: password,
    });
    const data = await res.json();
    data.status = res.status;

    return data;
  }

  static async logout() {
    const res = await sendJSON("/api/logout", "POST", {});
    const data = await res.json();
    data.status = res.status;

    return data;
  }

  static async register({ username, password }) {
    const res = await sendJSON("/api/register", "POST", {
      username: username,
      password: password,
    });
    const data = await res.json();
    data.status = res.status;

    return data;
  }

  static async status() {
    const res = await sendJSON("/api/status", "POST", {});
    return await res.json();
  }

  static async saveData(slot = 0) {
    const res = await sendJSON("/api/saveData", "POST", {
      slot: slot,
      data: exportLocalStorage(),
    });
    const data = await res.json();
    console.log(data);
  }

  static async getData(slot = 0) {
    const res = await sendJSON("/api/getData", "POST", {
      slot: slot,
    });
    const data = await res.json();

    return data.data;
  }
}
