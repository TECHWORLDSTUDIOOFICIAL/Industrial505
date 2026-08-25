/* =========================================================
   INDUSTRIAL 505 — Modo oscuro / claro
   Compartido por index.html, catalogo.html y admin.html.

   La aplicación INICIAL del tema (para que no haya parpadeo de
   claro→oscuro al cargar) va en un <script> pequeño e inline en
   el <head> de cada página, ANTES de las hojas de estilo. Este
   archivo solo conecta el botón ☀/🌙 una vez que el DOM está listo.
   ========================================================= */
const THEME_KEY = "ind505-theme";

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* almacenamiento no disponible */ }
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  });
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  setTheme(current === "dark" ? "light" : "dark");
}

document.addEventListener("DOMContentLoaded", () => {
  const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.setAttribute("aria-pressed", current === "dark" ? "true" : "false");
    btn.addEventListener("click", toggleTheme);
  });
});
