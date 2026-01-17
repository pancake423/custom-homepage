import Page from "./Page.js";
import { loadPartial, truncate } from "./helpers.js";
import ObjectStore from "./ObjectStore.js";
import { Clock } from "./Clock.js";

const LINKS_STORAGE_KEY = "links";
const CLOCK_STORAGE_KEY = "clock";

export default class LinksPage extends Page {
  constructor(settingsDiv) {
    super("Home");
    this.base.classList.add("links-page");
    // links should be an array of objects.
    // each object will be: {title: str, thumbnail: base64 image, url: string}
    this.links = new ObjectStore(LINKS_STORAGE_KEY);
    this.settingsDiv = settingsDiv;

    this.container = document.createElement("div");
    this.container.classList.add("links-container");
    this.base.appendChild(this.container);

    // find or create stored clock settings
    this.clockStore = new ObjectStore(CLOCK_STORAGE_KEY);
    if (this.clockStore.get("fmt") == undefined) {
      this.clockStore.set("fmt", "12");
    }
    if (this.clockStore.get("sec") == undefined) {
      this.clockStore.set("sec", "yes");
    }
    this.clock = new Clock(
      this.base,
      this.clockStore.get("fmt"),
      this.clockStore.get("sec") == "yes",
    );
  }

  async settingsLinkRow(parent, data, storage, key) {
    const row = await loadPartial("/partials/settings-link-item.html");
    row.querySelector(".settings-link-thumbnail").src = data.thumbnail;
    row.querySelector(".settings-link-name").innerHTML =
      `${truncate(data.title)} (<a href=${data.url} target="_blank">${truncate(data.url)}</a>)`;
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

    row.ondragstart = (e) => {
      e.dataTransfer.setData("text/plain", key);
    };
    row.ondragover = (e) => {
      e.preventDefault();
    };
    row.ondrop = (e) => {
      e.preventDefault();
      const swapKey = Number(e.dataTransfer.getData("text/plain"));
      const swapItem = storage.get(swapKey);
      storage.set(swapKey, storage.get(key));
      storage.set(key, swapItem);
      this.loadPageSettings();
    };
    parent.appendChild(row);
  }

  async loadPageSettings() {
    const d = this.settingsDiv;
    d.innerHTML = "";
    // create the radio checkboxes for the clock
    const clockSettings = await loadPartial("/partials/settings-clock.html");
    d.appendChild(clockSettings);
    for (const radio of clockSettings.querySelectorAll(
      "input[name='radio-clock']",
    )) {
      if (radio.value == this.clockStore.get("fmt")) {
        radio.setAttribute("checked", "");
      }
      radio.onclick = () => {
        this.clock.setFormat(radio.value);
        this.clockStore.set("fmt", radio.value);
      };
    }
    for (const radio of clockSettings.querySelectorAll(
      "input[name='radio-sec']",
    )) {
      if (radio.value == this.clockStore.get("sec")) {
        radio.setAttribute("checked", "");
      }
      radio.onclick = () => {
        this.clockStore.set("sec", radio.value);
        if (radio.value == "yes") {
          this.clock.enableSeconds();
        } else {
          this.clock.disableSeconds();
        }
      };
    }

    // create the settings menu entries for each link
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
    this.container.innerHTML = "";
    for (const key of Object.keys(this.links.getAll())) {
      const data = this.links.get(key);
      const div = document.createElement("div");
      const img = document.createElement("img");
      const p = document.createElement("p");
      img.src = data.thumbnail;
      p.innerText = truncate(data.title.trim());
      div.appendChild(img);
      div.appendChild(p);
      div.onclick = () =>
        open(
          data.url.startsWith("http") ? data.url : "https://" + data.url,
          "_blank",
        );
      div.title = data.url;
      this.container.appendChild(div);
    }
  }

  async addLink(url) {
    // fetch the page
    // get its title and favicon
    const res = await fetch("/api/getFavicon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }),
    });
    if (res.status !== 200) {
      alert(
        `could not find website with URL '${url}'. Check for typos or issues with the website..`,
      );
      return;
    }
    const data = await res.json();
    console.log(data);
    this.links.save(data);
    await this.loadPageSettings();
  }
}
