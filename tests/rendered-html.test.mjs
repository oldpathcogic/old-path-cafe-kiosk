import assert from "node:assert/strict";
import test from "node:test";

test("build contains every cafe screen and She Brews metadata", async () => {
  const fs = await import("node:fs/promises");
  const layout = await fs.readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /title: "She Brews Cafe"/);
  assert.doesNotMatch(layout, /codex-preview/);
  for (const path of ["../app/page.tsx", "../app/barista/page.tsx", "../app/menu/page.tsx", "../app/admin/page.tsx", "../app/track/page.tsx"]) {
    const source = await fs.readFile(new URL(path, import.meta.url), "utf8");
    assert.match(source, /CafeApp/);
  }
});

test("built worker exposes the cafe API routes", async () => {
  const source = await import("node:fs/promises").then(fs => fs.readFile(new URL("../dist/server/index.js", import.meta.url), "utf8"));
  for (const route of ["/api/menu", "/api/orders", "/api/admin/menu", "/api/admin/ledger", "/api/admin/orders", "/api/ledger-feed", "/api/track", "/api/pickup"]) assert.match(source, new RegExp(route.replaceAll("/", "\\/")));
});

test("the protected Google Sheets orders ledger is linked from admin", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const store = await fs.readFile(new URL("../lib/store.ts", import.meta.url), "utf8");
  assert.match(component, /Open Google Sheet/);
  assert.match(component, /Download Orders CSV/);
  assert.match(store, /ordersLedgerUrl/);
});

test("the automatic ledger feed is token protected and shares the canonical CSV builder", async () => {
  const fs = await import("node:fs/promises");
  const feed = await fs.readFile(new URL("../app/api/ledger-feed/route.ts", import.meta.url), "utf8");
  const adminExport = await fs.readFile(new URL("../app/api/admin/orders/route.ts", import.meta.url), "utf8");
  assert.match(feed, /LEDGER_FEED_TOKEN/);
  assert.match(feed, /buildLedgerCsv/);
  assert.match(adminExport, /buildLedgerCsv/);
});

test("customer-ready notifications are wired through the kiosk, tracker, and menu board", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const ordersRoute = await fs.readFile(new URL("../app/api/orders/route.ts", import.meta.url), "utf8");
  assert.match(component, /Notify me when it’s ready/);
  assert.match(component, /Ready for Pickup/);
  assert.match(ordersRoute, /trackingToken/);
  assert.match(ordersRoute, /pickupCode/);
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
  for (const slug of ["regular-coffee","cold-brew","latte","cappuccino","espresso-shot","donut","croissant"]) {
    await fs.access(new URL(`../public/menu-images/${slug}.webp`, import.meta.url));
  }
});
