window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    try {
      await CE.api.login(username, password);
      window.location.href = "/";
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.hidden = false;
    }
  });
});
