import Page from "./components/Page.js";
import Navbar from "./components/Navbar.js";
import ColorManager from "./components/ColorManager.js";
import Settings from "./components/Settings.js";
import ObjectStore from "./components/ObjectStore.js";
import LinksPage from "./components/LinksPage.js";
import { registerServiceWorker } from "./components/helpers.js";

window.addEventListener("DOMContentLoaded", async () => {
  await registerServiceWorker();
  await ColorManager.load();

  const settings = await Settings.construct();

  const homepage = new LinksPage(settings.links);
  const notes = new Page("Notes");

  const navbar = new Navbar(homepage, notes);
  await homepage.loadPageSettings();
  navbar.navigate(homepage);

  window.homepage = homepage;
});
