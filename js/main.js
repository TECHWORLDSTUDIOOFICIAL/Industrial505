/* =========================================================
   INDUSTRIAL 505 — main.js
   Carga de datos dinámicos desde Supabase + interacciones UI
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initHeaderScroll();
  initMobileNav();
  initRevealOnScroll();
  loadConfiguracion();
  loadHeroContenido();
  loadHeroEstadisticas();
  loadCategorias();
  loadProductosDestacados();
  loadMarcas();
  loadBeneficios();
});

/* ---------------------------------------------------------
   Header: sombra al hacer scroll
--------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------------------------------------------------------
   Navegación móvil
--------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-nav");
  if (!toggle || !menu) return;

  const closeMenu = () => {
    toggle.classList.remove("is-active");
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.classList.toggle("is-active", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
}

/* ---------------------------------------------------------
   Animación de revelado al hacer scroll
--------------------------------------------------------- */
function initRevealOnScroll() {
  const targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || targets.length === 0) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
function formatCurrency(value) {
  if (value === null || value === undefined) return "";
  return new Intl.NumberFormat("es-NI", { style: "currency", currency: "NIO" }).format(value);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function markObserved(container) {
  // Reobserva nuevos elementos .reveal insertados dinámicamente
  const targets = container.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  targets.forEach((el) => observer.observe(el));
}

/* ---------------------------------------------------------
   Configuración (contacto, WhatsApp, redes)
--------------------------------------------------------- */
async function loadConfiguracion() {
  const fallback = {
    direccion: "Configura la dirección en la tabla `configuracion`",
    correo: "contacto@industrial505.com",
    whatsapp: "50588888888",
    horario: "Lunes a Sábado, 8:00am - 6:00pm",
    facebook_url: "#",
    instagram_url: "#",
    linkedin_url: "#",
  };

  let data = fallback;

  if (window.supabaseClient) {
    try {
      const { data: rows, error } = await supabaseClient
        .from("configuracion")
        .select("clave, valor");
      if (error) throw error;
      if (rows && rows.length) {
        data = { ...fallback };
        rows.forEach((row) => { data[row.clave] = row.valor; });
      }
    } catch (err) {
      console.error("Error cargando configuración:", err);
    }
  }

  document.querySelectorAll("[data-config='direccion']").forEach((el) => (el.textContent = data.direccion));
  document.querySelectorAll("[data-config='correo']").forEach((el) => {
    el.textContent = data.correo;
    el.setAttribute("href", `mailto:${data.correo}`);
  });
  document.querySelectorAll("[data-config='horario']").forEach((el) => (el.textContent = data.horario));

  const waNumber = (data.whatsapp || "").replace(/\D/g, "");
  const waMessage = encodeURIComponent("Hola INDUSTRIAL 505, quisiera más información sobre sus productos.");
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  document.querySelectorAll("[data-config='whatsapp-link']").forEach((el) => el.setAttribute("href", waLink));
  document.querySelectorAll("[data-config='whatsapp-text']").forEach((el) => (el.textContent = `+${waNumber}`));

  document.querySelectorAll("[data-config='facebook']").forEach((el) => el.setAttribute("href", data.facebook_url || "#"));
  document.querySelectorAll("[data-config='instagram']").forEach((el) => el.setAttribute("href", data.instagram_url || "#"));
  document.querySelectorAll("[data-config='linkedin']").forEach((el) => el.setAttribute("href", data.linkedin_url || "#"));
}

/* ---------------------------------------------------------
   Categorías
--------------------------------------------------------- */
const categoryIcon = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/>
  </svg>`;

async function loadCategorias() {
  const grid = document.querySelector("[data-grid='categorias']");
  if (!grid) return;

  if (!window.supabaseClient) {
    renderEmptyState(grid, "Conecta Supabase para mostrar las categorías.");
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("categorias")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) {
      renderEmptyState(grid, "Aún no hay categorías registradas.");
      return;
    }

    grid.innerHTML = data
      .map(
        (cat, i) => `
      <a href="catalogo.html?categoria=${encodeURIComponent(cat.slug || cat.id)}" class="category-card reveal" style="transition-delay:${i * 40}ms">
        <span class="category-icon">
          ${cat.imagen_url ? `<img src="${escapeHtml(cat.imagen_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />` : categoryIcon}
        </span>
        <span class="category-name">${escapeHtml(cat.nombre)}</span>
      </a>`
      )
      .join("");
    markObserved(grid);
  } catch (err) {
    console.error("Error cargando categorías:", err);
    renderEmptyState(grid, "No se pudieron cargar las categorías.");
  }
}

/* ---------------------------------------------------------
   Productos destacados
--------------------------------------------------------- */
const productIcon = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/>
  </svg>`;

async function loadProductosDestacados() {
  const grid = document.querySelector("[data-grid='productos']");
  if (!grid) return;

  if (!window.supabaseClient) {
    renderEmptyState(grid, "Conecta Supabase para mostrar los productos destacados.");
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("productos_destacados")
      .select("*")
      .eq("activo", true)
      .eq("destacado", true)
      .order("orden", { ascending: true })
      .limit(8);
    if (error) throw error;

    if (!data || data.length === 0) {
      renderEmptyState(grid, "Aún no hay productos destacados.");
      return;
    }

    grid.innerHTML = data
      .map((p, i) => {
        const hasDiscount = p.precio_descuento && p.precio_descuento < p.precio;
        return `
        <article class="product-card reveal" style="transition-delay:${i * 40}ms">
          <div class="product-media">
            ${hasDiscount ? `<span class="badge-discount">-${Math.round(100 - (p.precio_descuento / p.precio) * 100)}%</span>` : ""}
            ${p.imagen_url ? `<img src="${escapeHtml(p.imagen_url)}" alt="${escapeHtml(p.nombre)}" loading="lazy" />` : productIcon}
          </div>
          <div class="product-body">
            <h3 class="product-name">${escapeHtml(p.nombre)}</h3>
            <div class="price-row">
              <span class="price-current">${formatCurrency(hasDiscount ? p.precio_descuento : p.precio)}</span>
              ${hasDiscount ? `<span class="price-old">${formatCurrency(p.precio)}</span>` : ""}
            </div>
            <a class="btn btn-ghost-navy btn-sm btn-block" href="catalogo.html?producto=${encodeURIComponent(p.slug || p.id)}">Ver producto</a>
          </div>
        </article>`;
      })
      .join("");
    markObserved(grid);
  } catch (err) {
    console.error("Error cargando productos destacados:", err);
    renderEmptyState(grid, "No se pudieron cargar los productos.");
  }
}

/* ---------------------------------------------------------
   Marcas
--------------------------------------------------------- */
async function loadMarcas() {
  const track = document.querySelector("[data-track='marcas']");
  if (!track) return;

  if (!window.supabaseClient) {
    track.innerHTML = `<div class="state-empty">Conecta Supabase para mostrar las marcas.</div>`;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("marcas")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) {
      track.innerHTML = `<div class="state-empty">Aún no hay marcas registradas.</div>`;
      return;
    }

    const chips = data
      .map(
        (m) => `
      <div class="brand-chip">
        ${m.logo_url ? `<img src="${escapeHtml(m.logo_url)}" alt="${escapeHtml(m.nombre)}" loading="lazy" />` : ""}
        <span>${escapeHtml(m.nombre)}</span>
      </div>`
      )
      .join("");

    // Se duplica el contenido para lograr un loop continuo del carrusel
    track.innerHTML = chips + chips;
  } catch (err) {
    console.error("Error cargando marcas:", err);
    track.innerHTML = `<div class="state-empty">No se pudieron cargar las marcas.</div>`;
  }
}

/* ---------------------------------------------------------
   Estado vacío reutilizable
--------------------------------------------------------- */
function renderEmptyState(container, message) {
  container.innerHTML = `<div class="state-empty">${escapeHtml(message)}</div>`;
}

/* ---------------------------------------------------------
   Hero (título, subtítulo, descripción, imagen, botones)
   Editable desde admin.html > Página de Inicio > Hero.
   Si no hay datos en Supabase, se conserva el contenido
   original tal cual está escrito en el HTML.
--------------------------------------------------------- */
async function loadHeroContenido() {
  if (!window.supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from("banners")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return; // no hay banner activo: se deja el contenido original

    if (data.subtitulo) {
      document.getElementById("hero-eyebrow").textContent = data.subtitulo;
    }
    if (data.titulo) {
      // Al editar el título desde el panel se pierde el resaltado de color
      // (solo aplica al texto por defecto), pero el resto del diseño no cambia.
      document.getElementById("hero-title").textContent = data.titulo;
    }
    if (data.descripcion) {
      document.getElementById("hero-description").textContent = data.descripcion;
    }
    if (data.texto_boton) {
      document.getElementById("hero-btn-main").textContent = data.texto_boton;
    }
    if (data.url_boton) {
      document.getElementById("hero-btn-main").setAttribute("href", data.url_boton);
    }
    if (data.texto_boton_whatsapp) {
      document.getElementById("hero-btn-wa").textContent = data.texto_boton_whatsapp;
    }
    if (data.url_boton_whatsapp) {
      // Si el admin definió un link propio de WhatsApp para el hero,
      // este tiene prioridad sobre el general de "configuracion".
      document.getElementById("hero-btn-wa").setAttribute("href", data.url_boton_whatsapp);
    }
    if (data.imagen_url) {
      const media = document.getElementById("hero-visual-media");
      const img = document.createElement("img");
      img.src = data.imagen_url;
      img.alt = data.titulo || "INDUSTRIAL 505";
      img.loading = "lazy";
      media.querySelector("svg")?.replaceWith(img);
    }
  } catch (err) {
    console.error("Error cargando el hero:", err);
    // En caso de error se conserva el contenido original del HTML.
  }
}

/* ---------------------------------------------------------
   Estadísticas del hero ("+500 Productos EPP", etc.)
   Editable desde admin.html > Página de Inicio > Estadísticas.
--------------------------------------------------------- */
async function loadHeroEstadisticas() {
  const list = document.getElementById("hero-stats-list");
  if (!list || !window.supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from("hero_estadisticas")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) return; // se conservan las 3 estadísticas originales

    list.innerHTML = data
      .map(
        (r) => `
      <div>
        <div class="stat-num">${escapeHtml(r.cantidad)}</div>
        <div class="stat-label">${escapeHtml(r.texto)}</div>
      </div>`
      )
      .join("");
  } catch (err) {
    console.error("Error cargando estadísticas del hero:", err);
  }
}

/* ---------------------------------------------------------
   Beneficios ("Por qué elegirnos")
   Editable desde admin.html > Página de Inicio > Beneficios.
--------------------------------------------------------- */
const beneficioIcons = {
  certificado: `<path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>`,
  atencion: `<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="5"/>`,
  entrega: `<path d="M3 7h13v10H3z"/><path d="M16 10h4l2 3v4h-6z"/><circle cx="7.5" cy="19" r="1.6"/><circle cx="17.5" cy="19" r="1.6"/>`,
  calidad: `<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>`,
  escudo: `<path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z"/>`,
};

async function loadBeneficios() {
  const grid = document.getElementById("why-grid-list");
  if (!grid || !window.supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from("beneficios")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) return; // se conservan las 4 tarjetas originales

    grid.innerHTML = data
      .map((r, i) => {
        const icon = beneficioIcons[r.icono] || beneficioIcons.escudo;
        return `
        <div class="why-card reveal" style="transition-delay:${i * 80}ms">
          <div class="why-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
          </div>
          <h3>${escapeHtml(r.titulo)}</h3>
          <p>${escapeHtml(r.descripcion || "")}</p>
        </div>`;
      })
      .join("");
    markObserved(grid);
  } catch (err) {
    console.error("Error cargando beneficios:", err);
  }
}
