window.CE = window.CE || {};

CE.utils = (function () {
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }

  function formatDateTime(iso) {
    if (!iso) return "-";
    const d = new Date(iso.replace(" ", "T") + "Z");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("pt-BR");
  }

  function deliveryBadgeHtml(entregue) {
    return entregue
      ? '<span class="badge sit-conferido">🟢 Entregue</span>'
      : '<span class="badge sit-faltante">🔴 Pendente</span>';
  }

  return { escapeHtml, formatDateTime, deliveryBadgeHtml };
})();
