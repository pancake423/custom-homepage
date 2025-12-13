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
