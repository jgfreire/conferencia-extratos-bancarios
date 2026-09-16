window.CE = window.CE || {};

CE.api = (function () {
  async function request(method, path, { body, isFormData } = {}) {
    const opts = { method, headers: {}, credentials: "same-origin" };
    if (body !== undefined) {
      if (isFormData) {
        opts.body = body;
      } else {
        opts.headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify(body);
      }
    }
    const res = await fetch(CE.config.apiBase + path, opts);
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Erro HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    login: (username, password) => request("POST", "/auth/login", { body: { username, password } }),
    logout: () => request("POST", "/auth/logout"),
    me: () => request("GET", "/auth/me"),
    register: (username, password) => request("POST", "/auth/register", { body: { username, password } }),
    listUsers: () => request("GET", "/auth/users"),

    searchCompanies: (q) => request("GET", `/companies/search?q=${encodeURIComponent(q)}`),
    getCompanyRows: (codigo) => request("GET", `/companies/${encodeURIComponent(codigo)}/rows`),

    deliver: (sheetRowId, formData) => request("POST", `/sheet-rows/${sheetRowId}/deliver`, { body: formData, isFormData: true }),
    undoDelivery: (sheetRowId) => request("POST", `/sheet-rows/${sheetRowId}/undo`),
    fileUrl: (sheetRowId) => `${CE.config.apiBase}/sheet-rows/${sheetRowId}/file`,

    listDelivered: () => request("GET", "/delivered"),
    clearDelivered: () => request("POST", "/delivered/clear")
  };
})();
