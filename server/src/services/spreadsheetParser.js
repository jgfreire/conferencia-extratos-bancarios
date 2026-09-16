// Leitura da planilha de referência (Código, Nome da Empresa, Banco) via exceljs. Detecta a
// linha de cabeçalho automaticamente (a planilha real do escritório tem um título na linha 1 e
// o cabeçalho de fato na linha 2) e tolera colunas em qualquer ordem, desde que os nomes batam
// com as variações esperadas.
"use strict";

const ExcelJS = require("exceljs");
const { normalizeText } = require("./companyNormalizer");
const { mapSpreadsheetBank } = require("./bankAliases");
const { extractAccountNumber, detectProductType, looksLikeNoAccount } = require("./accountSignals");

const HEADER_ALIASES = {
  codigo: ["CODIGO", "COD"],
  nome: ["EMPRESAS", "EMPRESA", "NOME DA EMPRESA", "NOME"],
  banco: ["BANCO", "BANCOS"]
};

function cellText(cell) {
  if (cell == null || cell.value == null) return "";
  const v = cell.value;
  if (typeof v === "object" && v.richText) return v.richText.map((t) => t.text).join("");
  if (typeof v === "object" && v.text) return String(v.text);
  return String(v).trim();
}

function findHeaderRow(worksheet) {
  const maxScanRows = Math.min(worksheet.rowCount, 20);
  for (let r = 1; r <= maxScanRows; r++) {
    const row = worksheet.getRow(r);
    let codigoCol = null;
    let nomeCol = null;
    let bancoCol = null;
    for (let c = 1; c <= worksheet.columnCount; c++) {
      const norm = normalizeText(cellText(row.getCell(c)));
      if (!norm) continue;
      if (!codigoCol && HEADER_ALIASES.codigo.includes(norm)) codigoCol = c;
      if (!nomeCol && HEADER_ALIASES.nome.includes(norm)) nomeCol = c;
      if (!bancoCol && HEADER_ALIASES.banco.includes(norm)) bancoCol = c;
    }
    if (nomeCol && bancoCol) {
      return { headerRowNumber: r, codigoCol, nomeCol, bancoCol };
    }
  }
  return null;
}

/**
 * @param {Buffer} buffer
 * @returns {{rows: Array, warnings: string[]}}
 */
async function parseSpreadsheet(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("A planilha não contém nenhuma aba.");
  }

  const header = findHeaderRow(worksheet);
  if (!header) {
    throw new Error(
      'Não foi possível localizar as colunas "Empresa" e "Banco" na planilha. Verifique se os cabeçalhos existem (ex.: Código, Nome da Empresa, Banco).'
    );
  }

  const rows = [];
  const warnings = [];
  let rowOrder = 0;
  // Algumas linhas da planilha real só têm "APLICAÇÃO <número>" sem repetir o nome do banco,
  // contando com a linha anterior da MESMA empresa para dar o contexto (ex.: "SANTANDER
  // 130030277" seguido de "APLICAÇÃO 130030277"). Guarda o último banco reconhecido por
  // código de empresa para herdar nesses casos — só afeta a exibição, nunca decide se a linha
  // tem conta ou não.
  const lastBankByCodigo = new Map();

  for (let r = header.headerRowNumber + 1; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const nomeRaw = cellText(row.getCell(header.nomeCol));
    if (!nomeRaw) continue; // linha sem nome de empresa -> ignora (ex.: linha totalmente em branco)

    const codigoRaw = header.codigoCol ? cellText(row.getCell(header.codigoCol)) : "";
    const bancoRaw = cellText(row.getCell(header.bancoCol));

    const nomeNormalized = normalizeText(nomeRaw);

    let bancoCanonical = mapSpreadsheetBank(bancoRaw);
    const accountNumber = extractAccountNumber(bancoRaw);
    const productType = detectProductType(bancoRaw);
    // Only "não tem conta bancária" (ou variações) e célula vazia tiram a linha da lista —
    // nunca o fato do banco não ser reconhecido. Uma linha com banco não identificado ainda é
    // um documento que o escritório espera receber; escondê-la seria pior do que mostrá-la com
    // o texto cru do banco (spec: nunca esconder, só sinalizar para revisão).
    const semConta = looksLikeNoAccount(bancoRaw);

    const chaveCodigo = codigoRaw || nomeNormalized;
    if (bancoCanonical) {
      lastBankByCodigo.set(chaveCodigo, bancoCanonical);
    } else if (!semConta && lastBankByCodigo.has(chaveCodigo)) {
      bancoCanonical = lastBankByCodigo.get(chaveCodigo);
    }

    if (!bancoCanonical && !semConta) {
      warnings.push(
        `Linha ${r}: banco "${bancoRaw}" não reconhecido na tabela de bancos — confira manualmente (empresa "${nomeRaw}").`
      );
    }

    rowOrder += 1;
    rows.push({
      rowOrder,
      codigo: codigoRaw || String(rowOrder),
      nomeRaw,
      nomeNormalized,
      bancoRaw,
      bancoCanonical,
      productType,
      accountNumber,
      hasAccount: !semConta
    });
  }

  if (rows.length === 0) {
    throw new Error("A planilha não contém nenhuma linha de dados válida.");
  }

  return { rows, warnings };
}

module.exports = { parseSpreadsheet };
