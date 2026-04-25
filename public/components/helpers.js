/**
 * load an SVG image from an .svg file.
 * returns it as an inline HTML <svg> tag.
 *
 * @param {string} path - path to the SVG file on the server
 * @param {bool} dynamicColor - Enables dynamic colors on this SVG element.
 * if true, replaces the "fill" property of all paths with "currentColor".
 * allows you to change the color of the element using the CSS color property.
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/color
 *
 * @returns {Promise<HTMLElement>}
 */
export async function loadSVG(path, dynamicColor = false) {
  // fetch the text contents of the svg file
  const svgText = await (await fetch(path)).text();

  // create an HTML element (div) and set its inner HTML to be the SVG text
  const container = document.createElement("div");
  container.innerHTML = svgText;
  const svg = container.children[0];
  if (!dynamicColor) return svg;

  // look for matching tag types and replace or add the "fill" property
  const targetTags = ["path", "rect", "circle", "ellipse", "line", "polyline"];

  const elements = [svg];
  while (elements.length > 0) {
    const el = elements.pop();
    // flatten any recusive structure
    for (const child of el.children) {
      elements.push(child);
    }
    if (targetTags.includes(el.tagName)) {
      el.setAttribute("fill", "currentColor");
    }
  }
  return svg;
}

const partialsCache = {};

/**
 * loads an HTML "partial" from the specified path (url).
 *
 * note that partials are cached, so subsequent calls won't make additional
 * network requests
 *
 * @param {string} path - path to the HTML file.
 * @param {bool} [wrap] - if true, wrap the contents of the file in a div. if false, assumes
 * that your partial is already wrapped in a top-level div (or other containing element).
 * @returns {Promise<HTMLElement>}
 */
export async function loadPartial(path, wrap = false) {
  if (partialsCache[path] !== undefined) {
    return partialsCache[path].cloneNode(true);
  }
  const container = document.createElement("div");
  container.innerHTML = await (await fetch(path)).text();
  partialsCache[path] = wrap ? container : container.childNodes[0];

  return await loadPartial(path);
}

export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        "/serviceWorker.js",
        {
          scope: "/",
        },
      );
      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
}

/**
 * truncates a string.
 *
 * @param {String} s - the string to truncate
 * @param {Number} maxLen - the maximum allowed length. defaults to 50.
 * @param {Number} elipses - number of elipses to append if truncating. defaults to 3.
 * @returns {String} the truncated string
 */
export function truncate(s, maxLen = 50, elipses = 3) {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - elipses) + ".".repeat(elipses);
}

/**
 * substring function with support for negative indices.
 *
 * @param {string} s - string to take substring from.
 * @param {number} start- index of the beginning of the substring.
 * @param {number} end- index of the end of the substring. The character at this position is not included.
 * @returns {string}
 */
export function substring(s, start, end) {
  const start_actual = start >= 0 ? start : s.length + start;
  const end_actual = end >= 0 ? end : s.length + end;

  return s.substring(start_actual, end_actual);
}

/**
 * loads a texture to an image bitmap.
 *
 * @param {string} texturePath- path to the texture (image) file.
 * @returns {Promise<ImageBitmap>}
 */
export async function loadImageBitmap(texturePath) {
  const res = await fetch(texturePath);
  const data = URL.createObjectURL(await res.blob());
  const img = new Image();
  img.src = data;
  await img.decode();
  return await createImageBitmap(img);
}

export async function sendJSON(url, method, body) {
  return await fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// put in global scope for testing endpoints in the console
window.sendJSON = sendJSON;

window.debugEndpoint = async (url, method, body) => {
  const res = await sendJSON(url, method, body);
  const data = await res.json();

  console.log(data);
};
