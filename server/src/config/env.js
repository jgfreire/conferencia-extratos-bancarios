// Carrega e valida as variáveis de ambiente. Nunca expõe estes valores ao frontend —
// só este processo (backend) os lê.
"use strict";

const path = require("node:path");
const crypto = require("node:crypto");

try {
  process.loadEnvFile(path.join(__dirname, "..", "..", ".env"));
} catch {
  // .env ainda não existe (ex.: primeira execução) — segue com as variáveis já presentes
  // no ambiente, se houver.
}

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = parseInt(process.env.PORT || "4100", 10);

// Se SESSION_SECRET não estiver definido, gera um valor aleatório por processo — funciona,
// mas invalida sessões a cada reinício do servidor. Recomenda-se definir um valor fixo em
// produção (server/.env) para não deslogar todo mundo a cada restart.
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.SESSION_SECRET) {
  console.warn(
    "[configuração] SESSION_SECRET não definido — gerando um valor temporário. Defina SESSION_SECRET em server/.env para manter sessões entre reinícios do servidor."
  );
}

const SESSION_MAX_AGE_MINUTES = parseInt(process.env.SESSION_MAX_AGE_MINUTES || "60", 10);

module.exports = {
  NODE_ENV,
  PORT,
  SESSION_SECRET,
  SESSION_MAX_AGE_MINUTES
};
