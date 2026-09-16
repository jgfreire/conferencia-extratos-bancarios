window.addEventListener("DOMContentLoaded", async () => {
  const user = await CE.authGuard.requireSession();
  if (!user) return;
  CE.authGuard.wireLogout();
  CE.search.init();
  CE.users.initForm(document.getElementById("users-list"));

  document.getElementById("btn-clear-delivered").addEventListener("click", async () => {
    const confirmed = window.confirm(
      "Isso vai apagar TODOS os extratos já entregues (os arquivos e a marcação de entregue). " +
      "A lista de empresas/bancos não é afetada — todas as linhas voltam a ficar pendentes. " +
      "Essa ação não pode ser desfeita. Confirma?"
    );
    if (!confirmed) return;
    const result = await CE.api.clearDelivered();
    window.alert(`${result.extratosRemovidos} extrato(s) removido(s). Todas as empresas estão pendentes novamente.`);
    location.reload();
  });

  const views = {
    busca: document.getElementById("view-busca"),
    entregues: document.getElementById("view-entregues"),
    usuarios: document.getElementById("view-usuarios")
  };
  const navButtons = document.querySelectorAll(".nav-btn");

  function showView(name) {
    Object.entries(views).forEach(([key, el]) => {
      el.hidden = key !== name;
    });
    navButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === name));
    if (name === "entregues") CE.delivered.render(document.getElementById("delivered-table"));
    if (name === "usuarios") CE.users.renderList(document.getElementById("users-list"));
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => showView(btn.dataset.view));
  });

  showView("busca");
});
