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
export default async function loadSVG(path, dynamicColor = false) {
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
