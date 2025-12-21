import express from "express";
import { curly } from "node-libcurl";
import { parseFaviconURL, parseTitle } from "./src/parser.js";

const PORT = 51432;
const app = express();

app.use(express.static("public"));
app.use(express.json());

app.post("/api/generateLink", async (req, res) => {
  const { data } = await curly.get(req.body.url, { followLocation: 1 });
  const rep = await curly.get(parseFaviconURL(data, req.body.url));
  const headers = rep.headers[0];
  const base64url =
    "data:" +
    headers["content-type"] +
    ";base64," +
    rep.data.toString("base64");

  res.send({
    thumbnail: base64url,
    title: parseTitle(data),
    url: req.body.url,
  });
});

app.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`),
);
