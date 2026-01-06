import express from "express";
import { curly } from "node-libcurl";
import { parseFaviconURL, parseTitle } from "./src/parser.js";
import { PORT } from "./src/env.js";

const app = express();

app.use(express.static("public"));
app.use(express.json());

app.post("/api/generateLink", async (req, res) => {
  const { statusCode, data } = await curly.get(req.body.url, {
    followLocation: 1,
    userAgent: req.get("user-agent"), // pass on the client's user agent.
  });
  // we want 404 or 500 error codes to cause the website to fail
  if (statusCode >= 404) {
    res.status(404).send({ message: "Not Found", status: statusCode });
    return;
  }
  const rep = await curly.get(parseFaviconURL(req.body.url), {
    followLocation: 1,
  });
  const headers = rep.headers[rep.headers.length - 1];
  const base64url =
    "data:" +
    headers["content-type"] +
    ";base64," +
    rep.data.toString("base64");

  res.send({
    thumbnail: base64url,
    title: parseTitle(data) || req.body.url,
    url: req.body.url,
  });
});

app.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`),
);
