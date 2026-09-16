// Normalização de texto para comparação segura: NFD strip-accent -> uppercase -> remove
// pontuação -> colapsa espaços. Usada para nomes de empresa (busca) e para identificar bancos
// em texto livre (bankAliases.js).
"use strict";

function stripAccents(str) {
  return String(str || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizeText(raw) {
  let s = stripAccents(String(raw || "")).toUpperCase();
  s = s.replace(/\bS[.\/]?A\b/g, " SA "); // S/A, S.A., SA -> forma única antes da limpeza de pontuação
  s = s.replace(/[^A-Z0-9\s]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

module.exports = { stripAccents, normalizeText };
