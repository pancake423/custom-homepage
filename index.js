import express from "express";
import { getSiteInfo, getFavicon } from "./src/parser.js";
import { exec } from "child_process";
import "dotenv/config";
import * as db from "./src/database.js";
import { middleware } from "./src/validate.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

const TOKEN_COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: true,
  maxAge: 34560000000, // 400 days, maximum allowed by Chrome
};

// middleware to ensure that the user is logged in for certain requests
const ensureLoggedIn = (req, res, next) => {
  if (req.cookies.token == null || req.cookies.token == undefined) {
    res.status(401).json({
      message: "Not authenticated.",
    });
    return;
  }
  next();
};

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

app.post(
  "/api/register",
  middleware((v) => {
    v.exists("username").isType("string").isInLength(4, 32);
    v.exists("password").isType("string").isInLength(8, 64);
  }),
  (req, res) => {
    const info = db.register(req.body.username, req.body.password);
    if (info.error == null) {
      res.cookie("token", info.token, TOKEN_COOKIE_OPTS);
    }
    res.status(info.status).json({
      message:
        info.error == null
          ? "account created successfully."
          : "Error: " + info.error,
    });
  },
);

app.post(
  "/api/login",
  middleware((v) => {
    v.exists("username").isType("string");
    v.exists("password").isType("string");
  }),
  (req, res) => {
    const info = db.login(req.body.username, req.body.password);
    if (info.error == null) {
      res.cookie("token", info.token, TOKEN_COOKIE_OPTS);
    }
    res.status(info.status).json({
      message:
        info.error == null ? "logged in successfully." : "Error: " + info.error,
    });
  },
);

app.post("/api/logout", (req, res) => {
  // expire the user's token
  res.cookie("token", "", { maxAge: -1 });
  res.json({ message: "logged out successfully." });
});

app.post(
  "/api/saveData",
  ensureLoggedIn,
  middleware((v) => {
    v.exists("slot").isInt().isInRange(0, 4);
    v.exists("data").isType("string");
  }),
  (req, res) => {
    const token = req.cookies.token;
    const info = db.save(token, req.body.slot, req.body.data);
    // resend token to avoid expiration
    if (info.error == null) {
      res.cookie("token", token, TOKEN_COOKIE_OPTS);
    }
    res.status(info.status).json({
      message:
        info.error == null
          ? "data saved successfully."
          : "Error: " + info.error,
    });
  },
);

app.post(
  "/api/getData",
  ensureLoggedIn,
  middleware((v) => {
    v.exists("slot").isInt().isInRange(0, 4);
  }),
  (req, res) => {
    const token = req.cookies.token;
    const info = db.get(token, req.body.slot, req.body.data);
    // resend token to avoid expiration
    if (info.error == null) {
      res.cookie("token", token, TOKEN_COOKIE_OPTS);
    }
    res.status(info.status).json({
      message:
        info.error == null
          ? "data retrieved successfully."
          : "Error: " + info.error,
      data: info.data,
    });
  },
);

app.post("/api/status", (req, res) => {
  res.json(db.status(req.cookies.token));
});

// safety check that .env is loaded
if (process.env.PORT == undefined) {
  console.error("Error: No .env file present.");
  process.exit(1);
}

app.listen(process.env.PORT, () =>
  console.log(`server listening at http://localhost:${process.env.PORT}`),
);
