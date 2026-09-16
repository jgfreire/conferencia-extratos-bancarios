// Importação da planilha de referência (substitui a lista inteira — ver sheetRowModel.replaceAll).
// Sem página própria por enquanto (não fazia parte do pedido); acessível via API para quando o
// escritório precisar atualizar a lista (nova planilha do mês, novos clientes etc.).
"use strict";

const { parseSpreadsheet } = require("../services/spreadsheetParser");
const sheetRowModel = require("../models/sheetRowModel");

async function importReference(req, res) {
  if (!req.file) return res.status(400).json({ error: "Envie a planilha (campo 'spreadsheet')." });
  try {
    const { rows, warnings } = await parseSpreadsheet(req.file.buffer);
    sheetRowModel.replaceAll(rows);
    res.json({ totalLinhas: rows.length, warnings });
  } catch (err) {
    res.status(400).json({ error: err.message || "Falha ao importar a planilha." });
  }
}

module.exports = { importReference };
