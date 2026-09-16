// Banco de dados SQLite (módulo nativo do Node — sem dependência externa). 100% separado de
// qualquer outro sistema do escritório: próprio arquivo, próprio diretório de storage.
"use strict";

const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");

const dataDir = process.env.DATA_DIR || path.join(__dirname, "..", "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, "app.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Lista de referência: uma linha por documento esperado (empresa + banco + produto).
  -- Persistente (não é "por conferência") — importar uma planilha nova substitui esta lista.
  CREATE TABLE IF NOT EXISTS sheet_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    row_order INTEGER NOT NULL,
    codigo TEXT NOT NULL,
    nome_raw TEXT NOT NULL,
    nome_normalized TEXT NOT NULL,
    banco_raw TEXT NOT NULL,
    banco_canonical TEXT,
    product_type TEXT NOT NULL DEFAULT 'CONTA_CORRENTE' CHECK(product_type IN (
      'CONTA_CORRENTE','APLICACAO_INVESTIMENTO','INFORME_RENDIMENTOS',
      'INFORME_CONTA_CAPITAL','TITULO_CAPITAL','OUTRO'
    )),
    account_number TEXT,
    has_account INTEGER NOT NULL DEFAULT 1,
    delivered_filename TEXT,
    delivered_stored_path TEXT,
    delivered_file_size INTEGER,
    delivered_by TEXT,
    delivered_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_sheet_rows_codigo ON sheet_rows(codigo);
  CREATE INDEX IF NOT EXISTS idx_sheet_rows_nome_normalized ON sheet_rows(nome_normalized);

  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);

module.exports = db;
