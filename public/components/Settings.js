import loadSVG from "./SVGLoader.js";

export default class Settings {
  static async construct() {
    const obj = new Settings();
    obj.icon = await loadSVG("/assets/gear-fill.svg");
    obj.icon.classList.add("settings-icon");
    document.body.appendChild(obj.icon);

    return obj;
  }
}
