// requireAuthApi/requireAuthPage: a sessão vem sempre de req.session.user (definida pelo
// backend no login). Login único de escritório — sem papéis/níveis de acesso.
"use strict";

function requireAuthApi(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  next();
}

function requireAuthPage(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect("/login");
  }
  next();
}

module.exports = { requireAuthApi, requireAuthPage };
