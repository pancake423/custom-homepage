export function parseFaviconURL(rawHTMLString, reqUrl) {
  // extract tags matching (<link rel="icon">)
  // handles single quotes, or rel not being the first tag, or the rel being shortcut icon
  const links = String(rawHTMLString)
    .match(/<link.*?>/gms)
    .filter((v) => v.match(/rel\s?=\s?['"].*?icon.*?["']/gm));

  // choose the highest resolution icon, if specified.
  // if not, choose the first one.
  let max_res = 0;
  let max_href = null;
  for (const link of links) {
    const hrefs = link.match(/href\s?=\s?['"].*?["']/gm);
    const sizes = link.match(/sizes\s?=\s?['"].*?["']/gm);
    if (hrefs == null || hrefs.length !== 1) {
      console.error(`no href defined in icon tag. (${link})`);
      continue;
    }
    if (max_href == null) {
      max_href = hrefs[0];
    }
    if (sizes == null || sizes.length !== 1) {
      continue;
    }
    const size = Number(sizes[0].match(/\d+/)[0]);
    if (size > max_res) {
      max_res = size;
      max_href = hrefs[0];
    }
  }
  // return the relative url to our fallback icon
  if (max_href == null) {
    return "/assets/images/default-favicon.png";
  }

  // extract the url from the href tag
  let favicon_url = max_href.match(/['"].*?['"]/)[0];
  favicon_url = favicon_url.substring(1, favicon_url.length - 1);
  // check for relative urls, and append the website's url to the front
  if (!favicon_url.startsWith("http")) {
    favicon_url = new URL(favicon_url, reqUrl).href;
  }
  return favicon_url;
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
