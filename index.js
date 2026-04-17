import express from "express";
import { getSiteInfo, getFavicon } from "./src/parser.js";
import { PORT } from "./src/env.js";
import { exec } from "child_process";

const app = express();

app.use(express.static("public"));
app.use(express.json());

app.post("/api/generateLink", async (req, res) => {
  const info = await getSiteInfo(req.body.url);
  if (info.error === null) {
    res.json(info);
  } else {
    res.status(404).json(info);
  }
});

app.post("/api/getFavicon", async (req, res) => {
  const favicon = await getFavicon(req.body.url);
  res.json({ url: req.body.url, thumbnail: favicon, title: req.body.url });
});

app.get("/api/currentHash", async (req, res) => {
  exec("git rev-parse HEAD", (err, stdout, stderr) => {
    res.json({ hash: stdout.trim() });
  });
});

app.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`),
);
