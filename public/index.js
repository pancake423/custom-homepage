import Page from "./components/Page.js";
import Navbar from "./components/Navbar.js";
import ColorManager from "./components/ColorManager.js";
import Settings from "./components/Settings.js";
import ObjectStore from "./components/ObjectStore.js";
import LinksPage from "./components/LinksPage.js";

// debug helper: make classes available from console
window.ColorManager = ColorManager;
window.ObjectStore = ObjectStore;

window.addEventListener("DOMContentLoaded", async () => {
  await ColorManager.load();

  const homepage = new LinksPage();
  window.homepage = homepage;
  const notes = new Page("Notes");

  const navbar = new Navbar(homepage, notes);

  const settings = Settings.construct();
});
