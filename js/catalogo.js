/* =========================================================
   INDUSTRIAL 505 — catalogo.js
   Catálogo dinámico conectado a Supabase (tabla "productos").
   Inicia vacío hasta que se carguen productos desde el panel.
   ========================================================= */

const PAGE_SIZE = 8;
const CART_KEY = "industrial505_cart";

let allProducts = [];   // catálogo completo tal como viene de Supabase
let filtered = [];      // resultado tras aplicar búsqueda + filtros
let currentPage = 1;
let activeBrandFilter = null;
let sortMode = "orden";
let searchTerm = "";

document.addEventListener("DOMContentLoaded", () => {
  initHeaderScroll();
  initMobileNav();
  initRevealOnScroll();
  loadConfiguracion();

  initSearch();
  initSortSelect();
  initClearFilters();
  initCartUI();
  initModalClose();
  initFichaLightbox();

  loadProductos();
  renderCartBadge();
});

/* ---------------------------------------------------------
   Reutilizados del sitio (header, nav móvil, reveal, config)
--------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

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

function initRevealOnScroll() {
  const targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || targets.length === 0) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.1 });
  targets.forEach((el) => observer.observe(el));
}

async function loadConfiguracion() {
  const fallback = { whatsapp: "50588888888", correo: "contacto@industrial505.com", facebook_url: "#", instagram_url: "#", linkedin_url: "#" };
  let data = fallback;
  if (window.supabaseClient) {
    try {
      const { data: rows, error } = await supabaseClient.from("configuracion").select("clave, valor");
      if (error) throw error;
      if (rows?.length) { data = { ...fallback }; rows.forEach((r) => (data[r.clave] = r.valor)); }
    } catch (err) { console.error(err); }
  }
  const waNumber = (data.whatsapp || "").replace(/\D/g, "");
  window.WA_NUMBER = waNumber;
  document.querySelectorAll("[data-config='whatsapp-link']").forEach((el) =>
    el.setAttribute("href", `https://wa.me/${waNumber}?text=${encodeURIComponent("Hola INDUSTRIAL 505, quisiera más información.")}`)
  );
  document.querySelectorAll("[data-config='facebook']").forEach((el) => el.setAttribute("href", data.facebook_url || "#"));
  document.querySelectorAll("[data-config='instagram']").forEach((el) => el.setAttribute("href", data.instagram_url || "#"));
  document.querySelectorAll("[data-config='linkedin']").forEach((el) => el.setAttribute("href", data.linkedin_url || "#"));
  document.getElementById("year") && (document.getElementById("year").textContent = new Date().getFullYear());
}

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}
function formatCurrency(value) {
  if (value === null || value === undefined) return "";
  return "C$ " + new Intl.NumberFormat("es-NI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
function showToast(message) {
  const toast = document.getElementById("catalog-toast");
  if (!toast) return;
  toast.querySelector(".toast-text").textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

const placeholderIcon = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/>
  </svg>`;

/* =========================================================
   CARGA DE PRODUCTOS
   ========================================================= */
async function loadProductos() {
  const grid = document.getElementById("catalog-grid");
  const params = new URLSearchParams(window.location.search);
  const productoParam = params.get("producto");

  if (!window.supabaseClient) {
    renderEmpty(grid, "Conecta Supabase para mostrar el catálogo.", "Configura js/supabase-config.js con tu proyecto.");
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("productos")
      .select("*, marcas(nombre), categorias(nombre, slug)")
      .eq("activo", true)
      .order("orden", { ascending: true });
    if (error) throw error;

    allProducts = data || [];
    buildBrandFilters(allProducts);
    applyFiltersAndRender();

    if (productoParam) {
      const p = allProducts.find((prod) => prod.slug === productoParam || prod.id === productoParam);
      if (p) openFichaTecnica(p);
    }
  } catch (err) {
    console.error("Error cargando productos:", err);
    renderEmpty(grid, "No se pudo cargar el catálogo.", "Intenta recargar la página en unos segundos.");
  }
}

function buildBrandFilters(products) {
  const wrap = document.getElementById("brand-filters");
  if (!wrap) return;
  const marcas = [...new Map(products.filter((p) => p.marcas?.nombre).map((p) => [p.marcas.nombre, p.marca_id])).entries()];

  if (!marcas.length) {
    wrap.innerHTML = "";
    return;
  }
  wrap.innerHTML = marcas
    .map(([nombre, id]) => `<button class="filter-chip" data-brand="${id}" type="button">${escapeHtml(nombre)}</button>`)
    .join("");
  wrap.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const isActive = chip.classList.contains("is-active");
      wrap.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("is-active"));
      activeBrandFilter = isActive ? null : chip.dataset.brand;
      if (!isActive) chip.classList.add("is-active");
      currentPage = 1;
      applyFiltersAndRender();
    });
  });
}

/* =========================================================
   FILTROS + ORDEN + BÚSQUEDA
   ========================================================= */
function initSortSelect() {
  const select = document.getElementById("sort-select");
  select?.addEventListener("change", () => {
    sortMode = select.value;
    currentPage = 1;
    applyFiltersAndRender();
  });
}

function initClearFilters() {
  document.getElementById("clear-filters")?.addEventListener("click", () => {
    searchTerm = "";
    activeBrandFilter = null;
    sortMode = "orden";
    document.getElementById("catalog-search").value = "";
    document.getElementById("sort-select").value = "orden";
    document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("is-active"));
    currentPage = 1;
    applyFiltersAndRender();
  });
}

function applyFiltersAndRender() {
  filtered = allProducts.filter((p) => {
    const matchesSearch = !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = !activeBrandFilter || p.marca_id === activeBrandFilter;
    return matchesSearch && matchesBrand;
  });

  if (sortMode === "precio-asc") {
    filtered.sort((a, b) => (a.precio_descuento ?? a.precio) - (b.precio_descuento ?? b.precio));
  } else if (sortMode === "precio-desc") {
    filtered.sort((a, b) => (b.precio_descuento ?? b.precio) - (a.precio_descuento ?? a.precio));
  } else {
    filtered.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  }

  renderMeta();
  renderPage();
}

function renderMeta() {
  const meta = document.getElementById("filters-meta");
  if (!meta) return;
  if (allProducts.length === 0) { meta.textContent = ""; return; }
  meta.textContent = `${filtered.length} producto${filtered.length === 1 ? "" : "s"} encontrado${filtered.length === 1 ? "" : "s"}`;
}

/* =========================================================
   PAGINACIÓN Y RENDER DE TARJETAS
   ========================================================= */
function renderPage() {
  const grid = document.getElementById("catalog-grid");
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);

  if (allProducts.length === 0) {
    renderEmpty(
      grid,
      "El catálogo aún no tiene productos.",
      "Muy pronto encontrarás aquí todo el equipo de protección. Mientras tanto, contáctanos por WhatsApp para cotizar."
    );
    renderPagination(0);
    return;
  }

  if (filtered.length === 0) {
    renderEmpty(grid, "No encontramos productos con esos filtros.", "Prueba con otro término de búsqueda o quita algún filtro.");
    renderPagination(0);
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  grid.innerHTML = pageItems.map((p, i) => productCardHtml(p, i)).join("");
  markObserved(grid);
  bindCardActions(grid);
  renderPagination(totalPages);
}

function renderEmpty(grid, title, desc) {
  grid.innerHTML = `
    <div class="catalog-empty">
      <span class="catalog-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></svg>
      </span>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(desc)}</p>
    </div>`;
  const meta = document.getElementById("filters-meta");
  if (meta) meta.textContent = "";
}

function renderPagination(totalPages) {
  const wrap = document.getElementById("pagination");
  if (!wrap) return;
  if (totalPages <= 1) { wrap.innerHTML = ""; return; }

  let html = `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Página anterior">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6"/></svg>
  </button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      html += `<button class="page-btn ${i === currentPage ? "is-active" : ""}" data-page="${i}">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 2) {
      html += `<span class="page-dots">…</span>`;
    }
  }

  html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="Página siguiente">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>
  </button>`;

  wrap.innerHTML = html;
  wrap.querySelectorAll(".page-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.page);
      renderPage();
      document.getElementById("catalog-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function markObserved(container) {
  const targets = container.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { targets.forEach((el) => el.classList.add("is-visible")); return; }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } });
  }, { threshold: 0.1 });
  targets.forEach((el) => observer.observe(el));
}

/* ---------- Tarjeta de producto ---------- */
function productCardHtml(p, i) {
  const hasDiscount = p.precio_descuento && p.precio_descuento < p.precio;
  const disponible = p.disponible && (p.stock === null || p.stock === undefined || p.stock > 0);
  return `
  <article class="catalog-card reveal" style="transition-delay:${i * 30}ms" data-id="${p.id}">
    <div class="catalog-card-media">
      ${disponible
        ? `<span class="stock-badge available">Disponible</span>`
        : `<span class="stock-badge out">Agotado</span>`}
      ${hasDiscount ? `<span class="discount-badge">-${Math.round(100 - (p.precio_descuento / p.precio) * 100)}%</span>` : ""}
      ${p.imagen_url ? `<img src="${escapeHtml(p.imagen_url)}" alt="${escapeHtml(p.nombre)}" loading="lazy" />` : placeholderIcon}
    </div>
    <div class="catalog-card-body">
      ${p.marcas?.nombre ? `<span class="catalog-card-brand">${escapeHtml(p.marcas.nombre)}</span>` : ""}
      <h3 class="catalog-card-name">${escapeHtml(p.nombre)}</h3>
      <div class="catalog-price-row">
        <span class="catalog-price-current">${formatCurrency(hasDiscount ? p.precio_descuento : p.precio)}</span>
        ${hasDiscount ? `<span class="catalog-price-old">${formatCurrency(p.precio)}</span>` : ""}
        ${p.mostrar_iva ? `<span class="price-iva-tag">+IVA</span>` : ""}
      </div>
      <div class="catalog-card-actions">
        <button class="btn btn-primary btn-sm ${disponible ? "" : "is-disabled"}" data-action="add-cart" ${disponible ? "" : "disabled"}>
          Añadir al carrito
        </button>
        <div class="btn-icon-row">
          <a class="btn btn-whatsapp btn-sm" data-action="quote-wa" href="#" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 15.5c-1.2 0-2.4-.2-3.5-.6a1 1 0 0 0-1 .2l-1.6 1.6a14.6 14.6 0 0 1-6.6-6.6l1.6-1.6a1 1 0 0 0 .2-1A11 11 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1Z"/></svg>
            Cotizar
          </a>
          <button class="btn btn-ghost-navy btn-sm" data-action="ver-ficha">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6l3 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/><path d="M9 12h6M9 16h4"/></svg>
            Ficha
          </button>
        </div>
      </div>
    </div>
  </article>`;
}

function bindCardActions(grid) {
  grid.querySelectorAll(".catalog-card").forEach((card) => {
    const id = card.dataset.id;
    const product = filtered.find((p) => p.id === id) || allProducts.find((p) => p.id === id);
    if (!product) return;

    card.querySelector("[data-action='add-cart']")?.addEventListener("click", () => addToCart(product));
    card.querySelector("[data-action='ver-ficha']")?.addEventListener("click", () => openFichaTecnica(product));

    const waBtn = card.querySelector("[data-action='quote-wa']");
    if (waBtn) {
      waBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const msg = `Hola INDUSTRIAL 505, quisiera cotizar: *${product.nombre}* (${formatCurrency(product.precio_descuento || product.precio)}).`;
        guardarCotizacion([{ id: product.id, nombre: product.nombre, precio: product.precio_descuento || product.precio, qty: 1 }], product.precio_descuento || product.precio);
        window.open(`https://wa.me/${window.WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
      });
    }
  });
}

/* =========================================================
   BUSCADOR CON SUGERENCIAS
   ========================================================= */
function initSearch() {
  const input = document.getElementById("catalog-search");
  const suggestions = document.getElementById("search-suggestions");
  const clearBtn = document.getElementById("search-clear");
  if (!input) return;

  let activeIndex = -1;

  const renderSuggestions = (term) => {
    if (!term) { suggestions.classList.remove("is-visible"); suggestions.innerHTML = ""; return; }

    const lower = term.toLowerCase();
    const starts = allProducts.filter((p) => p.nombre.toLowerCase().startsWith(lower));
    const contains = allProducts.filter((p) => !p.nombre.toLowerCase().startsWith(lower) && p.nombre.toLowerCase().includes(lower));
    const brandMatch = allProducts.filter((p) => p.marcas?.nombre?.toLowerCase().includes(lower) && !starts.includes(p) && !contains.includes(p));
    const results = [...starts, ...contains, ...brandMatch].slice(0, 6);

    if (!results.length) {
      suggestions.innerHTML = `<div class="suggestion-empty">Sin coincidencias para "${escapeHtml(term)}"</div>`;
    } else {
      suggestions.innerHTML = results
        .map(
          (p, i) => `
        <button class="suggestion-item" type="button" data-id="${p.id}" data-index="${i}">
          <span class="suggestion-thumb">${p.imagen_url ? `<img src="${escapeHtml(p.imagen_url)}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:7px;" />` : placeholderIcon}</span>
          <span class="suggestion-text">
            <span class="name">${escapeHtml(p.nombre)}</span>
            <span class="meta">${escapeHtml(p.marcas?.nombre || "")}</span>
          </span>
          <span class="suggestion-price">${formatCurrency(p.precio_descuento || p.precio)}</span>
        </button>`
        )
        .join("");

      suggestions.querySelectorAll(".suggestion-item").forEach((item) => {
        item.addEventListener("click", () => {
          const product = allProducts.find((p) => p.id === item.dataset.id);
          input.value = product.nombre;
          searchTerm = product.nombre;
          suggestions.classList.remove("is-visible");
          currentPage = 1;
          applyFiltersAndRender();
          openFichaTecnica(product);
        });
      });
    }
    suggestions.classList.add("is-visible");
    activeIndex = -1;
  };

  input.addEventListener("input", () => {
    const term = input.value.trim();
    clearBtn.classList.toggle("is-visible", term.length > 0);
    searchTerm = term;
    currentPage = 1;
    applyFiltersAndRender();
    renderSuggestions(term);
  });

  input.addEventListener("keydown", (e) => {
    const items = [...suggestions.querySelectorAll(".suggestion-item")];
    if (!items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); updateActive(items, activeIndex); }
    if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); updateActive(items, activeIndex); }
    if (e.key === "Enter" && activeIndex >= 0) { e.preventDefault(); items[activeIndex].click(); }
    if (e.key === "Escape") { suggestions.classList.remove("is-visible"); }
  });

  function updateActive(items, idx) {
    items.forEach((it, i) => it.classList.toggle("is-active", i === idx));
    items[idx]?.scrollIntoView({ block: "nearest" });
  }

  clearBtn.addEventListener("click", () => {
    input.value = "";
    searchTerm = "";
    clearBtn.classList.remove("is-visible");
    suggestions.classList.remove("is-visible");
    currentPage = 1;
    applyFiltersAndRender();
    input.focus();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) suggestions.classList.remove("is-visible");
  });
}

/* =========================================================
   FICHA TÉCNICA (MODAL)
   ========================================================= */
function openFichaTecnica(p) {
  const overlay = document.getElementById("modal-overlay");
  const box = document.getElementById("modal-box");
  const hasDiscount = p.precio_descuento && p.precio_descuento < p.precio;
  const disponible = p.disponible && (p.stock === null || p.stock === undefined || p.stock > 0);

  box.innerHTML = `
    <div class="modal-panel-head">
      <span class="eyebrow">Ficha técnica</span>
      <button class="modal-close-btn" id="modal-close" aria-label="Cerrar" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>
      </button>
    </div>
    <div class="sheet-modal-body">
      <div class="sheet-media">
        ${p.imagen_url ? `<img src="${escapeHtml(p.imagen_url)}" alt="${escapeHtml(p.nombre)}" />` : placeholderIcon}
      </div>
      <div class="sheet-info">
        ${p.marcas?.nombre ? `<span class="brand">${escapeHtml(p.marcas.nombre)}</span>` : ""}
        <h3>${escapeHtml(p.nombre)}</h3>
        <div class="price">
          ${formatCurrency(hasDiscount ? p.precio_descuento : p.precio)}
          ${hasDiscount ? `<span class="catalog-price-old" style="margin-left:8px;">${formatCurrency(p.precio)}</span>` : ""}
          ${p.mostrar_iva ? `<span class="price-iva-tag" style="margin-left:8px;">+IVA</span>` : ""}
        </div>
        <span class="stock-badge ${disponible ? "available" : "out"}" style="position:static; display:inline-flex; margin-top:8px;">${disponible ? "Disponible" : "Agotado"}</span>
        ${p.descripcion ? `<p class="desc">${escapeHtml(p.descripcion)}</p>` : ""}
        ${p.especificaciones ? `<div class="specs">${escapeHtml(p.especificaciones)}</div>` : ""}
        <div class="sheet-actions">
          <button class="btn btn-primary" id="sheet-add-cart" ${disponible ? "" : "disabled"}>Añadir al carrito</button>
          <a class="btn btn-whatsapp" id="sheet-quote-wa" href="#" target="_blank" rel="noopener">Cotizar por WhatsApp</a>
          ${p.ficha_tecnica_url ? `<button class="btn btn-ghost-navy" id="sheet-view-ficha" type="button">Ver ficha técnica</button>` : ""}
        </div>
      </div>
    </div>
  `;

  overlay.classList.add("is-visible");
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("sheet-add-cart")?.addEventListener("click", () => addToCart(p));
  document.getElementById("sheet-quote-wa")?.addEventListener("click", (e) => {
    e.preventDefault();
    const msg = `Hola INDUSTRIAL 505, quisiera cotizar: *${p.nombre}* (${formatCurrency(p.precio_descuento || p.precio)}).`;
    guardarCotizacion([{ id: p.id, nombre: p.nombre, precio: p.precio_descuento || p.precio, qty: 1 }], p.precio_descuento || p.precio);
    window.open(`https://wa.me/${window.WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  });
  // FIX #3: la ficha técnica ahora se muestra como imagen en un visor propio,
  // en vez de forzar la descarga de un PDF.
  document.getElementById("sheet-view-ficha")?.addEventListener("click", () => {
    openFichaLightbox(p.ficha_tecnica_url, p.nombre);
  });
}

function initModalClose() {
  const overlay = document.getElementById("modal-overlay");
  overlay?.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}
function closeModal() { document.getElementById("modal-overlay")?.classList.remove("is-visible"); }

/* =========================================================
   LIGHTBOX DE IMAGEN — FICHA TÉCNICA
   ========================================================= */
function initFichaLightbox() {
  const overlay = document.getElementById("ficha-lightbox");
  const closeBtn = document.getElementById("ficha-lightbox-close");
  if (!overlay) return;
  closeBtn?.addEventListener("click", closeFichaLightbox);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeFichaLightbox(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeFichaLightbox(); });
}

function openFichaLightbox(url, nombre) {
  if (!url) return;
  const overlay = document.getElementById("ficha-lightbox");
  const img = document.getElementById("ficha-lightbox-img");
  if (!overlay || !img) return;
  img.src = url;
  img.alt = nombre ? `Ficha técnica — ${nombre}` : "Ficha técnica";
  overlay.classList.add("is-visible");
}

function closeFichaLightbox() {
  document.getElementById("ficha-lightbox")?.classList.remove("is-visible");
}

/* =========================================================
   CARRITO (persistido en localStorage del navegador)
   ========================================================= */
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCartBadge();
  renderCartPanel();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === product.id);
  if (existing) existing.qty += 1;
  else {
    cart.push({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio_descuento || product.precio,
      imagen_url: product.imagen_url || "",
      qty: 1,
    });
  }
  setCart(cart);
  showToast(`${product.nombre} añadido al carrito.`);
}

function updateQty(id, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  const next = item.qty <= 0 ? cart.filter((i) => i.id !== id) : cart;
  setCart(next);
}

function removeFromCart(id) {
  setCart(getCart().filter((i) => i.id !== id));
}

function cartTotal(cart) {
  return cart.reduce((sum, i) => sum + i.precio * i.qty, 0);
}

function renderCartBadge() {
  const badge = document.getElementById("cart-badge");
  const count = getCart().reduce((sum, i) => sum + i.qty, 0);
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

function renderCartPanel() {
  const itemsWrap = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  if (!itemsWrap) return;

  const cart = getCart();
  if (!cart.length) {
    itemsWrap.innerHTML = `
      <div class="cart-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.5 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22.5 7H6"/></svg>
        <p>Tu carrito está vacío.<br>Agrega productos del catálogo para cotizar.</p>
      </div>`;
    totalEl.textContent = formatCurrency(0);
    return;
  }

  itemsWrap.innerHTML = cart
    .map(
      (i) => `
    <div class="cart-item" data-id="${i.id}">
      <span class="cart-item-media">${i.imagen_url ? `<img src="${escapeHtml(i.imagen_url)}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:8px;" />` : placeholderIcon}</span>
      <div class="cart-item-body">
        <div class="cart-item-name">${escapeHtml(i.nombre)}</div>
        <div class="cart-item-price">${formatCurrency(i.precio)}</div>
        <div class="qty-row">
          <button class="qty-btn" data-action="dec">−</button>
          <span class="qty-value">${i.qty}</span>
          <button class="qty-btn" data-action="inc">+</button>
          <button class="cart-item-remove" data-action="remove" aria-label="Quitar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>
    </div>`
    )
    .join("");

  itemsWrap.querySelectorAll(".cart-item").forEach((row) => {
    const id = row.dataset.id;
    row.querySelector("[data-action='inc']").addEventListener("click", () => updateQty(id, 1));
    row.querySelector("[data-action='dec']").addEventListener("click", () => updateQty(id, -1));
    row.querySelector("[data-action='remove']").addEventListener("click", () => removeFromCart(id));
  });

  totalEl.textContent = formatCurrency(cartTotal(cart));
}

function initCartUI() {
  const floatBtn = document.getElementById("cart-float");
  const overlay = document.getElementById("cart-overlay");
  const panel = document.getElementById("cart-panel");
  const closeBtn = document.getElementById("cart-close");
  const waBtn = document.getElementById("cart-checkout-wa");

  const open = () => { renderCartPanel(); overlay.classList.add("is-visible"); panel.classList.add("is-open"); };
  const close = () => { overlay.classList.remove("is-visible"); panel.classList.remove("is-open"); };

  floatBtn?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  overlay?.addEventListener("click", close);

  waBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    const cart = getCart();
    if (!cart.length) { showToast("Tu carrito está vacío."); return; }
    const lines = cart.map((i) => `• ${i.nombre} x${i.qty} — ${formatCurrency(i.precio * i.qty)}`).join("\n");
    const msg = `Hola INDUSTRIAL 505, quisiera cotizar los siguientes productos:\n\n${lines}\n\nTotal aproximado: ${formatCurrency(cartTotal(cart))}`;
    guardarCotizacion(cart, cartTotal(cart));
    window.open(`https://wa.me/${window.WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  });

  renderCartPanel();
}

/* ---------------------------------------------------------
   Registro de cotizaciones (para el módulo "Cotizaciones" del
   panel admin). Es de "mejor esfuerzo": si falla el guardado,
   el mensaje de WhatsApp se envía igual, nunca se bloquea al
   cliente por un error de conexión con Supabase.
--------------------------------------------------------- */
async function guardarCotizacion(items, total) {
  if (!window.supabaseClient) return;
  try {
    await window.supabaseClient.from("cotizaciones").insert({
      items: items.map((i) => ({ id: i.id, nombre: i.nombre, precio: i.precio, qty: i.qty })),
      total,
      origen: "catalogo",
    });
  } catch (err) {
    console.warn("No se pudo registrar la cotización (no afecta el envío por WhatsApp):", err);
  }
}
