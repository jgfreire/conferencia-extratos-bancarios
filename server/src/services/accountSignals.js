// Sinais extraídos do texto livre da célula "Banco" da planilha de referência: número de
// conta, tipo de produto (conta corrente/aplicação/informe de rendimentos/etc.) e se a linha
// tem conta bancária de fato — usados por spreadsheetParser.js ao importar a planilha.
"use strict";

const { normalizeText } = require("./companyNormalizer");

// Só reconhece o formato "dígitos-dígito(s) verificador" (ex.: "67097-6", "111-1") — o
// hífen é o que distingue de forma segura um número de conta de uma data (usa "/") ou de um
// valor monetário (usa "," ou "."). Sem essa exigência, datas como "04/08/2026" ou valores como
// "2.700,00" apareceriam nos PDFs e seriam confundidos com números de conta.
function extractAccountNumber(rawText) {
  const matches = String(rawText || "").match(/\d{2,}-\d{1,2}\b/g);
  if (!matches || matches.length === 0) return null;
  let best = null;
  for (const m of matches) {
    const digits = m.replace(/[^\d]/g, "");
    if (!best || digits.length > best.length) best = digits;
  }
  return best;
}

// `normalizeText` sempre devolve MAIÚSCULAS — todos os regex levam a flag "i".
const PRODUCT_TYPE_RULES = [
  { type: "INFORME_RENDIMENTOS", pattern: /\binforme de rendimentos\b/i },
  { type: "INFORME_CONTA_CAPITAL", pattern: /\binforme conta capital\b/i },
  { type: "TITULO_CAPITAL", pattern: /\btitulo de capital\b/i },
  {
    // "aplica" cobre tanto o singular ("aplicação" -> "APLICACAO") quanto o plural
    // ("aplicações" -> "APLICACOES") e a forma abreviada ("aplic.") — um erro de digitação
    // anterior ("aplicaco") só batia com a forma plural, deixando "APLICAÇÃO ITAU 67097-6"
    // (uma linha real da planilha do escritório) cair incorretamente em CONTA_CORRENTE.
    type: "APLICACAO_INVESTIMENTO",
    pattern: /\b(aplica|poup\b|poupanca|investimento|invest\b|cdb|rdc|sicredinvest)/i
  }
];

function detectProductType(rawText) {
  const norm = normalizeText(rawText);
  for (const rule of PRODUCT_TYPE_RULES) {
    if (rule.pattern.test(norm)) return rule.type;
  }
  return "CONTA_CORRENTE";
}

// Frases que indicam explicitamente ausência de conta bancária cadastrada.
const NO_ACCOUNT_PATTERNS = [/\bnao tem conta bancaria\b/i, /\bsem conta bancaria\b/i];

function looksLikeNoAccount(rawText) {
  const norm = normalizeText(rawText);
  if (!norm) return true; // célula vazia -> sem conta
  return NO_ACCOUNT_PATTERNS.some((re) => re.test(norm));
}

module.exports = { extractAccountNumber, detectProductType, looksLikeNoAccount };
