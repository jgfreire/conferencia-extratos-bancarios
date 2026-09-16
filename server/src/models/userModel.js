"use strict";

const db = require("../db/database");

function count() {
  return db.prepare("SELECT COUNT(*) as total FROM users").get().total;
}

function create({ username, passwordHash }) {
  const result = db
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, passwordHash);
  return Number(result.lastInsertRowid);
}

function findByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username) || null;
}

function listAll() {
  return db.prepare("SELECT id, username, created_at FROM users ORDER BY username ASC").all();
}

module.exports = { count, create, findByUsername, listAll };
