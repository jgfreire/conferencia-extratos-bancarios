// Tabela de bancos/fintechs canônicos e identificação de banco a partir de texto livre.
// Roda tanto sobre o texto do PDF quanto sobre a célula "Banco" da planilha (mapSpreadsheetBank),
// para que "Itaú" na planilha combine com "Itaú Unibanco S.A." encontrado no PDF.
"use strict";

const { normalizeText } = require("./companyNormalizer");

// `compe` é só um sinal auxiliar (nunca decisivo sozinho, pois um número de 3 dígitos pode
// coincidir com número de conta/agência). Lista cobre os bancos/fintechs vistos na planilha
// real do escritório, mais alguns bancos regionais comuns para clientes futuros.
// IMPORTANTE: `normalizeText` (companyNormalizer.js) sempre devolve texto em MAIÚSCULAS sem
// acentos — todos os regex abaixo levam a flag "i" para não depender de escrever tudo em
// caixa alta manualmente, e nunca usam acentos (já removidos pela normalização).
const CANONICAL_BANKS = [
  { code: "BB", canonical: "Banco do Brasil", compe: "001", names: [/\bbanco do brasil\b/i, /\bbanco brasil\b/i, /\bbco brasil\b/i] },
  { code: "ITAU", canonical: "Itaú Unibanco", compe: "341", names: [/\bitau unibanco\b/i, /\bitau\b/i] },
  { code: "BRADESCO", canonical: "Bradesco", compe: "237", names: [/\bbradesco\b/i] },
  { code: "SANTANDER", canonical: "Santander", compe: "033", names: [/\bsantander\b/i] },
  { code: "CAIXA", canonical: "Caixa Econômica Federal", compe: "104", names: [/\bc\s*e\s*f\b/i, /\bcaixa economica federal\b/i, /\bcaixa\b/i] },
  { code: "SICOOB", canonical: "Sicoob", compe: "756", names: [/\bsicoob\b/i, /\bsiccob\b/i] },
  // Sem \b no final: "SICREDINVEST" (nome de produto de investimento real da planilha do
  // escritório, ex. "APLICAÇÃO SICREDINVEST") gruda "SICREDI" direto no resto da palavra, então
  // exigir borda de palavra depois de "sicred" deixava de reconhecer o banco nessas linhas.
  { code: "SICREDI", canonical: "Sicredi", compe: "748", names: [/\bsicred/i] },
  { code: "INTER", canonical: "Banco Inter", compe: "077", names: [/\bbanco inter\b/i, /(?<!c6 )\binter\b/i] },
  { code: "NUBANK", canonical: "Nubank", compe: "260", names: [/\bnu\s?bank\b/i, /\bnubank\b/i] },
  { code: "BTG", canonical: "BTG Pactual", compe: "208", names: [/\bbtg pactual\b/i, /\bbtg\b/i] },
  { code: "SAFRA", canonical: "Banco Safra", compe: "422", names: [/\bbanco safra\b/i, /\bsafra\b/i] },
  { code: "C6", canonical: "C6 Bank", compe: "336", names: [/\bc6 bank\b/i, /\bbanco c6\b/i, /\bc6\b/i] },
  { code: "MERCADOPAGO", canonical: "Mercado Pago", compe: "323", names: [/\bmercado pago\b/i] },
  { code: "PAGBANK", canonical: "PagBank / PagSeguro", compe: "290", names: [/\bpag\s?bank\b/i, /\bpagseguro\b/i] },
  { code: "STONE", canonical: "Stone", compe: "197", names: [/\bstone\b/i] },
  { code: "CORA", canonical: "Cora", compe: "403", names: [/\bcora\b/i] },
  { code: "INFINITEPAY", canonical: "Infinite Pay", compe: null, names: [/\binfinite ?pay\b/i] },
  { code: "OMIECASH", canonical: "Omie Cash", compe: null, names: [/\bomie ?cash\b/i] },
  { code: "BANRISUL", canonical: "Banrisul", compe: "041", names: [/\bbanrisul\b/i] },
  { code: "ORIGINAL", canonical: "Banco Original", compe: "212", names: [/\bbanco original\b/i] },
  { code: "BV", canonical: "Banco BV", compe: "655", names: [/\bbanco bv\b/i, /\bvotorantim\b/i] },
  { code: "PICPAY", canonical: "PicPay", compe: "380", names: [/\bpicpay\b/i] },
  { code: "CRESOL", canonical: "Cresol", compe: "133", names: [/\bcresol\b/i] },
  { code: "UNICRED", canonical: "Unicred", compe: "136", names: [/\bunicred\b/i] },
  { code: "DAYCOVAL", canonical: "Banco Daycoval", compe: "707", names: [/\bdaycoval\b/i] },
  { code: "ABCBRASIL", canonical: "Banco ABC Brasil", compe: "246", names: [/\babc brasil\b/i] },
  { code: "BANESE", canonical: "Banese", compe: "047", names: [/\bbanese\b/i] },
  { code: "BRB", canonical: "BRB - Banco de Brasília", compe: "070", names: [/\bbrb\b/i, /\bbanco de brasilia\b/i] }
];

function findAllMatches(normalized) {
  return CANONICAL_BANKS.filter((b) => b.names.some((re) => re.test(normalized)));
}

function identifyBank(rawOrNormalizedText) {
  const norm = normalizeText(rawOrNormalizedText);
  if (!norm) return { status: "NONE" };
  const matches = findAllMatches(norm);
  if (matches.length === 0) return { status: "NONE" };
  if (matches.length === 1) return { status: "CONFIRMED", bank: matches[0] };
  // Mais de um alias bateu (ex.: documento cita um banco de destino numa linha de TED) — sem
  // heurística de posição confiável o suficiente para decidir sozinho, trata como ambíguo.
  return { status: "AMBIGUOUS", candidates: matches };
}

// Usado ao importar a planilha: mapeia o texto livre da coluna "Banco" para o código canônico,
// ou para um bucket "RAW:<normalizado>" quando não reconhecido (permite comparação literal e
// sinaliza ao escritório que a grafia pode precisar de correção/nova entrada na tabela).
function mapSpreadsheetBank(freeText) {
  const result = identifyBank(freeText);
  if (result.status === "CONFIRMED") return result.bank.code;
  return null;
}

function findBankByCode(code) {
  return CANONICAL_BANKS.find((b) => b.code === code) || null;
}

module.exports = { CANONICAL_BANKS, identifyBank, mapSpreadsheetBank, findBankByCode };
