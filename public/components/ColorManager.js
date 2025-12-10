/*
a locally-saved color lookup table.

fields and default values are loaded from /config/colors.json
*/

export default class ColorManager {
  static prefix = "";
  static colors = [];
  static loaded = false;
  static data = {};

  /**
   * load (initialize) the set of colors required for the application.
   *
   * @param {string} [configPath] - path to the configuration file.
   */
  static async load(configPath = "/config/colors.json") {
    ColorManager.loaded = true;
    const config = await (await fetch(configPath)).json();
    ColorManager.prefix = config.storagePrefix;
    ColorManager.data = config.colors;

    for (const color of config.colors) {
      ColorManager.colors.push(color.name);
      if (ColorManager.get(color.name) == null) {
        ColorManager.set(color.name, color.default);
      }
      ColorManager.setCss(color.name, ColorManager.get(color.name));
    }
  }

  /**
   * throws an error if passed an invalid color field name,
   * or if the color manager was never initialized
   *
   * @param {string} name - the name of the color field
   */
  static check(name) {
    if (!ColorManager.loaded) {
      throw new Error(
        `ColorManager has not been loaded. Call "await ColorManager.load()" before accessing colors.`,
      );
    }
    if (!ColorManager.colors.includes(name)) {
      throw new Error(`tried to get invalid color name "${name}"`);
    }
  }

  /**
   * get the value of a stored color
   *
   * @param {string} name - the name of the color field
   * @returns {string} stored color
   */
  static get(name) {
    ColorManager.check(name);
    return localStorage.getItem(ColorManager.prefix + name);
  }

  /**
   * set (update) the value of a stored color
   *
   * @param {string} name - the name of the color field
   * @param {string} value - the color to store
   */
  static set(name, value) {
    const fullName = ColorManager.prefix + name;
    ColorManager.check(name);
    localStorage.setItem(fullName, value);
    ColorManager.setCss(name, value);
  }

  /**
   * resets all colors to their default values.
   */
  static reset() {
    for (const color of ColorManager.data) {
      ColorManager.set(color.name, color.default);
    }
  }

  static setCss(name, value) {
    const r = document.querySelector(":root");
    r.style.setProperty("--" + name, value);
  }
}
