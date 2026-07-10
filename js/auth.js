/* =========================================================
   INDUSTRIAL 505 — auth.js
   Inicio de sesión con Supabase Auth (email + contraseña)
   Requiere que los usuarios ya existan en Supabase Auth
   (Authentication > Users), creados manualmente o desde
   el futuro panel admin.html.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  redirectIfAlreadyLogged();
  initPasswordToggle();
  initLoginForm();
});

/* ---------------------------------------------------------
   Si ya hay una sesión activa, saltar directo a admin.html
--------------------------------------------------------- */
async function redirectIfAlreadyLogged() {
  if (!window.supabaseClient) return;
  try {
    const { data, error } = await window.supabaseClient.auth.getSession();
    if (error) throw error;
    if (data?.session) {
      window.location.href = "admin.html";
    }
  } catch (err) {
    console.error("Error verificando sesión:", err);
  }
}

/* ---------------------------------------------------------
   Mostrar / ocultar contraseña
--------------------------------------------------------- */
function initPasswordToggle() {
  const toggle = document.querySelector(".toggle-password");
  const input = document.getElementById("password");
  if (!toggle || !input) return;

  toggle.addEventListener("click", () => {
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    toggle.setAttribute("aria-label", isHidden ? "Ocultar contraseña" : "Mostrar contraseña");
    toggle.innerHTML = isHidden ? eyeOffIcon : eyeIcon;
  });
}

const eyeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const eyeOffIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c7 0 10.5 7 10.5 7a13.2 13.2 0 0 1-3.1 4.1M6.6 6.6C3.5 8.5 1.5 12 1.5 12s3.5 7 10.5 7c1.4 0 2.7-.3 3.8-.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`;

/* ---------------------------------------------------------
   Envío del formulario de inicio de sesión
--------------------------------------------------------- */
function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const alertBox = document.getElementById("auth-alert");
  const submitBtn = document.getElementById("login-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showAlert("Ingresa tu correo y contraseña.", "error");
      return;
    }

    if (!window.supabaseClient) {
      showAlert("Supabase no está configurado. Revisa js/supabase-config.js.", "error");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.session) {
        showAlert("Sesión iniciada. Redirigiendo…", "success");
        window.location.href = "admin.html";
        return;
      }

      showAlert("No se pudo iniciar sesión. Intenta de nuevo.", "error");
    } catch (err) {
      console.error("Error de autenticación:", err);
      showAlert(traducirError(err?.message), "error");
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    submitBtn.classList.toggle("is-loading", isLoading);
    submitBtn.disabled = isLoading;
  }

  function showAlert(message, type) {
    alertBox.textContent = "";
    const icon = document.createElement("span");
    icon.innerHTML = type === "error" ? alertErrorIcon : alertSuccessIcon;
    const text = document.createElement("span");
    text.textContent = message;
    alertBox.appendChild(icon.firstElementChild);
    alertBox.appendChild(text);
    alertBox.className = `auth-alert is-visible ${type}`;
  }

  function hideAlert() {
    alertBox.className = "auth-alert";
    alertBox.textContent = "";
  }
}

const alertErrorIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>`;
const alertSuccessIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>`;

/* ---------------------------------------------------------
   Traducción de mensajes comunes de error de Supabase Auth
--------------------------------------------------------- */
function traducirError(message) {
  const map = {
    "Invalid login credentials": "Correo o contraseña incorrectos.",
    "Email not confirmed": "Debes confirmar tu correo antes de iniciar sesión.",
    "Too many requests": "Demasiados intentos. Espera un momento e intenta de nuevo.",
  };
  return map[message] || "No se pudo iniciar sesión. Verifica tus datos e intenta de nuevo.";
}
