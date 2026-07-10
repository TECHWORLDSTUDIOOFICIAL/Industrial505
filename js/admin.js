/* =========================================================
   INDUSTRIAL 505 — admin.js
   Panel administrativo: enrutamiento interno, guardia de sesión
   y operaciones CRUD contra Supabase.
   ========================================================= */

let currentUser = null;
let currentProfile = null;

document.addEventListener("DOMContentLoaded", async () => {
  const ok = await guardSession();
  if (!ok) return;

  initSidebar();
  initRouter();
  initLogout();
  await hydrateHeader();
  await loadDashboard();
});

/* ---------------------------------------------------------
   Guardia de sesión: si no hay sesión activa, redirige al login
--------------------------------------------------------- */
async function guardSession() {
  if (!window.supabaseClient) {
    showToast("Supabase no está configurado. Revisa js/supabase-config.js", "error");
    return false;
  }
  try {
    const { data, error } = await window.supabaseClient.auth.getSession();
    if (error) throw error;
    if (!data?.session) {
      window.location.href = "autenticacion.html";
      return false;
    }
    currentUser = data.session.user;
    return true;
  } catch (err) {
    console.error("Error verificando sesión:", err);
    window.location.href = "autenticacion.html";
    return false;
  }
}

function initLogout() {
  document.querySelectorAll("[data-action='logout']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await window.supabaseClient.auth.signOut();
      } catch (err) {
        console.error("Error al cerrar sesión:", err);
      }
      window.location.href = "autenticacion.html";
    });
  });
}

/* ---------------------------------------------------------
   Sidebar (móvil)
--------------------------------------------------------- */
function initSidebar() {
  const sidebar = document.querySelector(".admin-sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  const toggle = document.querySelector(".sidebar-toggle");
  if (!sidebar || !toggle) return;

  const open = () => { sidebar.classList.add("is-open"); overlay.classList.add("is-visible"); };
  const close = () => { sidebar.classList.remove("is-open"); overlay.classList.remove("is-visible"); };

  toggle.addEventListener("click", open);
  overlay?.addEventListener("click", close);
  sidebar.querySelectorAll(".admin-nav-link").forEach((l) => l.addEventListener("click", close));
}

/* ---------------------------------------------------------
   Enrutamiento por hash: #dashboard, #inicio, #catalogo, etc.
--------------------------------------------------------- */
const VIEW_TITLES = {
  dashboard:    { title: "Dashboard",          desc: "Resumen general del sitio." },
  inicio:       { title: "Página de inicio",   desc: "Administra todo el contenido del home." },
  catalogo:     { title: "Catálogo",           desc: "Gestión de productos del catálogo." },
  cotizaciones: { title: "Cotizaciones",       desc: "Solicitudes de cotización recibidas." },
  usuarios:     { title: "Usuarios",           desc: "Administradores con acceso al panel." },
  configuracion:{ title: "Configuración",      desc: "Datos generales de la empresa." },
  perfil:       { title: "Mi perfil",          desc: "Tu información personal de acceso." },
};

function initRouter() {
  window.addEventListener("hashchange", renderRoute);
  renderRoute();
}

function renderRoute() {
  const hash = (window.location.hash || "#dashboard").replace("#", "");
  const view = VIEW_TITLES[hash] ? hash : "dashboard";

  document.querySelectorAll(".admin-view").forEach((el) => el.classList.remove("is-active"));
  document.getElementById(`view-${view}`)?.classList.add("is-active");

  document.querySelectorAll(".admin-nav-link").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.view === view);
  });

  const meta = VIEW_TITLES[view];
  document.getElementById("admin-header-title-text").textContent = meta.title;
  document.getElementById("admin-header-title-desc").textContent = meta.desc;

  // Carga perezosa según la vista
  if (view === "dashboard") loadDashboard();
  if (view === "inicio") loadInicioModule();
  if (view === "usuarios") loadUsuarios();
  if (view === "configuracion") loadConfiguracionModule();
  if (view === "perfil") loadPerfilModule();
}

/* ---------------------------------------------------------
   Header: datos del administrador logueado
--------------------------------------------------------- */
async function hydrateHeader() {
  const email = currentUser?.email || "";
  document.getElementById("admin-user-email").textContent = email;

  const today = new Date().toLocaleDateString("es-NI", { day: "numeric", month: "long", year: "numeric" });
  document.getElementById("admin-user-date").textContent = today;

  try {
    const { data, error } = await window.supabaseClient
      .from("perfiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (error) throw error;
    currentProfile = data;

    const nombre = data?.nombre || email.split("@")[0];
    document.getElementById("admin-user-email").textContent = nombre;
    document.getElementById("admin-avatar-initial").textContent = nombre.charAt(0).toUpperCase();
    if (data?.avatar_url) {
      document.getElementById("admin-avatar").innerHTML = `<img src="${escapeHtml(data.avatar_url)}" alt="" />`;
    }
  } catch (err) {
    console.error("Error cargando perfil:", err);
    document.getElementById("admin-avatar-initial").textContent = email.charAt(0).toUpperCase();
  }
}

/* ---------------------------------------------------------
   Helpers generales
--------------------------------------------------------- */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function showToast(message, type = "success") {
  const toast = document.getElementById("admin-toast");
  if (!toast) return;
  toast.querySelector(".toast-text").textContent = message;
  toast.className = `toast is-visible ${type}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function setBtnLoading(btn, isLoading) {
  if (!btn) return;
  btn.classList.toggle("is-loading", isLoading);
  btn.disabled = isLoading;
}

async function registrarActividad(accion, detalle = "") {
  try {
    await window.supabaseClient.from("registro_actividad").insert({
      usuario_id: currentUser?.id || null,
      usuario_correo: currentUser?.email || null,
      accion,
      detalle,
    });
  } catch (err) {
    console.warn("No se pudo registrar la actividad:", err);
  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */
async function loadDashboard() {
  const counters = [
    { table: "perfiles",              el: "count-usuarios" },
    { table: "marcas",                el: "count-marcas" },
    { table: "categorias",            el: "count-categorias" },
    { table: "banners",               el: "count-banners" },
  ];

  for (const c of counters) {
    try {
      const { count, error } = await window.supabaseClient
        .from(c.table)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      document.getElementById(c.el).textContent = count ?? 0;
    } catch (err) {
      document.getElementById(c.el).textContent = "—";
    }
  }

  document.getElementById("system-status").textContent = window.supabaseClient ? "Operativo" : "Sin conexión";

  try {
    const { data } = await window.supabaseClient
      .from("configuracion")
      .select("clave, valor")
      .in("clave", ["ultima_actualizacion"])
      .maybeSingle();
    document.getElementById("last-update").textContent = data?.valor || new Date().toLocaleDateString("es-NI");
  } catch {
    document.getElementById("last-update").textContent = new Date().toLocaleDateString("es-NI");
  }
}

/* =========================================================
   MÓDULO: PÁGINA DE INICIO
   Subtabs: hero, estadísticas, categorías, marcas, beneficios,
            contacto, footer
   ========================================================= */
let inicioInitialized = false;

function loadInicioModule() {
  initInicioSubtabs();
  if (inicioInitialized) return;
  inicioInitialized = true;

  loadHeroForm();
  loadEstadisticasList();
  loadCategoriasList();
  loadMarcasList();
  loadBeneficiosList();
  loadContactoForm();
  loadFooterForm();

  document.getElementById("hero-form")?.addEventListener("submit", saveHero);
  document.getElementById("contacto-form")?.addEventListener("submit", saveContacto);
  document.getElementById("footer-form")?.addEventListener("submit", saveFooter);
  document.getElementById("add-estadistica-btn")?.addEventListener("click", () => openEstadisticaModal());
  document.getElementById("add-categoria-btn")?.addEventListener("click", () => openCategoriaModal());
  document.getElementById("add-marca-btn")?.addEventListener("click", () => openMarcaModal());
  document.getElementById("add-beneficio-btn")?.addEventListener("click", () => openBeneficioModal());
}

function initInicioSubtabs() {
  const btns = document.querySelectorAll(".subtab-btn[data-subtab]");
  btns.forEach((btn) => {
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      document.querySelectorAll(".subview").forEach((v) => v.classList.remove("is-active"));
      document.getElementById(`subview-${btn.dataset.subtab}`)?.classList.add("is-active");
    });
  });
  // Aseguramos que el primer subtab quede visible en la primera carga
  if (!document.querySelector(".subtab-btn.is-active")) {
    btns[0]?.classList.add("is-active");
    document.getElementById(`subview-${btns[0]?.dataset.subtab}`)?.classList.add("is-active");
  }
}

/* ---------- Hero ---------- */
async function loadHeroForm() {
  try {
    const { data, error } = await window.supabaseClient
      .from("banners")
      .select("*")
      .order("orden", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return;

    document.getElementById("hero-id").value = data.id || "";
    document.getElementById("hero-titulo").value = data.titulo || "";
    document.getElementById("hero-subtitulo").value = data.subtitulo || "";
    document.getElementById("hero-descripcion").value = data.descripcion || "";
    document.getElementById("hero-imagen").value = data.imagen_url || "";
    document.getElementById("hero-texto-boton").value = data.texto_boton || "";
    document.getElementById("hero-url-boton").value = data.url_boton || "";
    document.getElementById("hero-texto-wa").value = data.texto_boton_whatsapp || "";
    document.getElementById("hero-url-wa").value = data.url_boton_whatsapp || "";
    document.getElementById("hero-activo").checked = !!data.activo;
  } catch (err) {
    console.error("Error cargando hero:", err);
  }
}

async function saveHero(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type='submit']");
  setBtnLoading(btn, true);

  const id = document.getElementById("hero-id").value;
  const payload = {
    titulo: document.getElementById("hero-titulo").value.trim(),
    subtitulo: document.getElementById("hero-subtitulo").value.trim(),
    descripcion: document.getElementById("hero-descripcion").value.trim(),
    imagen_url: document.getElementById("hero-imagen").value.trim(),
    texto_boton: document.getElementById("hero-texto-boton").value.trim(),
    url_boton: document.getElementById("hero-url-boton").value.trim(),
    texto_boton_whatsapp: document.getElementById("hero-texto-wa").value.trim(),
    url_boton_whatsapp: document.getElementById("hero-url-wa").value.trim(),
    activo: document.getElementById("hero-activo").checked,
  };

  try {
    const query = id
      ? window.supabaseClient.from("banners").update(payload).eq("id", id)
      : window.supabaseClient.from("banners").insert({ ...payload, orden: 1 });
    const { error } = await query;
    if (error) throw error;
    showToast("Hero actualizado correctamente.");
    registrarActividad("Actualizar hero", payload.titulo);
    loadHeroForm();
  } catch (err) {
    console.error(err);
    showToast("No se pudo guardar el hero.", "error");
  } finally {
    setBtnLoading(btn, false);
  }
}

/* ---------- Estadísticas ---------- */
async function loadEstadisticasList() {
  const tbody = document.querySelector("#tabla-estadisticas tbody");
  if (!tbody) return;
  try {
    const { data, error } = await window.supabaseClient
      .from("hero_estadisticas").select("*").order("orden", { ascending: true });
    if (error) throw error;
    renderEstadisticasTable(data || []);
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No se pudieron cargar las estadísticas.</td></tr>`;
  }
}

function renderEstadisticasTable(rows) {
  const tbody = document.querySelector("#tabla-estadisticas tbody");
  if (!rows.length) { tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Sin registros. Agrega la primera estadística.</td></tr>`; return; }
  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td><strong>${escapeHtml(r.cantidad)}</strong></td>
      <td>${escapeHtml(r.texto)}</td>
      <td>${r.orden}</td>
      <td>${badge(r.activo)}</td>
      <td class="row-actions">
        ${editBtn(`openEstadisticaModal('${r.id}')`)}
        ${deleteBtn(`deleteRow('hero_estadisticas','${r.id}', loadEstadisticasList)`)}
      </td>
    </tr>`).join("");
}

function openEstadisticaModal(id) {
  const row = id ? findCached("hero_estadisticas", id) : null;
  openFormModal({
    title: id ? "Editar estadística" : "Nueva estadística",
    fields: [
      { key: "cantidad", label: "Cantidad", value: row?.cantidad, placeholder: "+500" },
      { key: "texto", label: "Texto", value: row?.texto, placeholder: "Productos EPP" },
      { key: "orden", label: "Orden", value: row?.orden ?? 0, type: "number" },
    ],
    activo: row?.activo ?? true,
    onSave: async (values) => {
      const payload = { cantidad: values.cantidad, texto: values.texto, orden: Number(values.orden) || 0, activo: values.activo };
      if (id) await window.supabaseClient.from("hero_estadisticas").update(payload).eq("id", id);
      else await window.supabaseClient.from("hero_estadisticas").insert(payload);
      registrarActividad(id ? "Editar estadística" : "Crear estadística", values.texto);
      loadEstadisticasList();
    },
  });
}

/* ---------- Categorías ---------- */
async function loadCategoriasList() {
  const tbody = document.querySelector("#tabla-categorias tbody");
  if (!tbody) return;
  try {
    const { data, error } = await window.supabaseClient
      .from("categorias").select("*").order("orden", { ascending: true });
    if (error) throw error;
    cacheRows("categorias", data || []);
    if (!data?.length) { tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Sin categorías. Agrega la primera.</td></tr>`; return; }
    tbody.innerHTML = data.map((r) => `
      <tr>
        <td>${thumb(r.imagen_url)}</td>
        <td><strong>${escapeHtml(r.nombre)}</strong><br><span class="text-muted">${escapeHtml(r.slug || "")}</span></td>
        <td>${r.orden}</td>
        <td>${badge(r.activo)}</td>
        <td class="row-actions">
          ${editBtn(`openCategoriaModal('${r.id}')`)}
          ${deleteBtn(`deleteRow('categorias','${r.id}', loadCategoriasList)`)}
        </td>
      </tr>`).join("");
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No se pudieron cargar las categorías.</td></tr>`;
  }
}

function openCategoriaModal(id) {
  const row = id ? findCached("categorias", id) : null;
  openFormModal({
    title: id ? "Editar categoría" : "Nueva categoría",
    fields: [
      { key: "nombre", label: "Nombre", value: row?.nombre, placeholder: "Cascos" },
      { key: "slug", label: "Slug (URL)", value: row?.slug, placeholder: "cascos" },
      { key: "imagen_url", label: "URL de imagen", value: row?.imagen_url, placeholder: "https://…" },
      { key: "orden", label: "Orden", value: row?.orden ?? 0, type: "number" },
    ],
    activo: row?.activo ?? true,
    onSave: async (values) => {
      const payload = { nombre: values.nombre, slug: values.slug, imagen_url: values.imagen_url, orden: Number(values.orden) || 0, activo: values.activo };
      if (id) await window.supabaseClient.from("categorias").update(payload).eq("id", id);
      else await window.supabaseClient.from("categorias").insert(payload);
      registrarActividad(id ? "Editar categoría" : "Crear categoría", values.nombre);
      loadCategoriasList();
    },
  });
}

/* ---------- Marcas ---------- */
async function loadMarcasList() {
  const tbody = document.querySelector("#tabla-marcas tbody");
  if (!tbody) return;
  try {
    const { data, error } = await window.supabaseClient
      .from("marcas").select("*").order("orden", { ascending: true });
    if (error) throw error;
    cacheRows("marcas", data || []);
    if (!data?.length) { tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Sin marcas. Agrega la primera.</td></tr>`; return; }
    tbody.innerHTML = data.map((r) => `
      <tr>
        <td>${thumb(r.logo_url)}</td>
        <td><strong>${escapeHtml(r.nombre)}</strong></td>
        <td>${r.orden}</td>
        <td>${badge(r.activo)}</td>
        <td class="row-actions">
          ${editBtn(`openMarcaModal('${r.id}')`)}
          ${deleteBtn(`deleteRow('marcas','${r.id}', loadMarcasList)`)}
        </td>
      </tr>`).join("");
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No se pudieron cargar las marcas.</td></tr>`;
  }
}

function openMarcaModal(id) {
  const row = id ? findCached("marcas", id) : null;
  openFormModal({
    title: id ? "Editar marca" : "Nueva marca",
    fields: [
      { key: "nombre", label: "Nombre", value: row?.nombre, placeholder: "SteelGuard" },
      { key: "logo_url", label: "URL del logo", value: row?.logo_url, placeholder: "https://…" },
      { key: "orden", label: "Orden", value: row?.orden ?? 0, type: "number" },
    ],
    activo: row?.activo ?? true,
    onSave: async (values) => {
      const payload = { nombre: values.nombre, logo_url: values.logo_url, orden: Number(values.orden) || 0, activo: values.activo };
      if (id) await window.supabaseClient.from("marcas").update(payload).eq("id", id);
      else await window.supabaseClient.from("marcas").insert(payload);
      registrarActividad(id ? "Editar marca" : "Crear marca", values.nombre);
      loadMarcasList();
    },
  });
}

/* ---------- Beneficios ---------- */
async function loadBeneficiosList() {
  const tbody = document.querySelector("#tabla-beneficios tbody");
  if (!tbody) return;
  try {
    const { data, error } = await window.supabaseClient
      .from("beneficios").select("*").order("orden", { ascending: true });
    if (error) throw error;
    cacheRows("beneficios", data || []);
    if (!data?.length) { tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Sin beneficios. Agrega el primero.</td></tr>`; return; }
    tbody.innerHTML = data.map((r) => `
      <tr>
        <td><strong>${escapeHtml(r.titulo)}</strong><br><span class="text-muted">${escapeHtml(r.descripcion || "")}</span></td>
        <td>${escapeHtml(r.icono)}</td>
        <td>${r.orden}</td>
        <td>${badge(r.activo)}</td>
        <td class="row-actions">
          ${editBtn(`openBeneficioModal('${r.id}')`)}
          ${deleteBtn(`deleteRow('beneficios','${r.id}', loadBeneficiosList)`)}
        </td>
      </tr>`).join("");
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No se pudieron cargar los beneficios.</td></tr>`;
  }
}

function openBeneficioModal(id) {
  const row = id ? findCached("beneficios", id) : null;
  openFormModal({
    title: id ? "Editar beneficio" : "Nuevo beneficio",
    fields: [
      { key: "titulo", label: "Título", value: row?.titulo, placeholder: "Entrega rápida" },
      { key: "descripcion", label: "Descripción", value: row?.descripcion, type: "textarea" },
      { key: "icono", label: "Ícono (palabra clave)", value: row?.icono, placeholder: "entrega" },
      { key: "orden", label: "Orden", value: row?.orden ?? 0, type: "number" },
    ],
    activo: row?.activo ?? true,
    onSave: async (values) => {
      const payload = { titulo: values.titulo, descripcion: values.descripcion, icono: values.icono || "escudo", orden: Number(values.orden) || 0, activo: values.activo };
      if (id) await window.supabaseClient.from("beneficios").update(payload).eq("id", id);
      else await window.supabaseClient.from("beneficios").insert(payload);
      registrarActividad(id ? "Editar beneficio" : "Crear beneficio", values.titulo);
      loadBeneficiosList();
    },
  });
}

/* ---------- Contacto (guardado en tabla configuracion) ---------- */
async function loadContactoForm() {
  const data = await getConfigMap(["direccion", "correo", "whatsapp", "horario", "mapa_embed_url"]);
  document.getElementById("contacto-direccion").value = data.direccion || "";
  document.getElementById("contacto-correo").value = data.correo || "";
  document.getElementById("contacto-whatsapp").value = data.whatsapp || "";
  document.getElementById("contacto-horario").value = data.horario || "";
  document.getElementById("contacto-mapa").value = data.mapa_embed_url || "";
}

async function saveContacto(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type='submit']");
  setBtnLoading(btn, true);
  try {
    await setConfigMap({
      direccion: document.getElementById("contacto-direccion").value.trim(),
      correo: document.getElementById("contacto-correo").value.trim(),
      whatsapp: document.getElementById("contacto-whatsapp").value.trim(),
      horario: document.getElementById("contacto-horario").value.trim(),
      mapa_embed_url: document.getElementById("contacto-mapa").value.trim(),
    });
    showToast("Datos de contacto actualizados.");
    registrarActividad("Actualizar contacto");
  } catch (err) {
    console.error(err);
    showToast("No se pudo guardar el contacto.", "error");
  } finally {
    setBtnLoading(btn, false);
  }
}

/* ---------- Footer (guardado en tabla configuracion) ---------- */
async function loadFooterForm() {
  const data = await getConfigMap(["footer_copyright", "facebook_url", "instagram_url", "linkedin_url", "whatsapp", "correo"]);
  document.getElementById("footer-copyright").value = data.footer_copyright || "";
  document.getElementById("footer-facebook").value = data.facebook_url || "";
  document.getElementById("footer-instagram").value = data.instagram_url || "";
  document.getElementById("footer-linkedin").value = data.linkedin_url || "";
  document.getElementById("footer-whatsapp").value = data.whatsapp || "";
  document.getElementById("footer-correo").value = data.correo || "";
}

async function saveFooter(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type='submit']");
  setBtnLoading(btn, true);
  try {
    await setConfigMap({
      footer_copyright: document.getElementById("footer-copyright").value.trim(),
      facebook_url: document.getElementById("footer-facebook").value.trim(),
      instagram_url: document.getElementById("footer-instagram").value.trim(),
      linkedin_url: document.getElementById("footer-linkedin").value.trim(),
      whatsapp: document.getElementById("footer-whatsapp").value.trim(),
      correo: document.getElementById("footer-correo").value.trim(),
    });
    showToast("Footer actualizado correctamente.");
    registrarActividad("Actualizar footer");
  } catch (err) {
    console.error(err);
    showToast("No se pudo guardar el footer.", "error");
  } finally {
    setBtnLoading(btn, false);
  }
}

/* =========================================================
   MÓDULO: USUARIOS
   ========================================================= */
async function loadUsuarios() {
  const tbody = document.querySelector("#tabla-usuarios tbody");
  if (!tbody) return;
  try {
    const { data, error } = await window.supabaseClient
      .from("perfiles").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    cacheRows("perfiles", data || []);
    if (!data?.length) { tbody.innerHTML = `<tr><td colspan="5" class="table-empty">Aún no hay perfiles. Crea el usuario desde Supabase Dashboard.</td></tr>`; return; }
    tbody.innerHTML = data.map((r) => `
      <tr>
        <td><strong>${escapeHtml(r.nombre || "—")}</strong></td>
        <td>${escapeHtml(r.correo || "—")}</td>
        <td><span class="badge ${r.rol === "administrador" ? "role-admin" : "role-editor"}">${escapeHtml(r.rol)}</span></td>
        <td>${badge(r.activo)}</td>
        <td class="row-actions">
          ${editBtn(`openUsuarioModal('${r.id}')`)}
          ${deleteBtn(`deleteRow('perfiles','${r.id}', loadUsuarios)`, "Eliminar perfil")}
        </td>
      </tr>`).join("");
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No se pudieron cargar los usuarios.</td></tr>`;
  }
}

function openUsuarioModal(id) {
  const row = findCached("perfiles", id);
  if (!row) return;
  openFormModal({
    title: "Editar usuario",
    note: "Este usuario ya existe en Supabase Auth. Aquí solo editas su nombre y rol dentro del panel.",
    fields: [
      { key: "nombre", label: "Nombre", value: row.nombre },
      { key: "rol", label: "Rol", value: row.rol, type: "select", options: [
        { value: "administrador", label: "Administrador" },
        { value: "editor", label: "Editor" },
      ]},
    ],
    activo: row.activo,
    onSave: async (values) => {
      const payload = { nombre: values.nombre, rol: values.rol, activo: values.activo };
      const { error } = await window.supabaseClient.from("perfiles").update(payload).eq("id", id);
      if (error) throw error;
      registrarActividad("Editar usuario", values.nombre);
      loadUsuarios();
    },
  });
}

document.getElementById("add-usuario-btn")?.addEventListener("click", () => {
  openFormModal({
    title: "Crear usuario administrador",
    note: "Por seguridad, Supabase no permite crear usuarios de Auth desde el navegador. Crea el usuario en Supabase Dashboard → Authentication → Users; su perfil aparecerá aquí automáticamente para que le asignes rol.",
    fields: [],
    hideActivo: true,
    hideSave: true,
  });
});

/* =========================================================
   MÓDULO: CONFIGURACIÓN GENERAL
   ========================================================= */
let configuracionInitialized = false;

async function loadConfiguracionModule() {
  const data = await getConfigMap(["nombre_empresa", "logo_url", "favicon_url", "correo", "whatsapp", "direccion", "color_navy", "color_steel_blue", "color_safety"]);
  document.getElementById("config-nombre").value = data.nombre_empresa || "";
  document.getElementById("config-logo").value = data.logo_url || "";
  document.getElementById("config-favicon").value = data.favicon_url || "";
  document.getElementById("config-correo").value = data.correo || "";
  document.getElementById("config-whatsapp").value = data.whatsapp || "";
  document.getElementById("config-direccion").value = data.direccion || "";
  document.getElementById("config-color-navy").value = data.color_navy || "#0A2342";
  document.getElementById("config-color-blue").value = data.color_steel_blue || "#1D4E89";
  document.getElementById("config-color-safety").value = data.color_safety || "#F2A900";

  if (!configuracionInitialized) {
    configuracionInitialized = true;
    document.getElementById("configuracion-form")?.addEventListener("submit", saveConfiguracionModule);
  }
}

async function saveConfiguracionModule(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type='submit']");
  setBtnLoading(btn, true);
  try {
    await setConfigMap({
      nombre_empresa: document.getElementById("config-nombre").value.trim(),
      logo_url: document.getElementById("config-logo").value.trim(),
      favicon_url: document.getElementById("config-favicon").value.trim(),
      correo: document.getElementById("config-correo").value.trim(),
      whatsapp: document.getElementById("config-whatsapp").value.trim(),
      direccion: document.getElementById("config-direccion").value.trim(),
      color_navy: document.getElementById("config-color-navy").value.trim(),
      color_steel_blue: document.getElementById("config-color-blue").value.trim(),
      color_safety: document.getElementById("config-color-safety").value.trim(),
    });
    showToast("Configuración guardada correctamente.");
    registrarActividad("Actualizar configuración general");
  } catch (err) {
    console.error(err);
    showToast("No se pudo guardar la configuración.", "error");
  } finally {
    setBtnLoading(btn, false);
  }
}

/* =========================================================
   MÓDULO: MI PERFIL
   ========================================================= */
let perfilInitialized = false;

async function loadPerfilModule() {
  document.getElementById("perfil-correo").value = currentUser?.email || "";
  document.getElementById("perfil-nombre").value = currentProfile?.nombre || "";
  document.getElementById("perfil-avatar").value = currentProfile?.avatar_url || "";

  if (!perfilInitialized) {
    perfilInitialized = true;
    document.getElementById("perfil-form")?.addEventListener("submit", savePerfil);
    document.getElementById("perfil-password-form")?.addEventListener("submit", savePassword);
  }
}

async function savePerfil(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type='submit']");
  setBtnLoading(btn, true);
  try {
    const payload = {
      nombre: document.getElementById("perfil-nombre").value.trim(),
      avatar_url: document.getElementById("perfil-avatar").value.trim(),
    };
    const { error } = await window.supabaseClient.from("perfiles").upsert({ id: currentUser.id, correo: currentUser.email, ...payload });
    if (error) throw error;
    showToast("Perfil actualizado.");
    registrarActividad("Actualizar mi perfil");
    hydrateHeader();
  } catch (err) {
    console.error(err);
    showToast("No se pudo actualizar el perfil.", "error");
  } finally {
    setBtnLoading(btn, false);
  }
}

async function savePassword(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type='submit']");
  const newPass = document.getElementById("perfil-password").value;
  const confirmPass = document.getElementById("perfil-password-confirm").value;

  if (newPass.length < 6) { showToast("La contraseña debe tener al menos 6 caracteres.", "error"); return; }
  if (newPass !== confirmPass) { showToast("Las contraseñas no coinciden.", "error"); return; }

  setBtnLoading(btn, true);
  try {
    const { error } = await window.supabaseClient.auth.updateUser({ password: newPass });
    if (error) throw error;
    showToast("Contraseña actualizada correctamente.");
    registrarActividad("Cambiar contraseña");
    e.target.reset();
  } catch (err) {
    console.error(err);
    showToast("No se pudo actualizar la contraseña.", "error");
  } finally {
    setBtnLoading(btn, false);
  }
}

/* =========================================================
   Utilidades compartidas: configuracion (key/value), tablas,
   caché en memoria, modal genérico de formulario
   ========================================================= */
async function getConfigMap(keys) {
  const result = {};
  try {
    const { data, error } = await window.supabaseClient
      .from("configuracion").select("clave, valor").in("clave", keys);
    if (error) throw error;
    (data || []).forEach((row) => { result[row.clave] = row.valor; });
  } catch (err) {
    console.error("Error leyendo configuración:", err);
  }
  return result;
}

async function setConfigMap(map) {
  const rows = Object.entries(map).map(([clave, valor]) => ({ clave, valor }));
  const { error } = await window.supabaseClient.from("configuracion").upsert(rows, { onConflict: "clave" });
  if (error) throw error;
}

const rowCache = {};
function cacheRows(table, rows) { rowCache[table] = rows; }
function findCached(table, id) { return (rowCache[table] || []).find((r) => r.id === id); }

function badge(activo) {
  return activo ? `<span class="badge on">Activo</span>` : `<span class="badge off">Inactivo</span>`;
}
function thumb(url) {
  return url
    ? `<img class="table-thumb" src="${escapeHtml(url)}" alt="" />`
    : `<span class="table-thumb"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg></span>`;
}
function editBtn(onclick) {
  return `<button class="icon-btn" onclick="${onclick}" aria-label="Editar" type="button">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
  </button>`;
}
function deleteBtn(onclick, label = "Eliminar") {
  return `<button class="icon-btn danger" onclick="${onclick}" aria-label="${label}" type="button">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
  </button>`;
}

async function deleteRow(table, id, refreshFn) {
  if (!confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
  try {
    const { error } = await window.supabaseClient.from(table).delete().eq("id", id);
    if (error) throw error;
    showToast("Registro eliminado.");
    registrarActividad(`Eliminar en ${table}`, id);
    refreshFn?.();
  } catch (err) {
    console.error(err);
    showToast("No se pudo eliminar el registro.", "error");
  }
}
window.deleteRow = deleteRow;
window.openEstadisticaModal = openEstadisticaModal;
window.openCategoriaModal = openCategoriaModal;
window.openMarcaModal = openMarcaModal;
window.openBeneficioModal = openBeneficioModal;
window.openUsuarioModal = openUsuarioModal;

/* ---------- Modal genérico de creación/edición ---------- */
function openFormModal({ title, fields, activo, onSave, note, hideActivo, hideSave }) {
  const overlay = document.getElementById("modal-overlay");
  const box = document.getElementById("modal-box");

  const fieldsHtml = fields.map((f) => {
    if (f.type === "textarea") {
      return `<div class="form-field"><label>${f.label}</label><textarea class="form-textarea" data-field="${f.key}">${escapeHtml(f.value || "")}</textarea></div>`;
    }
    if (f.type === "select") {
      return `<div class="form-field"><label>${f.label}</label><select class="form-select" data-field="${f.key}">
        ${f.options.map((o) => `<option value="${o.value}" ${o.value === f.value ? "selected" : ""}>${o.label}</option>`).join("")}
      </select></div>`;
    }
    return `<div class="form-field"><label>${f.label}</label><input class="form-input" type="${f.type || "text"}" data-field="${f.key}" value="${escapeHtml(f.value ?? "")}" placeholder="${f.placeholder || ""}" /></div>`;
  }).join("");

  box.innerHTML = `
    <div class="panel-head">
      <h3>${title}</h3>
      <button type="button" class="icon-btn" id="modal-close" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>
    </div>
    ${note ? `<p class="text-muted mt-sm" style="margin-bottom:var(--space-md)">${note}</p>` : ""}
    <form id="modal-form">
      <div class="form-grid">${fieldsHtml}</div>
      ${!hideActivo ? `
      <div class="form-switch-row mt-sm">
        <span class="switch">
          <input type="checkbox" id="modal-activo" ${activo ? "checked" : ""} />
          <span class="track"></span><span class="thumb"></span>
        </span>
        <label for="modal-activo" style="font-size:0.85rem;color:var(--steel-gray)">Activo</label>
      </div>` : ""}
      <div class="form-actions">
        ${!hideSave ? `<button type="submit" class="btn btn-primary"><span class="btn-loading-dot"></span><span class="btn-label">Guardar</span></button>` : ""}
        <button type="button" class="btn btn-ghost-navy" id="modal-cancel">Cerrar</button>
      </div>
    </form>
  `;

  overlay.classList.add("is-visible");

  const close = () => overlay.classList.remove("is-visible");
  document.getElementById("modal-close").addEventListener("click", close);
  document.getElementById("modal-cancel").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); }, { once: true });

  if (!hideSave) {
    document.getElementById("modal-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector("button[type='submit']");
      setBtnLoading(btn, true);
      const values = {};
      box.querySelectorAll("[data-field]").forEach((el) => { values[el.dataset.field] = el.value; });
      values.activo = document.getElementById("modal-activo")?.checked ?? true;
      try {
        await onSave(values);
        showToast("Guardado correctamente.");
        close();
      } catch (err) {
        console.error(err);
        showToast("No se pudo guardar.", "error");
      } finally {
        setBtnLoading(btn, false);
      }
    });
  }
}
