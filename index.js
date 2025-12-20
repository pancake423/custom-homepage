import express from "express";
import { curly } from "node-libcurl";

const PORT = 51432;
const app = express();

app.use(express.static("public"));
app.use(express.json());

app.post("/api/generateLink", async (req, res) => {
  const { data } = await curly.get(req.body.url, { followLocation: 1 });
  const links = String(data)
    .match(/<link.*?>/gms)
    .filter((v) => v.match(/rel\s?=\s?['"]icon["']/gm));

  // choose the highest resolution, if specified.
  // if not, choose the first one.
  let max_res = 0;
  let max_href = null;
  let max_id = 0;
  for (const link of links) {
    const href = link.match(/href\s?=\s?['"].*?["']/gm);
    const sizes = link.match(/sizes\s?=\s?['"].*?["']/gm);
    if (href.length !== 1)
      throw new Error(`no href defined in icon tag. (${link})`);
  }
});

app.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`),
);
