"use strict";

const env = require("./config/env");
const app = require("./app");

app.listen(env.PORT, () => {
  console.log(`Sistema de Conferência de Extratos Bancários rodando em http://localhost:${env.PORT}`);
});
