window.CE = window.CE || {};

CE.users = (function () {
  async function renderList(container) {
    const users = await CE.api.listUsers();
    container.innerHTML = `
      <table class="table">
        <thead><tr><th>Usuário</th><th>Criado em</th></tr></thead>
        <tbody>
          ${users
            .map(
              (u) => `<tr><td>${CE.utils.escapeHtml(u.username)}</td><td>${CE.utils.formatDateTime(u.created_at)}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }

  function initForm(listContainer) {
    const form = document.getElementById("user-form");
    const errorBox = document.getElementById("user-error");
    const successBox = document.getElementById("user-success");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.hidden = true;
      successBox.hidden = true;
      const username = document.getElementById("new-username").value.trim();
      const password = document.getElementById("new-password").value;
      try {
        await CE.api.register(username, password);
        successBox.textContent = `Usuário "${username}" criado com sucesso.`;
        successBox.hidden = false;
        form.reset();
        renderList(listContainer);
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.hidden = false;
      }
    });
  }

  return { renderList, initForm };
})();
