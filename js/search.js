window.CE = window.CE || {};

CE.search = (function () {
  let debounceTimer = null;

  function renderResults(container, companies, onSelect) {
    if (companies.length === 0) {
      container.innerHTML = '<p class="muted">Nenhuma empresa encontrada.</p>';
      return;
    }
    container.innerHTML = companies
      .map(
        (c) => `
      <div class="company-result" data-codigo="${CE.utils.escapeHtml(c.codigo)}">
        <strong>${CE.utils.escapeHtml(c.nomeRaw)}</strong>
        <span class="muted">Código ${CE.utils.escapeHtml(c.codigo)} — ${c.entregues}/${c.total} entregues</span>
      </div>`
      )
      .join("");
    container.querySelectorAll(".company-result").forEach((el) => {
      el.addEventListener("click", () => onSelect(el.dataset.codigo));
    });
  }

  function renderCompanyDocs(container, data, onChanged) {
    container.innerHTML = `
      <h3>${CE.utils.escapeHtml(data.nomeRaw)} <span class="muted">(código ${CE.utils.escapeHtml(data.codigo)})</span></h3>
      <table class="table">
        <thead><tr><th>Banco</th><th>Situação</th><th>Arquivo</th><th></th></tr></thead>
        <tbody>
          ${data.documentos
            .map(
              (d) => `
            <tr data-row-id="${d.sheetRowId}">
              <td>${CE.utils.escapeHtml(d.banco || "-")}${d.semContaBancaria ? ' <span class="muted">(sem conta bancária cadastrada)</span>' : ""}</td>
              <td>${CE.utils.deliveryBadgeHtml(d.entregue)}</td>
              <td>${d.entregue ? CE.utils.escapeHtml(d.arquivo) : "—"}</td>
              <td class="doc-actions"></td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;

    data.documentos.forEach((d) => {
      const tr = container.querySelector(`tr[data-row-id="${d.sheetRowId}"]`);
      const actionsTd = tr.querySelector(".doc-actions");
      if (d.entregue) {
        actionsTd.innerHTML = `
          <a href="${CE.api.fileUrl(d.sheetRowId)}" target="_blank" class="btn-link">Ver</a>
          <button class="btn-secondary btn-undo" type="button">Desfazer</button>`;
        actionsTd.querySelector(".btn-undo").addEventListener("click", async () => {
          await CE.api.undoDelivery(d.sheetRowId);
          onChanged();
        });
      } else {
        actionsTd.innerHTML = `
          <input type="file" accept="application/pdf" class="doc-file-input">
          <span class="doc-error error-box" hidden></span>`;
        // Envia assim que um arquivo é escolhido — sem um segundo clique de confirmação.
        actionsTd.querySelector(".doc-file-input").addEventListener("change", async (e) => {
          const errorBox = actionsTd.querySelector(".doc-error");
          errorBox.hidden = true;
          const file = e.target.files[0];
          if (!file) return;
          const formData = new FormData();
          formData.append("file", file);
          try {
            await CE.api.deliver(d.sheetRowId, formData);
            onChanged();
          } catch (err) {
            errorBox.textContent = err.message;
            errorBox.hidden = false;
          }
        });
      }
    });
  }

  function init() {
    const input = document.getElementById("search-input");
    const resultsBox = document.getElementById("search-results");
    const docsBox = document.getElementById("company-docs");

    function reloadCompany(codigo) {
      CE.api.getCompanyRows(codigo).then((data) => renderCompanyDocs(docsBox, data, () => reloadCompany(codigo)));
    }

    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      const q = input.value.trim();
      if (q.length < 2) {
        resultsBox.innerHTML = "";
        return;
      }
      debounceTimer = setTimeout(async () => {
        const companies = await CE.api.searchCompanies(q);
        renderResults(resultsBox, companies, (codigo) => {
          docsBox.hidden = false;
          reloadCompany(codigo);
        });
      }, 250);
    });
  }

  return { init };
})();
