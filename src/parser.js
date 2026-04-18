import puppeteer, { Browser } from "puppeteer";
import { curly } from "node-libcurl";

const FALLBACK_URL = "/assets/images/default-favicon.png";

/** @type {Browser|null} */
let browser = null;

/**
 * an object containing basic information about a website
 *
 * @typedef {Object} SiteInfo
 * @property {string?} url - the url of the website
 * @property {string?} thumbnail - the website's favicon as a base64-encoded string
 * @property {string?} title - the website's title.
 * @property {string?} error - the error when retrieving site info, or null if no errors.
 */

/**
 * normalizes an error message and returns it as a string.
 * @param {*} e
 * @returns {string}
 */
function toErrorString(e) {
  let e_norm = e;
  if (!(e instanceof Error)) {
    e_norm = new Error(e);
  }
  return e.name + ": " + e_norm.message;
}

/**
 * ensures that a url is properly formed and actually exists
 *
 * @param {string} url
 */
function validateUrl(url) {
  try {
    const valid_url = new URL(url.startsWith("http") ? url : "https://" + url)
      .href;

    return {
      url: valid_url,
      error: null,
    };
  } catch (e) {
    return {
      url: null,
      error: toErrorString(e),
    };
  }
}

/**
 * tries to get a favicon from the provided url and base64 encode it.
 * returns null on failure.
 *
 * @param {string} url - a favicon url
 * @returns {Promise<string|null>}
 */
async function getFaviconFrom(url) {
  try {
    const rep = await curly.get(url, {
      followLocation: 1,
    });
    const headers = rep.headers[rep.headers.length - 1];
    const base64url =
      "data:" +
      headers["content-type"] +
      ";base64," +
      rep.data.toString("base64");

    return base64url;
  } catch {
    return null;
  }
}

function baseFaviconUrls(reqUrl) {
  const url = new URL(reqUrl.startsWith("http") ? reqUrl : "https://" + reqUrl);
  return [
    `https://www.google.com/s2/favicons?domain=${url.protocol + "//" + url.host}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${url.host}.ico`,
  ];
}

/**
 * Get a site's favicon (base64 url encoded), url, and title wrapped in a JS object.
 *
 * @param {string|URL} url
 *
 * @returns {Promise<SiteInfo>}
 */
export async function getSiteInfo(url) {
  // validate/normalize the url
  const res = validateUrl(url);
  const valid_url = res.url;

  // return an error response if it doesn't work
  if (res.error !== null) {
    return {
      title: null,
      thumbnail: null,
      url: url,
      error: res.error,
    };
  }

  // list of potential favicon urls, in the order we should try them.
  const favicon_urls = baseFaviconUrls(valid_url);

  // try to get the site's favicon
  // first use existing services (google, then duckduckgo)
  // if those fail, scrape it from the site directly using puppeteer
  // if that fails, provide a default favicon

  if (browser === null) {
    browser = await puppeteer.launch();
  }
  const page = await browser.newPage();
  try {
    await page.goto(valid_url);
  } catch (e) {
    return {
      title: null,
      thumbnail: null,
      url: url,
      error: toErrorString(e),
    };
  }
  // if it takes more than 5 seconds for your page to load its title/favicon
  // you've failed as a web designer
  try {
    await page.waitForNetworkIdle({ timeout: 5000 });
  } catch {}
  const title = await page.$eval("title", (t) => t.textContent);
  let thumbnail = null;

  await page.close();

  for (const fv of favicon_urls) {
    if (thumbnail !== null) break;
    thumbnail = await getFaviconFrom(fv);
  }
  if (thumbnail == null) thumbnail = FALLBACK_URL;
  return { title: title || url, url: valid_url, thumbnail, error: null };
}

/**
 * fast method for getting just the favicon of a website.
 *
 * @param {string} url
 * @returns {Promise<string>} base64 encoded url, or path to fallback favicon.
 */
export async function getFavicon(url) {
  try {
    const valid_url = new URL(url.startsWith("http") ? url : "https://" + url);
    const favicon_urls = [
      `https://www.google.com/s2/favicons?domain=${valid_url.protocol + "//" + valid_url.host}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${valid_url.host}.ico`,
    ];

    for (const fv of favicon_urls) {
      const res = await getFaviconFrom(fv);
      if (res !== null) {
        return res;
      }
    }
  } catch {}
  return FALLBACK_URL;
}
