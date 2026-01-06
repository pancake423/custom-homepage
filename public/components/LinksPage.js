import Page from "./Page.js";
import { loadPartial } from "./helpers.js";
import ObjectStore from "./ObjectStore.js";

const LINKS_STORAGE_KEY = "links";

export default class LinksPage extends Page {
  constructor(settingsDiv) {
    super("Home");
    this.base.classList.add("links-page");
    // links should be an array of objects.
    // each object will be: {title: str, thumbnail: base64 image, url: string}
    this.links = new ObjectStore(LINKS_STORAGE_KEY);
    this.settingsDiv = settingsDiv;
  }

  async settingsLinkRow(parent, data, storage, key) {
    const row = await loadPartial("/partials/settings-link-item.html");
    row.querySelector(".settings-link-thumbnail").src = data.thumbnail;
    row.querySelector(".settings-link-name").innerHTML =
      `${data.title} (<a href=${data.url} target="_blank">${data.url}</a>)`;
    const delbtn = row.querySelector(".settings-link-delete");
    delbtn.onclick = () => {
      row.remove();
      storage.delete(key);
      this.loadPageSettings();
    };
    const editbtn = row.querySelector(".settings-link-edit");
    editbtn.onclick = () => {
      const name = prompt("Enter a new title for this link:", data.title);
      if (name == null || name == "") return;
      data.title = name;
      storage.set(key, data);
      this.loadPageSettings();
    };
    parent.appendChild(row);
  }

  async loadPageSettings() {
    const d = this.settingsDiv;
    d.innerHTML = "";
    for (const key of Object.keys(this.links.getAll())) {
      const data = this.links.get(key);
      await this.settingsLinkRow(d, data, this.links, key);
    }
    const create = await loadPartial("/partials/settings-link-create.html");
    const btn = create.querySelector(".settings-link-create");
    btn.onclick = async () => {
      const input = create.querySelector(".settings-link-input");
      btn.classList.add("settings-link-blocked");
      btn.innerText = "loading...";
      try {
        await this.addLink(input.value);
      } catch (e) {
        console.log(e);
        alert(
          "This feature is unavailable because the server is unreachable (either you're offline or the server is down). Please try again later.",
        );
      }
      input.value = "";
      btn.innerText = "create";
      btn.classList.remove("settings-link-blocked");
    };
    d.appendChild(create);

    // create the actual settings icon elements on the page
    this.base.innerHTML = "";
    const container = document.createElement("div");
    container.classList.add("links-container");
    for (const key of Object.keys(this.links.getAll())) {
      const data = this.links.get(key);
      const div = document.createElement("div");
      const img = document.createElement("img");
      const p = document.createElement("p");
      img.src = data.thumbnail;
      p.innerText = data.title.trim();
      div.appendChild(img);
      div.appendChild(p);
      div.onclick = () =>
        open(
          data.url.startsWith("http") ? data.url : "https://" + data.url,
          "_blank",
        );
      div.title = data.url;
      container.appendChild(div);
    }

    this.base.appendChild(container);
  }

  async addLink(url) {
    // fetch the page
    // get its title and favicon
    const res = await fetch("/api/generateLink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }),
    });
    if (res.status !== 200) {
      alert(
        `could not find website with URL '${url}'. Check for typos or internet connection issues..`,
      );
      return;
    }
    const data = await res.json();
    this.links.save(data);
    await this.loadPageSettings();
  }
}
