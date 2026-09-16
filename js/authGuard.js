window.CE = window.CE || {};

CE.authGuard = (function () {
  async function requireSession() {
    try {
      const user = await CE.api.me();
      const label = document.getElementById("session-user");
      if (label) label.textContent = user.username;
      return user;
    } catch {
      window.location.href = "/login";
      return null;
    }
  }

  function wireLogout() {
    const btn = document.getElementById("btn-logout");
    if (btn) {
      btn.addEventListener("click", async () => {
        await CE.api.logout();
        window.location.href = "/login";
      });
    }
  }

  return { requireSession, wireLogout };
})();
