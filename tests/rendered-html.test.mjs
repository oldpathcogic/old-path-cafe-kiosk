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
  for (const route of ["/api/menu", "/api/orders", "/api/admin/menu", "/api/admin/ledger", "/api/admin/orders", "/api/track", "/api/pickup"]) assert.match(source, new RegExp(route.replaceAll("/", "\\/")));
});

test("the protected Google Sheets orders ledger is linked from admin", async () => {
  const fs = await import("node:fs/promises");
  const component = await fs.readFile(new URL("../components/CafeApp.tsx", import.meta.url), "utf8");
  const store = await fs.readFile(new URL("../lib/store.ts", import.meta.url), "utf8");
  assert.match(component, /Open Google Sheet/);
  assert.match(component, /Download Orders CSV/);
  assert.match(store, /ordersLedgerUrl/);
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
