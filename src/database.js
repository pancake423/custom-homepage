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
      token TEXT NOT NULL
    );

    DROP TABLE IF EXISTS saves;
    CREATE TABLE saves (
      id INTEGER PRIMARY KEY,
      slot INTEGER NOT NULL,
      salt TEXT NOT NULL,
      iv INTEGER NOT NULL,
      data TEXT,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id)
        REFERENCES users (id)
    )
  `);
}

export function login(user, pass) {
  // get the correct user entry
  const res = db.prepare(`SELECT * from users WHERE username = ?;`).get(user);

  // decrypt and return their token
  return [res.id, crypto.decrypt(res.token, pass, res.salt, res.iv)];
}

export function register(user, pass) {
  // create a new user, and generate their token
  // return the token for the user

  const stmt = db.prepare(
    `INSERT INTO users (username, salt, hash, iv, token) VALUES (?, ?, ?, ?, ?);`,
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
  );

  const [id, _] = login(user, pass);

  // a stupid fix to a stupid problem: fill all the slots with empty data to avoid
  // the possibility of someone overwriting other people's empty save slots and locking them out.

  for (let i = 0; i < 5; i++) {
    save(id, token, i, {});
  }

  return (id, token);
}

export function save(id, token, slot, contents) {
  const res = db
    .prepare(`SELECT * from saves WHERE user_id = ? AND slot = ?`)
    .get(id, slot);

  if (res !== undefined) {
    if (!validateOwnership(id, token, slot)) {
      return false;
    }
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

  return true;
}

function validateOwnership(id, token, slot) {
  return typeof get(id, token, slot) == "object";
}

export function get(id, token, slot) {
  const res = db
    .prepare(`SELECT * from saves WHERE user_id = ? AND slot = ?`)
    .get(id, slot);

  return JSON.parse(crypto.decrypt(res.data, token, res.salt, res.iv));
}
