// Utilitários de arquivo seguros: nome de arquivo sanitizado e junção de caminho que nunca
// escapa do diretório raiz de storage (evita path traversal a partir de nomes de arquivo
// enviados pelo usuário).
"use strict";

const path = require("node:path");

function sanitizeFilename(name) {
  const base = path.basename(String(name || "arquivo"));
  return base.replace(/[^a-zA-Z0-9._\-À-ÿ ]/g, "_").slice(0, 180) || "arquivo";
}

function safeJoin(rootDir, ...segments) {
  const resolvedRoot = path.resolve(rootDir);
  const target = path.resolve(resolvedRoot, ...segments);
  if (!target.startsWith(resolvedRoot)) {
    throw new Error("Caminho de arquivo inválido.");
  }
  return target;
}

module.exports = { sanitizeFilename, safeJoin };
