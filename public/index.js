import Navbar from "./components/Navbar.js";
import ColorManager from "./components/ColorManager.js";
import Settings from "./components/Settings.js";
import LinksPage from "./components/LinksPage.js";
import { registerServiceWorker } from "./components/helpers.js";
import DuckGame from "./components/DuckGame.js";
import JettyJeeve from "./components/JettyJeeve.js";
import NotesPage from "./components/notes/NotesPage.js";
import HistoryManager from "./components/color/HistoryManager.js";
import CloudSync from "./components/cloud/CloudSync.js";

window.addEventListener("DOMContentLoaded", async () => {
  await registerServiceWorker();
  await ColorManager.load();
  HistoryManager.init();

  const isMobile = window.matchMedia("(max-width: 600px)").matches;

  const settings = await Settings.construct();
  const homepage = new LinksPage(settings.links);

  // don't load the games on mobile since they're
  // unplayable anyways
  if (!isMobile) {
    const game = new DuckGame(homepage.base);
    await game.init();

    const jj = new JettyJeeve(game);
    await jj.init();
  }

  const notes = new NotesPage("Notes");
  const cloud = new CloudSync();
  const navbar = new Navbar(homepage, notes, cloud);
  await homepage.loadPageSettings();
  navbar.navigate(homepage);
});
