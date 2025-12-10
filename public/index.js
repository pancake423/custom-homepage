import Page from "./components/Page.js";
import Navbar from "./components/Navbar.js";
import ColorManager from "./components/ColorManager.js";

// debug helper: make classes available from console
window.ColorManager = ColorManager;

window.addEventListener("DOMContentLoaded", async () => {
  await ColorManager.load();

  const homepage = new Page("Home");
  const notes = new Page("Notes");

  const navbar = new Navbar(homepage, notes);
});
