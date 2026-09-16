"use strict";

const express = require("express");
const path = require("node:path");
const { requireAuthPage } = require("../auth/middleware");

const router = express.Router();
const ROOT = path.join(__dirname, "..", "..", "..");

router.get("/login", (req, res) => {
  if (req.session && req.session.user) return res.redirect("/");
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(ROOT, "login.html"));
});

router.get(["/", "/index.html"], requireAuthPage, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.sendFile(path.join(ROOT, "index.html"));
});

module.exports = router;
