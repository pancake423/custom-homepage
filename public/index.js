import Navbar from "./components/Navbar.js";
import ColorManager from "./components/ColorManager.js";
import Settings from "./components/Settings.js";
import LinksPage from "./components/LinksPage.js";
import { registerServiceWorker } from "./components/helpers.js";
import DuckGame from "./components/DuckGame.js";
import JettyJeeve from "./components/JettyJeeve.js";
import NotesPage from "./components/notes/NotesPage.js";

window.addEventListener("DOMContentLoaded", async () => {
  await registerServiceWorker();
  await ColorManager.load();

  const settings = await Settings.construct();

  const homepage = new LinksPage(settings.links);
  const game = new DuckGame(homepage.base);
  await game.init();

  const jj = new JettyJeeve(game);
  await jj.init();
  const notes = new NotesPage("Notes");

  const navbar = new Navbar(homepage, notes);
  await homepage.loadPageSettings();
  navbar.navigate(homepage);

  window.notes = notes;
});
