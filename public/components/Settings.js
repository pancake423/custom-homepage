import { loadPartial, loadSVG } from "./helpers.js";
import ColorManager from "./ColorManager.js";

async function addSection(parent, name) {
  const section = await loadPartial("/partials/settings-section.html", true);
  section.querySelector(".settings-title").innerHTML = name;
  parent.appendChild(section);
  const items = section.querySelector(".settings-items");
  const caret = section.querySelector(".settings-caret");
  section.querySelector(".settings-section-title").onclick = () => {
    // collapse or show the section here
    items.classList.toggle("settings-hidden");
    caret.classList.toggle("settings-caret-rotated");
  };
  return items;
}

export default class Settings {
  static async construct() {
    const s = new Settings();
    s.icon = await loadSVG("/assets/flower.svg", true);
    s.icon.classList.add("settings-icon");
    s.icon.title = "Settings";
    document.body.appendChild(s.icon);

    s.page = await loadPartial("/partials/settings-page.html");
    document.body.appendChild(s.page);

    const parent = s.page.querySelector(".settings-container");
    const links = await addSection(parent, "Links Page");
    const notes = await addSection(parent, "Notes Page");
    const colors = await addSection(parent, "Color Scheme");

    // add contents to colors page
    // 1. group colors by category
    const categories = {};
    for (const info of ColorManager.data) {
      if (categories[info.category] == undefined) {
        categories[info.category] = [];
      }
      categories[info.category].push(info);
    }
    // 2. add each category as a subsection, and fill the color info
    for (const category of Object.keys(categories)) {
      const sect = await addSection(colors, category);
      for (const info of categories[category]) {
        const node = document.createElement("p");
        node.innerText = info.display;
        sect.appendChild(node);
      }
    }

    s.icon.onclick = () => {
      s.page.classList.toggle("settings-hidden");
    };
    s.page.onclick = (e) => {
      if (e.target == s.page) {
        s.page.classList.toggle("settings-hidden");
      }
    };
    return s;
  }
}
