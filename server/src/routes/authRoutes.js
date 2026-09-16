"use strict";

const express = require("express");
const authController = require("../controllers/authController");
const { requireAuthApi } = require("../auth/middleware");

const router = express.Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuthApi, authController.me);
// register não usa requireAuthApi globalmente: precisa permitir o primeiro usuário do sistema
// sem sessão — a checagem (usuário já logado OU nenhum usuário existe ainda) fica no controller.
router.post("/register", authController.register);
router.get("/users", requireAuthApi, authController.listUsers);

module.exports = router;
