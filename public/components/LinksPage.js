import Page from "./Page.js";
import ObjectStore from "./ObjectStore.js";

const LINKS_STORAGE_KEY = "links";

export default class LinksPage extends Page {
  constructor() {
    super("Home");
    // links should be an array of objects.
    // each object will be: {title: str, thumbnail: base64 image}
    this.links = new ObjectStore(LINKS_STORAGE_KEY);
  }

  initPageSettings(parentDiv) {}

  async addLink(url) {
    // fetch the page
    // get its title and favicon
    const res = await fetch("/api/generateLink", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }),
    });
  }
}
