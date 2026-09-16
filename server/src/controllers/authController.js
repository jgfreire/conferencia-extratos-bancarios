"use strict";

const { hashPassword, verifyPassword } = require("../auth/passwords");
const userModel = require("../models/userModel");

const GENERIC_ERROR = "Usuário ou senha inválidos.";

function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: GENERIC_ERROR });
  }

  const user = userModel.findByUsername(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: GENERIC_ERROR });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: "Falha ao iniciar sessão." });
    req.session.user = { username: user.username };
    res.json({ username: user.username });
  });
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("ce.sid");
    res.json({ ok: true });
  });
}

function me(req, res) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  res.json(req.session.user);
}

// Cadastro de novos usuários: qualquer usuário já logado pode criar outro (sistema interno,
// sem papéis/hierarquia). Exceção: se ainda não existe NENHUM usuário (primeira instalação),
// permite criar o primeiro sem estar autenticado — senão ninguém conseguiria nunca logar.
function register(req, res) {
  const isFirstUser = userModel.count() === 0;
  if (!isFirstUser && (!req.session || !req.session.user)) {
    return res.status(401).json({ error: "Não autenticado." });
  }

  const { username, password } = req.body || {};
  if (!username || typeof username !== "string" || username.trim().length < 3) {
    return res.status(400).json({ error: "Informe um usuário com pelo menos 3 caracteres." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
  }
  const usernameTrimmed = username.trim();
  if (userModel.findByUsername(usernameTrimmed)) {
    return res.status(409).json({ error: "Já existe um usuário com esse nome." });
  }

  userModel.create({ username: usernameTrimmed, passwordHash: hashPassword(password) });
  res.status(201).json({ username: usernameTrimmed });
}

function listUsers(req, res) {
  res.json(userModel.listAll());
}

module.exports = { login, logout, me, register, listUsers };
