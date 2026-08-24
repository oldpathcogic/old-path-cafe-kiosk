const MENU_STORAGE_KEY = "sheBrewsMenu";
const ORDERS_STORAGE_KEY = "sheBrewsOrders";
const SETTINGS_STORAGE_KEY = "sheBrewsSettings";
const EVENT_NAME = "she-brews-update";

const channel = "BroadcastChannel" in window ? new BroadcastChannel("she-brews") : null;

const seedMenu = {
  items: [
    {
      id: "regular-coffee",
      name: "Regular Coffee",
      category: "Coffee",
      description: "Classic drip coffee, hot and fresh",
      price: 4,
      available: true,
      statusLabel: "",
      featured: false,
      displayOrder: 1,
      allowedAddons: ["vanilla", "caramel", "hazelnut", "mocha", "oat-milk", "almond-milk"],
      options: [{ id: "regular", name: "Regular" }, { id: "decaf", name: "Decaf" }],
      showOnKiosk: true,
      showOnMenuBoard: true
    },
    {
      id: "cold-brew",
      name: "Cold Brew",
      category: "Coffee",
      description: "Smooth, bold, and refreshing",
      price: 6,
      available: true,
      statusLabel: "Limited Edition",
      featured: true,
      displayOrder: 2,
      allowedAddons: ["vanilla", "caramel", "hazelnut", "mocha", "oat-milk", "almond-milk"],
      options: [],
      showOnKiosk: true,
      showOnMenuBoard: true
    },
    {
      id: "latte",
      name: "Latte",
      category: "Coffee",
      description: "Hot or iced, creamy and rich",
      price: 6,
      available: true,
      statusLabel: "",
      featured: false,
      displayOrder: 3,
      allowedAddons: ["vanilla", "caramel", "hazelnut", "mocha", "oat-milk", "almond-milk", "extra-shot", "whipped-cream", "decaf-espresso"],
      options: [{ id: "hot", name: "Hot" }, { id: "iced", name: "Iced" }],
      showOnKiosk: true,
      showOnMenuBoard: true
    },
    {
      id: "cappuccino",
      name: "Cappuccino",
      category: "Coffee",
      description: "Foamy, smooth, and full of flavor",
      price: 6,
      available: true,
      statusLabel: "",
      featured: false,
      displayOrder: 4,
      allowedAddons: ["vanilla", "caramel", "hazelnut", "mocha", "oat-milk", "almond-milk", "extra-shot", "decaf-espresso"],
      options: [],
      showOnKiosk: true,
      showOnMenuBoard: true
    },
    {
      id: "espresso-shot",
      name: "Espresso Shot",
      category: "Coffee",
      description: "Strong and rich",
      price: 2.5,
      available: true,
      statusLabel: "",
      featured: false,
      displayOrder: 5,
      allowedAddons: ["decaf-espresso"],
      options: [],
      showOnKiosk: true,
      showOnMenuBoard: true
    },
    {
      id: "donut",
      name: "Donut",
      category: "Pastries",
      description: "Sweet pastry",
      price: 2,
      available: true,
      statusLabel: "",
      featured: false,
      displayOrder: 6,
      allowedAddons: [],
      options: [],
      showOnKiosk: true,
      showOnMenuBoard: true
    },
    {
      id: "croissant",
      name: "Croissant",
      category: "Pastries",
      description: "Buttery, flaky pastry",
      price: 2,
      available: true,
      statusLabel: "",
      featured: false,
      displayOrder: 7,
      allowedAddons: [],
      options: [],
      showOnKiosk: true,
      showOnMenuBoard: true
    }
  ],
  addons: [
    { id: "vanilla", name: "Vanilla Syrup", shortName: "Vanilla", price: 0.75, category: "Flavor Syrup", available: true },
    { id: "caramel", name: "Caramel Syrup", shortName: "Caramel", price: 0.75, category: "Flavor Syrup", available: true },
    { id: "hazelnut", name: "Hazelnut Syrup", shortName: "Hazelnut", price: 0.75, category: "Flavor Syrup", available: true },
    { id: "mocha", name: "Mocha Syrup", shortName: "Mocha", price: 0.75, category: "Flavor Syrup", available: true },
    { id: "oat-milk", name: "Oat Milk", shortName: "Oat Milk", price: 0.75, category: "Milk", available: true },
    { id: "almond-milk", name: "Almond Milk", shortName: "Almond Milk", price: 0.75, category: "Milk", available: true },
    { id: "whipped-cream", name: "Whipped Cream", shortName: "Whip", price: 0.75, category: "Topping", available: true },
    { id: "extra-shot", name: "Extra Espresso Shot", shortName: "Extra Shot", price: 1, category: "Coffee", available: true },
    { id: "decaf-espresso", name: "Decaf Espresso Option", shortName: "Decaf", price: 0.5, category: "Coffee", available: true }
  ],
  updatedAt: new Date().toISOString()
};

const defaultSettings = {
  cafeName: "She Brews",
  subtitle: "Coffee. Connection. Community.",
  footer: "All proceeds support the ministry",
  paymentEnabled: false,
  paymentProvider: "none",
  googleSheetCsvUrl: "",
  menuRotationMs: 9000
};

let state = {
  route: getRoute(),
  menu: readJson(MENU_STORAGE_KEY, seedMenu),
  orders: readJson(ORDERS_STORAGE_KEY, []),
  settings: readJson(SETTINGS_STORAGE_KEY, defaultSettings),
  cart: [],
  customerName: "",
  selectedCategory: "Coffee",
  selectedItem: null,
  selectedOption: "",
  selectedAddons: []
};

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  return `$${Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 2)}`;
}

function getRoute() {
  return (location.hash.replace("#/", "") || "kiosk").split("?")[0];
}

function navigate(route) {
  location.hash = `/${route}`;
}

function emitUpdate() {
  window.dispatchEvent(new Event(EVENT_NAME));
  if (channel) channel.postMessage({ type: EVENT_NAME });
}

function persist() {
  writeJson(MENU_STORAGE_KEY, state.menu);
  writeJson(ORDERS_STORAGE_KEY, state.orders);
  writeJson(SETTINGS_STORAGE_KEY, state.settings);
  emitUpdate();
}

function sortedItems(category, menu = state.menu) {
  return menu.items
    .filter((item) => item.category === category && item.showOnKiosk !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function visibleBoardItems(category) {
  return state.menu.items
    .filter((item) => item.category === category && item.showOnMenuBoard !== false)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function addCartItem() {
  if (!state.selectedItem || !state.selectedItem.available) return;
  const addons = state.menu.addons.filter((addon) => state.selectedAddons.includes(addon.id));
  const total = state.selectedItem.price + addons.reduce((sum, addon) => sum + addon.price, 0);
  state.cart.push({
    lineId: crypto.randomUUID(),
    itemId: state.selectedItem.id,
    name: state.selectedItem.name,
    option: state.selectedOption,
    addons,
    basePrice: state.selectedItem.price,
    total
  });
  state.selectedItem = null;
  state.selectedOption = "";
  state.selectedAddons = [];
  render();
}

function submitOrder() {
  const name = state.customerName.trim();
  if (!name || state.cart.length === 0) return;
  const subtotal = state.cart.reduce((sum, item) => sum + item.total, 0);
  const order = {
    id: `OPC-${Date.now().toString().slice(-6)}`,
    customerName: name,
    items: state.cart,
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtotal,
    tax: 0,
    total: subtotal,
    paymentRequired: state.settings.paymentEnabled,
    paymentStatus: state.settings.paymentEnabled ? "pending" : "not_required",
    paymentProvider: state.settings.paymentEnabled ? state.settings.paymentProvider : "none",
    paymentIntentId: "",
    receiptUrl: ""
  };
  state.orders.unshift(order);
  state.cart = [];
  state.customerName = "";
  persist();
  render();
}

function updateOrderStatus(orderId, status) {
  state.orders = state.orders.map((order) =>
    order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
  );
  persist();
  render();
}

function resetDemoData() {
  state.menu = seedMenu;
  state.orders = [];
  state.settings = defaultSettings;
  state.cart = [];
  persist();
  render();
}

function appShell(content) {
  return `
    <div class="app ${state.route === "menu" ? "menu-mode" : ""}">
      <nav class="top-nav ${state.route === "menu" ? "visually-hidden" : ""}">
        <a class="brand" href="#/kiosk">
          <span class="brand-mark">She Brews</span>
          <span>Church Cafe</span>
        </a>
        <div class="nav-links">
          ${navLink("kiosk", "Kiosk")}
          ${navLink("barista", "Barista")}
          ${navLink("menu", "Menu Board")}
          ${navLink("admin", "Admin")}
        </div>
      </nav>
      ${content}
    </div>
  `;
}

function navLink(route, label) {
  return `<a class="${state.route === route ? "active" : ""}" href="#/${route}">${label}</a>`;
}

function renderKiosk() {
  const items = sortedItems(state.selectedCategory);
  const cartTotal = state.cart.reduce((sum, item) => sum + item.total, 0);
  return appShell(`
    <main class="kiosk-layout">
      <section class="kiosk-panel">
        <div class="kiosk-hero">
          <p class="eyebrow">Welcome to</p>
          <h1>${state.settings.cafeName}</h1>
          <p>${state.settings.subtitle}</p>
        </div>
        <div class="segmented">
          ${["Coffee", "Pastries"].map((category) => `
            <button class="${state.selectedCategory === category ? "selected" : ""}" data-category="${category}">
              ${category}
            </button>
          `).join("")}
        </div>
        <div class="product-grid">
          ${items.map(productCard).join("")}
        </div>
      </section>
      <aside class="order-panel">
        <h2>Your Order</h2>
        <div class="cart-list">
          ${state.cart.length ? state.cart.map(cartRow).join("") : `<p class="empty">Choose an item to start your order.</p>`}
        </div>
        <label class="field">
          <span>Name for the order</span>
          <input id="customerName" value="${escapeHtml(state.customerName)}" placeholder="Enter your name" />
        </label>
        <div class="total-row">
          <span>Total</span>
          <strong>${money(cartTotal)}</strong>
        </div>
        <button class="primary-action" id="submitOrder" ${state.cart.length && state.customerName.trim() ? "" : "disabled"}>
          Send to Barista
        </button>
        <p class="payment-note">
          Payments are ready in the order model, but turned off for launch.
        </p>
      </aside>
      ${state.selectedItem ? itemModal() : ""}
    </main>
  `);
}

function productCard(item) {
  const disabled = !item.available;
  return `
    <button class="product-card ${disabled ? "disabled" : ""}" data-item="${item.id}" ${disabled ? "disabled" : ""}>
      <span class="item-badge ${item.statusLabel ? "" : "hidden"}">${item.statusLabel}</span>
      <span class="product-icon">${item.category === "Coffee" ? "☕" : "◌"}</span>
      <strong>${item.name}</strong>
      <small>${item.description}</small>
      <span class="price">${money(item.price)}</span>
      ${disabled ? `<span class="sold-out">Sold Out</span>` : ""}
    </button>
  `;
}

function cartRow(item) {
  const details = [item.option, ...item.addons.map((addon) => addon.shortName || addon.name)].filter(Boolean);
  return `
    <div class="cart-row">
      <div>
        <strong>${item.name}</strong>
        <small>${details.join(" • ") || "No add-ons"}</small>
      </div>
      <span>${money(item.total)}</span>
      <button class="icon-button" data-remove-line="${item.lineId}" aria-label="Remove ${item.name}">×</button>
    </div>
  `;
}

function itemModal() {
  const item = state.selectedItem;
  const addons = state.menu.addons.filter((addon) => item.allowedAddons.includes(addon.id) && addon.available);
  const selectedAddons = state.menu.addons.filter((addon) => state.selectedAddons.includes(addon.id));
  const total = item.price + selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  return `
    <div class="modal-backdrop">
      <section class="modal">
        <button class="close-button" id="closeModal">×</button>
        <p class="eyebrow">Customize</p>
        <h2>${item.name}</h2>
        <p>${item.description}</p>
        ${item.options.length ? `
          <div class="option-group">
            <h3>Choose one</h3>
            <div class="pill-row">
              ${item.options.map((option) => `
                <button class="pill ${state.selectedOption === option.name ? "selected" : ""}" data-option="${option.name}">
                  ${option.name}
                </button>
              `).join("")}
            </div>
          </div>
        ` : ""}
        ${addons.length ? `
          <div class="option-group">
            <h3>Add-ons</h3>
            <div class="addon-grid">
              ${addons.map((addon) => `
                <button class="addon-chip ${state.selectedAddons.includes(addon.id) ? "selected" : ""}" data-addon="${addon.id}">
                  <span>${addon.shortName || addon.name}</span>
                  <small>+${money(addon.price)}</small>
                </button>
              `).join("")}
            </div>
          </div>
        ` : `<p class="empty">No add-ons for this item.</p>`}
        <div class="modal-footer">
          <strong>${money(total)}</strong>
          <button class="primary-action" id="addCartItem">Add to Order</button>
        </div>
      </section>
    </div>
  `;
}

function renderBarista() {
  const groups = [
    ["new", "New Orders"],
    ["progress", "In Progress"],
    ["ready", "Ready"],
    ["completed", "Completed"]
  ];
  return appShell(`
    <main class="barista-layout">
      <header class="screen-header">
        <div>
          <p class="eyebrow">Fulfillment</p>
          <h1>Barista Board</h1>
        </div>
        <button class="secondary-action" id="clearCompleted">Clear Completed</button>
      </header>
      <section class="kanban">
        ${groups.map(([status, label]) => `
          <article class="order-column ${status}">
            <h2>${label} <span>${state.orders.filter((order) => order.status === status).length}</span></h2>
            <div class="order-stack">
              ${state.orders.filter((order) => order.status === status).map(orderCard).join("") || `<p class="empty">Nothing here.</p>`}
            </div>
          </article>
        `).join("")}
      </section>
    </main>
  `);
}

function orderCard(order) {
  const actions = {
    new: [["progress", "Start"], ["canceled", "Cancel"]],
    progress: [["ready", "Ready"], ["new", "Back"]],
    ready: [["completed", "Complete"], ["progress", "Back"]],
    completed: [["new", "Reopen"]],
    canceled: [["new", "Reopen"]]
  }[order.status] || [];
  return `
    <div class="order-card">
      <div class="order-card-head">
        <strong>${order.customerName}</strong>
        <span>${order.id}</span>
      </div>
      <time>${new Date(order.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
      <ul>
        ${order.items.map((item) => `
          <li>
            <strong>${item.name}</strong>
            <small>${[item.option, ...item.addons.map((addon) => addon.shortName || addon.name)].filter(Boolean).join(" • ")}</small>
          </li>
        `).join("")}
      </ul>
      <div class="order-actions">
        ${actions.map(([status, label]) => `<button data-order-status="${order.id}:${status}">${label}</button>`).join("")}
      </div>
    </div>
  `;
}

function renderMenuBoard() {
  const coffee = visibleBoardItems("Coffee");
  const pastries = visibleBoardItems("Pastries");
  const featured = state.menu.items.find((item) => item.featured && item.available) || coffee[0];
  return `
    <main class="chalkboard">
      <section class="board-frame">
        <header class="board-header">
          <p>Old Path Church Cafe</p>
          <h1>${state.settings.cafeName}</h1>
          <span>${state.settings.subtitle}</span>
        </header>
        <div class="board-content">
          <div class="board-list">
            <h2>Coffee</h2>
            ${coffee.map(boardItem).join("")}
          </div>
          <div class="board-feature">
            <p class="chalk-badge">Limited Edition</p>
            <div class="cup-art">☕</div>
            <h2>${featured ? featured.name : "Fresh Coffee"}</h2>
            <p>${featured ? featured.description : "Made with love, just for you"}</p>
            <strong>${featured ? money(featured.price) : ""}</strong>
          </div>
          <div class="board-list">
            <h2>Pastries</h2>
            ${pastries.map(boardItem).join("")}
            <div class="board-addons">
              <h3>Add-ons</h3>
              ${state.menu.addons.filter((addon) => addon.available).slice(0, 5).map((addon) => `
                <p><span>${addon.shortName || addon.name}</span><b>+${money(addon.price)}</b></p>
              `).join("")}
            </div>
          </div>
        </div>
        <footer>${state.settings.footer}</footer>
      </section>
    </main>
  `;
}

function boardItem(item) {
  return `
    <div class="board-item ${item.available ? "" : "unavailable"}">
      <span>${item.name}</span>
      <b>${item.available ? money(item.price) : "Sold Out"}</b>
    </div>
  `;
}

function renderAdmin() {
  return appShell(`
    <main class="admin-layout">
      <header class="screen-header">
        <div>
          <p class="eyebrow">Setup</p>
          <h1>Menu Admin</h1>
        </div>
        <button class="secondary-action" id="resetDemo">Reset Demo Data</button>
      </header>
      <section class="admin-grid">
        <article class="admin-card">
          <h2>Google Sheet Source</h2>
          <p>Publish the menu tab as CSV, paste the URL here, then sync. Columns should match the README spec.</p>
          <label class="field">
            <span>Published CSV URL</span>
            <input id="sheetUrl" value="${escapeHtml(state.settings.googleSheetCsvUrl)}" placeholder="https://docs.google.com/spreadsheets/.../pub?output=csv" />
          </label>
          <button class="primary-action" id="syncSheet">Sync Menu</button>
          <p class="admin-note" id="syncStatus">Last local update: ${new Date(state.menu.updatedAt).toLocaleString()}</p>
        </article>
        <article class="admin-card">
          <h2>Payment Readiness</h2>
          <label class="toggle-row">
            <span>Enable payment gate</span>
            <input type="checkbox" id="paymentEnabled" ${state.settings.paymentEnabled ? "checked" : ""} />
          </label>
          <label class="field">
            <span>Provider</span>
            <select id="paymentProvider">
              ${["none", "square", "stripe"].map((provider) => `
                <option value="${provider}" ${state.settings.paymentProvider === provider ? "selected" : ""}>${provider}</option>
              `).join("")}
            </select>
          </label>
          <p class="admin-note">The UI blocks are ready, but payment capture is intentionally stubbed until Square or Stripe credentials are added.</p>
        </article>
        <article class="admin-card wide">
          <h2>Availability</h2>
          <div class="item-table">
            ${state.menu.items.map((item) => `
              <div class="item-table-row">
                <strong>${item.name}</strong>
                <span>${item.category}</span>
                <span>${money(item.price)}</span>
                <label>
                  <input type="checkbox" data-availability="${item.id}" ${item.available ? "checked" : ""} />
                  Available
                </label>
                <select data-label="${item.id}">
                  ${["", "New", "Featured", "Limited Edition", "Sold Out", "Seasonal"].map((label) => `
                    <option value="${label}" ${item.statusLabel === label ? "selected" : ""}>${label || "No label"}</option>
                  `).join("")}
                </select>
              </div>
            `).join("")}
          </div>
        </article>
      </section>
    </main>
  `);
}

async function syncSheet() {
  const status = document.querySelector("#syncStatus");
  try {
    const url = state.settings.googleSheetCsvUrl.trim();
    if (!url) throw new Error("Add a published CSV URL first.");
    status.textContent = "Syncing...";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Sheet request failed: ${response.status}`);
    const text = await response.text();
    const parsed = parseMenuCsv(text);
    state.menu = { ...state.menu, items: parsed, updatedAt: new Date().toISOString() };
    persist();
    render();
  } catch (error) {
    status.textContent = error.message;
  }
}

function parseMenuCsv(csv) {
  const rows = parseCsv(csv);
  const [header, ...dataRows] = rows;
  const indexes = Object.fromEntries(header.map((name, index) => [name.trim(), index]));
  return dataRows
    .filter((row) => row[indexes.item_id] && row[indexes.name])
    .map((row) => ({
      id: row[indexes.item_id],
      name: row[indexes.name],
      category: row[indexes.category] || "Coffee",
      description: row[indexes.description] || "",
      price: Number(row[indexes.price] || 0),
      available: parseBool(row[indexes.available]),
      statusLabel: row[indexes.status_label] || "",
      featured: parseBool(row[indexes.featured]),
      displayOrder: Number(row[indexes.display_order] || 99),
      allowedAddons: (row[indexes.allowed_addons] || "").split(",").map((item) => item.trim()).filter(Boolean),
      options: (row[indexes.options] || "").split(",").map((item) => item.trim()).filter(Boolean).map((name) => ({ id: slug(name), name })),
      showOnKiosk: parseBool(row[indexes.show_on_kiosk], true),
      showOnMenuBoard: parseBool(row[indexes.show_on_menu_board], true)
    }));
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  return rows;
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === "") return fallback;
  return ["true", "yes", "1", "available"].includes(String(value).trim().toLowerCase());
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render() {
  state.route = getRoute();
  const app = document.querySelector("#app");
  if (state.route === "barista") app.innerHTML = renderBarista();
  else if (state.route === "menu") app.innerHTML = renderMenuBoard();
  else if (state.route === "admin") app.innerHTML = renderAdmin();
  else app.innerHTML = renderKiosk();
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCategory = button.dataset.category;
      render();
    });
  });

  document.querySelectorAll("[data-item]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.menu.items.find((entry) => entry.id === button.dataset.item);
      state.selectedItem = item;
      state.selectedOption = item.options[0]?.name || "";
      state.selectedAddons = [];
      render();
    });
  });

  document.querySelectorAll("[data-option]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedOption = button.dataset.option;
      render();
    });
  });

  document.querySelectorAll("[data-addon]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.addon;
      state.selectedAddons = state.selectedAddons.includes(id)
        ? state.selectedAddons.filter((addonId) => addonId !== id)
        : [...state.selectedAddons, id];
      render();
    });
  });

  document.querySelectorAll("[data-remove-line]").forEach((button) => {
    button.addEventListener("click", () => {
      state.cart = state.cart.filter((item) => item.lineId !== button.dataset.removeLine);
      render();
    });
  });

  document.querySelectorAll("[data-order-status]").forEach((button) => {
    button.addEventListener("click", () => {
      const [orderId, status] = button.dataset.orderStatus.split(":");
      updateOrderStatus(orderId, status);
    });
  });

  document.querySelectorAll("[data-availability]").forEach((input) => {
    input.addEventListener("change", () => {
      state.menu.items = state.menu.items.map((item) =>
        item.id === input.dataset.availability ? { ...item, available: input.checked } : item
      );
      persist();
      render();
    });
  });

  document.querySelectorAll("[data-label]").forEach((select) => {
    select.addEventListener("change", () => {
      state.menu.items = state.menu.items.map((item) =>
        item.id === select.dataset.label ? { ...item, statusLabel: select.value, featured: select.value === "Featured" } : item
      );
      persist();
      render();
    });
  });

  document.querySelector("#customerName")?.addEventListener("input", (event) => {
    state.customerName = event.target.value;
    render();
  });

  document.querySelector("#submitOrder")?.addEventListener("click", submitOrder);
  document.querySelector("#addCartItem")?.addEventListener("click", addCartItem);
  document.querySelector("#closeModal")?.addEventListener("click", () => {
    state.selectedItem = null;
    render();
  });

  document.querySelector("#clearCompleted")?.addEventListener("click", () => {
    state.orders = state.orders.filter((order) => order.status !== "completed");
    persist();
    render();
  });

  document.querySelector("#resetDemo")?.addEventListener("click", resetDemoData);
  document.querySelector("#syncSheet")?.addEventListener("click", syncSheet);

  document.querySelector("#sheetUrl")?.addEventListener("change", (event) => {
    state.settings.googleSheetCsvUrl = event.target.value;
    persist();
  });

  document.querySelector("#paymentEnabled")?.addEventListener("change", (event) => {
    state.settings.paymentEnabled = event.target.checked;
    persist();
    render();
  });

  document.querySelector("#paymentProvider")?.addEventListener("change", (event) => {
    state.settings.paymentProvider = event.target.value;
    persist();
  });
}

window.addEventListener("hashchange", render);
window.addEventListener(EVENT_NAME, () => {
  state.menu = readJson(MENU_STORAGE_KEY, seedMenu);
  state.orders = readJson(ORDERS_STORAGE_KEY, []);
  state.settings = readJson(SETTINGS_STORAGE_KEY, defaultSettings);
});
if (channel) {
  channel.addEventListener("message", () => {
    state.menu = readJson(MENU_STORAGE_KEY, seedMenu);
    state.orders = readJson(ORDERS_STORAGE_KEY, []);
    state.settings = readJson(SETTINGS_STORAGE_KEY, defaultSettings);
    render();
  });
}

writeJson(MENU_STORAGE_KEY, state.menu);
writeJson(SETTINGS_STORAGE_KEY, state.settings);
render();
