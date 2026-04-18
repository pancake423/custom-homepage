import { loadPartial, loadSVG } from "./helpers.js";
import ColorManager from "./ColorManager.js";
import ColorPicker from "./color/ColorPicker.js";

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

async function initColorSettings(colors) {
  // add contents to colors page
  // 1. group colors by category
  const categories = {};
  for (const info of ColorManager.data) {
    if (categories[info.category] == undefined) {
      categories[info.category] = [];
    }
    categories[info.category].push(info);
  }
  const color_pickers = {};

  // 2. add each category as a subsection, and fill the color info
  for (const category of Object.keys(categories)) {
    const sect = await addSection(colors, category);
    for (const info of categories[category]) {
      const node = document.createElement("div");
      node.classList.add("settings-color-box");
      const label = document.createElement("label");
      label.for = info.name;
      label.innerText = info.display;
      const picker = new ColorPicker(ColorManager.get(info.name));
      color_pickers[info.name] = picker;
      picker.setCallback((c) => ColorManager.set(info.name, c));
      // const picker = document.createElement("input");
      // picker.type = "color";
      // picker.id = info.name;
      // picker.value = ColorManager.get(info.name);
      // picker.onchange = () => {
      //   ColorManager.set(info.name, picker.value);
      // };
      node.appendChild(label);
      node.appendChild(picker.base);
      sect.appendChild(node);
    }
  }
  // 3. add a "reset all" button to the bottom of the page
  const btn = document.createElement("button");
  btn.innerText = "Reset All";
  btn.classList.add("settings-color-reset");
  btn.onclick = () => {
    if (!confirm("Reset color scheme to default? This can't be undone."))
      return;
    ColorManager.reset();
    // make sure that displayed colors stay synced
    Object.keys(color_pickers).forEach((key) => {
      const cp = color_pickers[key];
      cp.setColor(ColorManager.get(key));
    });
  };
  colors.appendChild(btn);
}

export default class Settings {
  static async construct() {
    const s = new Settings();
    s.icon = await loadSVG("/assets/icons/flower.svg", true);
    s.icon.classList.add("settings-icon");
    s.icon.title = "Settings";
    document.body.appendChild(s.icon);

    s.page = await loadPartial("/partials/settings-page.html");
    document.body.appendChild(s.page);

    const parent = s.page.querySelector(".settings-container");
    s.links = await addSection(parent, "Links Page");
    // s.notes = await addSection(parent, "Notes Page");
    const colors = await addSection(parent, "Color Scheme");

    await initColorSettings(colors);

    s.icon.onclick = () => {
      s.page.classList.toggle("settings-hidden");
    };
    s.page.querySelector(".settings-close").onclick = () =>
      s.page.classList.toggle("settings-hidden");
    s.page.onclick = (e) => {
      if (e.target == s.page) {
        s.page.classList.toggle("settings-hidden");
      }
    };
    return s;
  }
}
