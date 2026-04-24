import express from "express";
import { getSiteInfo, getFavicon } from "./src/parser.js";
import { exec } from "child_process";
import "dotenv/config";
import * as db from "./src/database.js";

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
  exec("git rev-parse HEAD", (_, stdout) => {
    res.json({
      hash: stdout.trim(),
      env: process.env.ENV,
    });
  });
});

// safety check that .env is loaded
if (process.env.PORT == undefined) {
  console.error("Error: No .env file present.");
  process.exit(1);
}

app.listen(process.env.PORT, () =>
  console.log(`server listening at http://localhost:${process.env.PORT}`),
);
