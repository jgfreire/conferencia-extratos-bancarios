"use strict";

const sheetRowModel = require("../models/sheetRowModel");
const { findBankByCode } = require("../services/bankAliases");

function bankLabel(row) {
  return row.bancoCanonical ? findBankByCode(row.bancoCanonical)?.canonical || row.bancoRaw : row.bancoRaw;
}

function search(req, res) {
  const q = String(req.query.q || "").trim();
  if (q.length < 2) return res.json([]);
  const results = sheetRowModel.searchCompanies(q);
  res.json(results);
}

function getRowsForCompany(req, res) {
  const codigo = req.params.codigo;
  const rows = sheetRowModel.findByCodigo(codigo);
  if (rows.length === 0) return res.status(404).json({ error: "Empresa não encontrada na lista." });
  res.json({
    codigo,
    nomeRaw: rows[0].nomeRaw,
    documentos: rows.map((r) => ({
      sheetRowId: r.id,
      banco: bankLabel(r),
      produto: r.productType,
      semContaBancaria: !r.hasAccount,
      entregue: r.delivered,
      arquivo: r.deliveredFilename,
      entreguePor: r.deliveredBy,
      entregueEm: r.deliveredAt
    }))
  });
}

module.exports = { search, getRowsForCompany };
