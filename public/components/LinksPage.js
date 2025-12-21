import Page from "./Page.js";
import { loadPartial } from "./helpers.js";
import ObjectStore from "./ObjectStore.js";

const LINKS_STORAGE_KEY = "links";

async function settingsLinkRow(parent, data, storage, key) {
  const row = await loadPartial("/partials/settings-link-item.html");
  row.querySelector(".settings-link-thumbnail").src = data.thumbnail;
  row.querySelector(".settings-link-name").innerHTML =
    `${data.title} (<a href=${data.url} target="_blank">${data.url}</a>)`;
  const btn = row.querySelector(".settings-link-delete");
  btn.onclick = () => {
    row.remove();
    storage.delete(key);
  };
  parent.appendChild(row);
}

export default class LinksPage extends Page {
  constructor(settingsDiv) {
    super("Home");
    // links should be an array of objects.
    // each object will be: {title: str, thumbnail: base64 image, url: string}
    this.links = new ObjectStore(LINKS_STORAGE_KEY);
    this.settingsDiv = settingsDiv;
  }

  async loadPageSettings() {
    const d = this.settingsDiv;
    d.innerHTML = "";
    for (const key of Object.keys(this.links.getAll())) {
      const data = this.links.get(key);
      await settingsLinkRow(d, data, this.links, key);
    }
    const create = await loadPartial("/partials/settings-link-create.html");
    const btn = create.querySelector(".settings-link-create");
    btn.onclick = async () => {
      const input = create.querySelector(".settings-link-input");
      btn.classList.add("settings-link-blocked");
      btn.innerText = "loading...";
      await this.addLink(input.value);
      input.value = "";
      btn.innerText = "create";
      btn.classList.remove("settings-link-blocked");
    };
    d.appendChild(create);
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
