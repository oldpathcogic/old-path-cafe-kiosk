import assert from "node:assert/strict";
import test from "node:test";

test("build contains every Old Path Cafe screen and metadata", async () => {
  const fs = await import("node:fs/promises");
  const layout = await fs.readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /title: "Old Path Cafe"/);
  assert.doesNotMatch(layout, /codex-preview/);
  for (const path of ["../app/page.tsx", "../app/staff/barista/page.tsx", "../app/staff/display/page.tsx", "../app/staff/admin/page.tsx", "../app/track/page.tsx"]) {
    const source = await fs.readFile(new URL(path, import.meta.url), "utf8");
    assert.match(source, /CafeApp/);
  }
});

test("built worker exposes the cafe API routes", async () => {
  const source = await import("node:fs/promises").then(fs => fs.readFile(new URL("../dist/server/index.js", import.meta.url), "utf8"));
  for (const route of ["/api/menu", "/api/orders", "/api/admin/menu", "/api/admin/inventory", "/api/admin/session", "/api/staff/session", "/api/admin/ledger", "/api/admin/orders", "/api/ledger-feed", "/api/track", "/api/pickup"]) assert.match(source, new RegExp(route.replaceAll("/", "\\/")));
});

test("customer navigation is separate from protected staff views", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  assert.match(component, /staff\?<><Link href="\/">Customer View/);
  assert.match(component, /Administrator Sign In/);
  assert.match(component, /Barista Sign In/);
  assert.match(component, /Menu Display Sign In/);
  assert.match(component, /href="\/staff\/display"/);
  assert.doesNotMatch(component, /<span className="brand-mark"/);
  assert.doesNotMatch(component, /Google Sheet Sync/);
  assert.doesNotMatch(component, /Open Google Sheet/);
});

test("the automatic ledger feed is token protected and shares the canonical CSV builder", async () => {
  const fs = await import("node:fs/promises");
  const feed = await fs.readFile(new URL("../app/api/ledger-feed/route.ts", import.meta.url), "utf8");
  const adminExport = await fs.readFile(new URL("../app/api/admin/orders/route.ts", import.meta.url), "utf8");
  assert.match(feed, /LEDGER_FEED_TOKEN/);
  assert.match(feed, /buildLedgerCsv/);
  assert.match(adminExport, /buildLedgerCsv/);
});

test("ledger timestamps use Pacific time for historical and future imports", async () => {
  const fs = await import("node:fs/promises");
  const ledger = await fs.readFile(new URL("../lib/ledger.ts", import.meta.url), "utf8");
  assert.match(ledger, /timeZone:"America\/Los_Angeles"/);
  assert.match(ledger, /Order Time \(Pacific\)/);
  assert.match(ledger, /pacificTimestamp\(row\.created_at\)/);
  assert.doesNotMatch(ledger, /timestamp\.slice\(11,16\)/);
});

test("customer-ready notifications are wired through the kiosk, tracker, and menu board", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const ordersRoute = await fs.readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8");
  assert.match(component, /Notify me when it’s ready/);
  assert.match(component, /Order Status/);
  for (const label of ["Received", "Making", "Ready"]) assert.match(component, new RegExp(label));
  assert.match(ordersRoute, /trackingToken/);
  assert.match(ordersRoute, /pickupCode/);
});

test("television menu includes a scannable customer-order entry point", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  assert.match(component, /https:\/\/old-path-cafe\.oldpathcogic\.chatgpt\.site\//);
  assert.match(component, /chalk-qr-image/);
  assert.match(component, /Scan to Order/);
  assert.doesNotMatch(component, /\} available<\/span>/);
  await fs.access(new URL("../public/order-qr.png", import.meta.url));
});

test("item quantities flow through the kiosk, barista board, database, and ledger", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const ordersRoute = await fs.readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8");
  const ledgerBuilder = await fs.readFile(new URL("../lib/ledger.ts", import.meta.url), "utf8");
  const migration = await fs.readFile(new URL("../drizzle/0002_luxuriant_karen_page.sql", import.meta.url), "utf8");
  assert.match(component, /Quantity/);
  assert.match(component, /line\.quantity/);
  assert.match(ordersRoute, /quantity<1\|\|quantity>20/);
  assert.match(ledgerBuilder, /SUM\(oi\.quantity\)/);
  assert.match(migration, /ADD `quantity`/);
});

test("menu item images are rendered and configurable through the menu sheet", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const store = await fs.readFile(new URL("../lib/store.ts", import.meta.url), "utf8");
  const template = await fs.readFile(new URL("../public/menu-template.csv", import.meta.url), "utf8");
  assert.match(component, /MenuItemImage/);
  assert.match(component, /product-image/);
  assert.match(store, /image_url/);
  assert.match(template, /image_url/);
  for (const slug of ["regular-coffee","cold-brew","latte","cappuccino","espresso-shot","tea","hot-chocolate","donut","croissant"]) {
    await fs.access(new URL(`../public/menu-images/${slug}.webp`, import.meta.url));
  }
});

test("admin inventory supports typed quantities and the current catalog", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const store = await fs.readFile(new URL("../lib/store.ts", import.meta.url), "utf8");
  const menuTemplate = await fs.readFile(new URL("../public/menu-template.csv", import.meta.url), "utf8");
  const addonTemplate = await fs.readFile(new URL("../public/addons-template.csv", import.meta.url), "utf8");
  assert.match(component, /function StockField/);
  assert.match(component, /type="number" inputMode="numeric"/);
  assert.match(component, /event\.key==="Enter"/);
  assert.match(store, /name:"Tea"[\s\S]*?priceCents:400/);
  assert.match(store, /name:"Hot Chocolate"[\s\S]*?priceCents:400/);
  assert.match(store, /id:"cold-foam",name:"Cold Foam"[\s\S]*?priceCents:75/);
  assert.doesNotMatch(menuTemplate, /whipped-cream/i);
  assert.doesNotMatch(addonTemplate, /Whipped Cream/i);
});

test("menu display labels can be changed from the admin inventory", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const inventoryRoute = await fs.readFile(new URL("../app/api/admin/inventory/route.ts", import.meta.url), "utf8");
  assert.match(component, /<option value="">No Label<\/option>/);
  for (const label of ["Limited Edition", "New", "Featured", "Seasonal"]) assert.match(component, new RegExp(`<option>${label}<\\/option>`));
  assert.match(component, /statusLabel:event\.target\.value/);
  assert.match(inventoryRoute, /status_label=\?/);
  assert.match(inventoryRoute, /allowedStatusLabels/);
});

test("customer and staff surfaces keep distinct readable visual systems", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const styles = await fs.readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(component, /staff-topbar/);
  assert.match(component, /chalk-board/);
  assert.match(component, /chalk-leader/);
  assert.match(styles, /\.product \{[^}]*background:var\(--green\)/s);
  assert.match(styles, /\.chalk-logo \{[^}]*font-family:"Cabin Sketch"/s);
  assert.match(styles, /\.chalk-tag \{[^}]*font-family:"Patrick Hand"/s);
  assert.match(styles, /\.chalk-board \{[^}]*aspect-ratio:16\/9/s);
  assert.match(styles, /\.chalk-board \{[^}]*container-type:inline-size/s);
  assert.match(styles, /\.chalk-board \{[^}]*width:min\(calc\(100vw - 14px\),calc\(177\.7778svh - 24\.8889px\)\)/s);
  assert.doesNotMatch(styles, /@media\(orientation:portrait\)[\s\S]*?\.chalk-board[^}]*aspect-ratio:auto/);
  assert.match(styles, /\.chalk-board \{[^}]*border:[^;]*solid #715039[^}]*background:[^}]*#1d2723/s);
  assert.match(styles, /\.chalk-board::before,\.chalk-board::after \{[^}]*content:"❦"/s);
  assert.match(styles, /\.board-page \{[^}]*font-family:"Inter"/s);
  assert.match(styles, /\.admin-page \{[^}]*font-family:"Inter"/s);
});

test("phone ordering layout stays compact without sacrificing touch targets", async () => {
  const fs = await import("node:fs/promises");
  const styles = await fs.readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /@media\(max-width:780px\)[\s\S]*?\.product-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:8px\}/);
  assert.match(styles, /@media\(max-width:780px\)[\s\S]*?\.category-tab\{[^}]*min-height:42px/);
  assert.match(styles, /@media\(max-width:460px\)[\s\S]*?\.product-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:6px\}/);
  assert.doesNotMatch(styles, /@media\(max-width:460px\)[\s\S]*?\.product-grid\{grid-template-columns:1fr\}/);
});

test("mobile checkout makes the final step obvious without slowing menu selection", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const styles = await fs.readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(component, /Review & Place Order/);
  assert.match(component, /Last step/);
  assert.match(component, /Enter your name, then send the order to the barista/);
  assert.match(component, /Place Order — Send to Barista/);
  assert.match(component, /cart\.length>0&&!selected/);
  assert.match(component, /autoFocus/);
  assert.match(styles, /\.mobile-checkout-bar \{ display:none; \}/);
  assert.match(styles, /@media\(max-width:780px\)[\s\S]*?\.cart-pane\{display:none\}/);
  assert.match(styles, /@media\(max-width:780px\)[\s\S]*?\.mobile-checkout-bar\{position:fixed/);
});

test("baristas can safely cancel orders and restore quantity-aware inventory", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const orderRoute = await fs.readFile(new URL("../app/api/orders/[id]/route.ts", import.meta.url), "utf8");
  assert.match(component, /window\.confirm/);
  assert.match(component, /Are you sure you want to cancel/);
  assert.match(component, /Cancel Order/);
  assert.match(orderRoute, /payload\.status==="canceled"/);
  assert.match(orderRoute, /quantity\*Math\.max\(1,Number\(addon\.quantity\|\|1\)\)/);
});

test("dairy milk and quantity-aware sweeteners flow through catalog and orders", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const store = await fs.readFile(new URL("../lib/store.ts", import.meta.url), "utf8");
  const orderRoute = await fs.readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8");
  const addonTemplate = await fs.readFile(new URL("../public/addons-template.csv", import.meta.url), "utf8");
  for (const id of ["dairy-milk", "honey", "sugar"]) {
    assert.match(store, new RegExp(`id:"${id}"`));
    assert.match(addonTemplate, new RegExp(id));
  }
  assert.match(component, /Sugar quantity/);
  assert.match(component, /Math\.min\(5/);
  assert.match(orderRoute, /Sugar quantity must be between 1 and 5/);
  assert.match(orderRoute, /selection\.quantity\*quantity/);
});

test("television menu is locked to a centered 16 by 9 canvas", async () => {
  const fs = await import("node:fs/promises");
  const styles = await fs.readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(styles, /\.chalk-board \{[^}]*container-type:inline-size/s);
  assert.match(styles, /\.chalk-board \{[^}]*width:min\(calc\(100vw - 14px\),calc\(177\.7778svh - 24\.8889px\)\)/s);
  assert.match(styles, /@media\(orientation:portrait\)[\s\S]*?\.chalk-board\{[^}]*aspect-ratio:16\/9/);
});

test("tracked inventory updates availability and decrements with orders", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const store = await fs.readFile(new URL("../lib/store.ts", import.meta.url), "utf8");
  const orders = await fs.readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8");
  const migration = await fs.readFile(new URL("../drizzle/0004_lush_thunderbolt.sql", import.meta.url), "utf8");
  assert.match(component, /Menu & Inventory/);
  assert.match(component, /Auto stock/);
  assert.match(store, /manualAvailable&&\(!trackInventory\|\|stockOnHand>0\)/);
  assert.match(orders, /stock_on_hand=MAX\(0,stock_on_hand-\?\)/);
  assert.match(migration, /track_inventory/);
  assert.match(migration, /stock_on_hand/);
});
