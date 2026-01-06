import { PORT } from "./env.js";

const FALLBACK_URL = `http://localhost:${PORT}/assets/images/default-favicon.png`;

export function parseFaviconURL(reqUrl) {
  const url = new URL(reqUrl.startsWith("http") ? reqUrl : "https://" + reqUrl);
  return `https://www.google.com/s2/favicons?domain=${url.protocol + "//" + url.host}&sz=128`;
}

export function parseTitle(rawHTMLString, reqUrl) {
  const OPEN_BRACKET_LEN = "<title>".length;
  const CLOSE_BRACKET_LEN = "</title>".length;
  const titles = String(rawHTMLString).match(/<title>.*?<\/title>/gms);
  if (titles == null) {
    return reqUrl;
  }
  return titles[0].substring(
    OPEN_BRACKET_LEN,
    titles[0].length - CLOSE_BRACKET_LEN,
  );
}
