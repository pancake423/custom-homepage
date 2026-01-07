import express from "express";
import { getSiteInfo } from "./src/parser.js";
import { PORT } from "./src/env.js";

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

app.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`),
);
