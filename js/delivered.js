window.CE = window.CE || {};

CE.delivered = (function () {
  async function render(container) {
    container.innerHTML = '<p class="muted">Carregando...</p>';
    const rows = await CE.api.listDelivered();
    if (rows.length === 0) {
      container.innerHTML = '<p class="muted">Nenhum extrato entregue ainda.</p>';
      return;
    }
    container.innerHTML = `
      <table class="table">
        <thead><tr><th>Empresa</th><th>Código</th><th>Banco</th><th>Arquivo</th><th>Entregue por</th><th>Data</th></tr></thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              <td>${CE.utils.escapeHtml(r.empresa)}</td>
              <td>${CE.utils.escapeHtml(r.codigo)}</td>
              <td>${CE.utils.escapeHtml(r.banco || "-")}</td>
              <td><a href="${CE.api.fileUrl(r.sheetRowId)}" target="_blank">${CE.utils.escapeHtml(r.arquivo)}</a></td>
              <td>${CE.utils.escapeHtml(r.entreguePor || "-")}</td>
              <td>${CE.utils.formatDateTime(r.entregueEm)}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }

  return { render };
})();
