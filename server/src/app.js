"use strict";

const path = require("node:path");
const express = require("express");
const session = require("express-session");
const multer = require("multer");

const env = require("./config/env");
const SqliteSessionStore = require("./auth/sqliteSessionStore");
const { requireAuthApi } = require("./auth/middleware");

const pageRoutes = require("./routes/pageRoutes");
const authRoutes = require("./routes/authRoutes");
const companyRoutes = require("./routes/companyRoutes");

const app = express();

app.disable("x-powered-by");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    name: "ce.sid",
    secret: env.SESSION_SECRET,
    store: new SqliteSessionStore(),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: env.SESSION_MAX_AGE_MINUTES * 60 * 1000
    }
  })
);

// Assets estáticos (css/js) não exigem sessão — só as páginas HTML (login.html/index.html)
// exigem, via pageRoutes, para que não sejam acessíveis diretamente pela URL sem login.
app.use("/css", express.static(path.join(__dirname, "..", "..", "css")));
app.use("/js", express.static(path.join(__dirname, "..", "..", "js")));

app.use("/", pageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", requireAuthApi, companyRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[erro]", err);
  // Erros do multer (arquivo grande demais, campo inesperado etc.) são sempre problema de
  // quem enviou o arquivo, não uma falha do servidor.
  const status = err instanceof multer.MulterError ? 400 : err.status || 500;
  res.status(status).json({ error: err.message || "Erro interno." });
});

module.exports = app;
