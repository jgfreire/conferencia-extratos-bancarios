// Entrega de documentos: o sistema NÃO analisa o conteúdo do PDF — só registra que um
// arquivo foi anexado à linha da planilha escolhida pelo usuário, e mantém o arquivo
// armazenado permanentemente.
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const sheetRowModel = require("../models/sheetRowModel");
const { sanitizeFilename, safeJoin } = require("../utils/fsSafe");
const { findBankByCode } = require("../services/bankAliases");

const STORAGE_ROOT = process.env.STORAGE_DIR || path.join(__dirname, "..", "..", "storage");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function bankLabel(row) {
  return row.bancoCanonical ? findBankByCode(row.bancoCanonical)?.canonical || row.bancoRaw : row.bancoRaw;
}

function deliver(req, res) {
  const sheetRow = sheetRowModel.findById(Number(req.params.id));
  if (!sheetRow) return res.status(404).json({ error: "Linha da planilha não encontrada." });
  if (!req.file) return res.status(400).json({ error: "Envie um arquivo (campo 'file')." });

  const dir = safeJoin(STORAGE_ROOT, "documentos");
  ensureDir(dir);
  const storedName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${sanitizeFilename(req.file.originalname)}`;
  const storedPath = safeJoin(dir, storedName);
  fs.writeFileSync(storedPath, req.file.buffer);

  sheetRowModel.markDelivered(sheetRow.id, {
    filename: req.file.originalname,
    storedPath,
    fileSize: req.file.size,
    by: req.session.user.username
  });

  res.status(201).json(sheetRowModel.findById(sheetRow.id));
}

function undo(req, res) {
  const sheetRow = sheetRowModel.findById(Number(req.params.id));
  if (!sheetRow) return res.status(404).json({ error: "Linha da planilha não encontrada." });
  sheetRowModel.undoDelivery(sheetRow.id);
  res.json(sheetRowModel.findById(sheetRow.id));
}

function getFile(req, res) {
  const sheetRow = sheetRowModel.findById(Number(req.params.id));
  if (!sheetRow || !sheetRow.deliveredStoredPath) {
    return res.status(404).json({ error: "Nenhum arquivo entregue para esta linha." });
  }
  if (!fs.existsSync(sheetRow.deliveredStoredPath)) {
    return res.status(404).json({ error: "Arquivo não encontrado no armazenamento." });
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${sheetRow.deliveredFilename}"`);
  fs.createReadStream(sheetRow.deliveredStoredPath).pipe(res);
}

function listDelivered(req, res) {
  const rows = sheetRowModel.listDelivered();
  res.json(
    rows.map((r) => ({
      sheetRowId: r.id,
      codigo: r.codigo,
      empresa: r.nomeRaw,
      banco: bankLabel(r),
      produto: r.productType,
      arquivo: r.deliveredFilename,
      entreguePor: r.deliveredBy,
      entregueEm: r.deliveredAt
    }))
  );
}

// Virada do mês: apaga todos os extratos entregues (arquivos + vínculo), mas nunca a lista de
// referência (empresas/bancos/produtos continuam cadastrados, só voltam a ficar "pendente").
function clearAll(req, res) {
  const paths = sheetRowModel.clearAllDeliveries();
  let removed = 0;
  for (const p of paths) {
    try {
      fs.unlinkSync(p);
      removed += 1;
    } catch {
      // arquivo já não existia — segue em frente, o vínculo no banco já foi removido de qualquer forma
    }
  }
  res.json({ extratosRemovidos: paths.length, arquivosApagados: removed });
}

module.exports = { deliver, undo, getFile, listDelivered, clearAll };
