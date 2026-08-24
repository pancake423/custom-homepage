// utility functions for working with the database.

import { DatabaseSync } from "node:sqlite";
import * as crypto from "./crypto.js";

const db = new DatabaseSync("database.sql");

try {
  db.exec("SELECT * FROM users LIMIT 1");
} catch {
  initDatabases();
}

function initDatabases() {
  console.log("creating database");
  db.exec(`
    DROP TABLE IF EXISTS users;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL,
      iv TEXT NOT NULL,
      token TEXT NOT NULL,
      token_hash TEXT NOT NULL
    );

    DROP TABLE IF EXISTS saves;
    CREATE TABLE saves (
      id INTEGER PRIMARY KEY,
      slot INTEGER NOT NULL,
      salt TEXT NOT NULL,
      iv INTEGER NOT NULL,
      data TEXT,
      updated_at INTEGER DEFAULT (unixepoch()),
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id)
        REFERENCES users (id)
    )
  `);
}

/**
 * @typedef LoginResponse
 * @property {string|null} error - error message, or null if no error.
 * @property {string|null} token - the user's token, if successful.
 * @property {int} status - HTTP response status code
 */

/**
 * attempt to log in as the given user.
 *
 * @param {string} user- username
 * @param {string} pass- password
 * @returns {LoginResponse}
 */
export function login(user, pass) {
  // get the correct user entry
  const res = db.prepare(`SELECT * from users WHERE username = ?;`).get(user);

  if (res === undefined) {
    return {
      error: "Invalid credentials.",
      token: null,
      status: 401,
    };
  }

  // verify the hash of their salted password
  if (crypto.hash(pass + res.salt) !== res.hash) {
    return {
      error: "Invalid credentials.",
      token: null,
      status: 401,
    };
  }
  // decrypt and return their token
  return {
    error: null,
    token: crypto.decrypt(res.token, pass, res.salt, res.iv),
    status: 200,
  };
}

/**
 * attempt to register the given user.
 *
 * @param {string} user- username
 * @param {string} pass- password
 * @returns {LoginResponse}
 */
export function register(user, pass) {
  // create a new user, and generate their token
  // return the token for the user

  try {
    const stmt = db.prepare(
      `INSERT INTO users (username, salt, hash, iv, token, token_hash) VALUES (?, ?, ?, ?, ?, ?);`,
    );
    const salt = crypto.salt();
    const iv = crypto.iv();
    const token = crypto.token();
    stmt.run(
      user,
      salt,
      crypto.hash(pass + salt),
      iv,
      crypto.encrypt(token, pass, salt, iv),
      crypto.hash(token),
    );

    return {
      error: null,
      token: token,
      status: 201,
    };
  } catch (e) {
    return {
      error: `That username is taken.`,
      token: null,
      status: 422,
    };
  }
}

/**
 * looks up the user ID based on their token.
 * returns null if the token doesn't match or is invalid.
 *
 * @param {string} token
 * @returns {int|null}
 */
function getUserId(token) {
  const res = db
    .prepare(`SELECT id from users WHERE token_hash = ?`)
    .get(crypto.hash(token));

  if (res === undefined) {
    return null;
  }

  return res.id;
}

export function status(token) {
  if (token == undefined || token == null) {
    return {
      username: null,
      loggedIn: false,
      message: "Not logged in.",
      lastUpdated: null,
    };
  }

  const id = getUserId(token);
  if (id === null) {
    return {
      username: null,
      loggedIn: false,
      message: "Not logged in.",
      lastUpdated: null,
    };
  }

  const res = db.prepare(`SELECT username from users WHERE id = ?`).get(id);

  return {
    username: res.username,
    loggedIn: true,
    message: `Logged in as ${res.username}.`,
    lastUpdated: lastUpdated(id),
  };
}

/**
 * @typedef SaveResponse
 * @prop {string|null} error - the error message, or null if no error.
 * @prop {int} status - the HTTP status response code.
 */

/**
 * save the provided contents to the given save slot.
 *
 * @param {string} token - the user's token
 * @param {int} slot - the id of the slot to save to.
 * @param {*} contents - contents to save. must be JSON-encodable
 * @returns {SaveResponse}
 */
export function save(token, slot, contents) {
  // authenticate user based on token
  const id = getUserId(token);
  if (id === null) {
    return {
      error: "Not authenticated.",
      status: 401,
    };
  }

  const res = db
    .prepare(`SELECT * from saves WHERE user_id = ? AND slot = ?`)
    .get(id, slot);

  if (res !== undefined) {
    db.prepare(`DELETE FROM saves WHERE id = ?`).run(res.id);
  }

  const salt = crypto.salt();
  const iv = crypto.iv();

  db.prepare(
    `INSERT INTO saves (slot, salt, iv, data, user_id) VALUES (?, ?, ?, ?, ?)`,
  ).run(
    slot,
    salt,
    iv,
    crypto.encrypt(JSON.stringify(contents), token, salt, iv),
    id,
  );

  return {
    error: null,
    status: 201,
  };
}

/**
 * @typedef GetResponse
 * @prop {string|null} error
 * @prop {*} data
 * @prop {int} status
 */

/**
 * get the contents of the given save slot.
 *
 * @param {string} token - the user's token
 * @param {int} slot - the id of the slot to get.
 * @returns {GetResponse}
 */
export function get(token, slot) {
  // authenticate user based on token
  const id = getUserId(token);
  if (id === null) {
    return {
      error: "Not authenticated.",
      status: 401,
    };
  }

  const res = db
    .prepare(`SELECT * from saves WHERE user_id = ? AND slot = ?`)
    .get(id, slot);

  if (res === undefined) {
    return {
      error: `No save data in slot ${slot}.`,
      status: 404,
      data: null,
    };
  }

  return {
    error: null,
    status: 200,
    data: JSON.parse(crypto.decrypt(res.data, token, res.salt, res.iv)),
  };
}

function lastUpdated(id) {
  const res = db
    .prepare("SELECT updated_at, slot from saves WHERE user_id = ?")
    .all(id)

  const out = {};
  for (const obj of res) {
    out[obj.slot] = obj.updated_at;
  }

  return out;
}
