// multer em memória: os arquivos são gravados no storage definitivo pelos controllers, que
// decidem o caminho final.
"use strict";

const multer = require("multer");

const MAX_FILE_SIZE_MB = 25;

// Erros de validação de upload são problema de quem enviou o arquivo (400), nunca uma falha
// do servidor (500) — sem o `status` aqui, o middleware de erro genérico do app.js cairia no
// default 500.
function rejection(message) {
  return Object.assign(new Error(message), { status: 400 });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.fieldname === "spreadsheet") {
      const ok = /\.(xlsx|xlsm)$/i.test(file.originalname);
      return cb(ok ? null : rejection("A planilha deve ser um arquivo .xlsx."), ok);
    }
    if (file.fieldname === "file") {
      const ok = /\.pdf$/i.test(file.originalname) || file.mimetype === "application/pdf";
      return cb(ok ? null : rejection("O documento deve ser um arquivo PDF."), ok);
    }
    cb(rejection("Campo de upload inesperado."), false);
  }
});

module.exports = upload;
