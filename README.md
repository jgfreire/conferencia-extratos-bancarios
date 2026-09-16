# Sistema de Conferência de Extratos Bancários

Confere extratos bancários em PDF contra uma planilha de referência (Código, Nome da Empresa,
Banco), usando **nome da empresa + banco** como critério principal. Sistema 100% separado dos
outros sistemas do escritório (própria base de dados, próprio armazenamento, próprio login).

## Primeira configuração

```bash
cd server
npm install
copy .env.example .env
npm run hash-password -- "sua-senha-aqui"
```

Copie o hash gerado para `OFFICE_PASSWORD_HASH` no `server/.env`, defina `OFFICE_USERNAME` e um
`SESSION_SECRET` fixo (qualquer string longa aleatória).

## Rodando

```bash
cd server
npm start
```

Acesse `http://localhost:4100` (ou a porta definida em `PORT` no `.env`).

## Como funciona

1. Envie a planilha de referência (.xlsx) e todos os PDFs de extrato de uma vez.
2. O sistema extrai o texto de cada PDF, identifica a empresa e o banco, e compara com a
   planilha (empresa + banco, com desempate por número de conta/tipo de produto quando uma
   empresa tem mais de uma conta no mesmo banco).
3. Cada PDF recebe um status: 🟢 Conferido, 🟠 Banco divergente, 🟡 Pendência, 🔴 Não
   identificado, 🔴 Empresa não encontrada na lista, ou 🔴 Faltante (linha da planilha sem PDF
   correspondente).
4. Pendências e não identificados podem ser resolvidos manualmente no painel, escolhendo a
   linha correta da planilha — fica registrado como "Conferido manualmente".
5. Todos os PDFs enviados ficam armazenados permanentemente, mesmo os não identificados.
6. É possível baixar um relatório em PDF com todas as seções (conferidos, faltantes,
   divergências, pendências, não identificados).

**Segurança**: o sistema nunca associa automaticamente um PDF a uma empresa quando há qualquer
ambiguidade — nesses casos, gera uma pendência para revisão manual em vez de arriscar uma
associação errada.
