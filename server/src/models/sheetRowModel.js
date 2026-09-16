// Lista de referência (persistente, não "por conferência"): uma linha por documento esperado.
// Importar uma planilha nova substitui esta lista inteira (replaceAll).
"use strict";

const db = require("../db/database");
const { normalizeText } = require("../services/companyNormalizer");

function mapRow(row) {
  return {
    id: row.id,
    rowOrder: row.row_order,
    codigo: row.codigo,
    nomeRaw: row.nome_raw,
    nomeNormalized: row.nome_normalized,
    bancoRaw: row.banco_raw,
    bancoCanonical: row.banco_canonical,
    productType: row.product_type,
    accountNumber: row.account_number,
    hasAccount: !!row.has_account,
    delivered: !!row.delivered_at,
    deliveredFilename: row.delivered_filename,
    deliveredStoredPath: row.delivered_stored_path,
    deliveredFileSize: row.delivered_file_size,
    deliveredBy: row.delivered_by,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at
  };
}

// Substitui a lista de referência inteira pela nova planilha importada. Entregas já feitas
// para uma linha idêntica (mesmo código+banco) são preservadas por reassociação simples —
// caso contrário, reimportar a planilha apagaria o histórico de entregas a cada atualização.
function replaceAll(rows) {
  const existing = db.prepare("SELECT codigo, banco_raw, delivered_filename, delivered_stored_path, delivered_file_size, delivered_by, delivered_at FROM sheet_rows").all();
  const deliveredByKey = new Map();
  for (const r of existing) {
    if (r.delivered_at) deliveredByKey.set(`${r.codigo}|||${r.banco_raw}`, r);
  }

  db.exec("DELETE FROM sheet_rows");

  const stmt = db.prepare(`
    INSERT INTO sheet_rows (
      row_order, codigo, nome_raw, nome_normalized, banco_raw, banco_canonical, product_type,
      account_number, has_account, delivered_filename, delivered_stored_path,
      delivered_file_size, delivered_by, delivered_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of rows) {
    const prevDelivery = deliveredByKey.get(`${r.codigo}|||${r.bancoRaw}`);
    stmt.run(
      r.rowOrder,
      r.codigo,
      r.nomeRaw,
      r.nomeNormalized,
      r.bancoRaw,
      r.bancoCanonical,
      r.productType,
      r.accountNumber,
      r.hasAccount ? 1 : 0,
      prevDelivery ? prevDelivery.delivered_filename : null,
      prevDelivery ? prevDelivery.delivered_stored_path : null,
      prevDelivery ? prevDelivery.delivered_file_size : null,
      prevDelivery ? prevDelivery.delivered_by : null,
      prevDelivery ? prevDelivery.delivered_at : null
    );
  }
}

function listAll() {
  return db.prepare("SELECT * FROM sheet_rows ORDER BY row_order ASC").all().map(mapRow);
}

function findById(id) {
  const row = db.prepare("SELECT * FROM sheet_rows WHERE id = ?").get(id);
  return row ? mapRow(row) : null;
}

function findByCodigo(codigo) {
  return db.prepare("SELECT * FROM sheet_rows WHERE codigo = ? ORDER BY row_order ASC").all(codigo).map(mapRow);
}

// Escapa os curingas do LIKE (% e _) para que um código ou nome que por acaso os contenha
// não vire um padrão de busca diferente do que a pessoa digitou.
function escapeLike(str) {
  return str.replace(/[\\%_]/g, "\\$&");
}

// Busca "por iniciais" (tipo autocomplete): bate se o começo do nome, OU o começo de
// qualquer palavra do nome, OU o começo do código, começar com o texto digitado — nunca uma
// palavra no meio (ex.: "jo" sugere "JOÃO GABRIEL"/"JOÃO PEDRO", mas não "ANJO COMÉRCIO").
function searchCompanies(query) {
  const norm = normalizeText(query);
  if (!norm) return [];
  const likeNorm = escapeLike(norm);
  const codigoQuery = escapeLike(String(query).trim());
  const rows = db
    .prepare(
      `SELECT * FROM sheet_rows
       WHERE nome_normalized LIKE ? ESCAPE '\\'
          OR nome_normalized LIKE ? ESCAPE '\\'
          OR codigo LIKE ? ESCAPE '\\'
       ORDER BY nome_raw ASC`
    )
    .all(`${likeNorm}%`, `% ${likeNorm}%`, `${codigoQuery}%`);
  const byCodigo = new Map();
  for (const r of rows) {
    if (!byCodigo.has(r.codigo)) {
      byCodigo.set(r.codigo, { codigo: r.codigo, nomeRaw: r.nome_raw, total: 0, entregues: 0 });
    }
    const entry = byCodigo.get(r.codigo);
    entry.total += 1;
    if (r.delivered_at) entry.entregues += 1;
  }
  return [...byCodigo.values()];
}

function listDelivered() {
  return db
    .prepare("SELECT * FROM sheet_rows WHERE delivered_at IS NOT NULL ORDER BY delivered_at DESC")
    .all()
    .map(mapRow);
}

function markDelivered(id, { filename, storedPath, fileSize, by }) {
  db.prepare(
    `UPDATE sheet_rows SET
      delivered_filename = ?, delivered_stored_path = ?, delivered_file_size = ?,
      delivered_by = ?, delivered_at = datetime('now')
     WHERE id = ?`
  ).run(filename, storedPath, fileSize, by, id);
}

function undoDelivery(id) {
  db.prepare(
    `UPDATE sheet_rows SET
      delivered_filename = NULL, delivered_stored_path = NULL, delivered_file_size = NULL,
      delivered_by = NULL, delivered_at = NULL
     WHERE id = ?`
  ).run(id);
}

// Usado na virada do mês: apaga TODAS as entregas (nunca a lista de referência/empresas em si).
// Devolve os caminhos dos arquivos apagados para o controller remover do disco.
function clearAllDeliveries() {
  const paths = db
    .prepare("SELECT delivered_stored_path FROM sheet_rows WHERE delivered_stored_path IS NOT NULL")
    .all()
    .map((r) => r.delivered_stored_path);
  db.exec(
    `UPDATE sheet_rows SET
      delivered_filename = NULL, delivered_stored_path = NULL, delivered_file_size = NULL,
      delivered_by = NULL, delivered_at = NULL`
  );
  return paths;
}

module.exports = {
  replaceAll,
  listAll,
  findById,
  findByCodigo,
  searchCompanies,
  listDelivered,
  markDelivered,
  undoDelivery,
  clearAllDeliveries
};
