import assert from "node:assert/strict";
import test from "node:test";

test("build contains every cafe screen and She Brews metadata", async () => {
  const fs = await import("node:fs/promises");
  const layout = await fs.readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /title: "She Brews Cafe"/);
  assert.doesNotMatch(layout, /codex-preview/);
  for (const path of ["../app/page.tsx", "../app/barista/page.tsx", "../app/menu/page.tsx", "../app/admin/page.tsx"]) {
    const source = await fs.readFile(new URL(path, import.meta.url), "utf8");
    assert.match(source, /CafeApp/);
  }
});

test("built worker exposes the cafe API routes", async () => {
  const source = await import("node:fs/promises").then(fs => fs.readFile(new URL("../dist/server/index.js", import.meta.url), "utf8"));
  for (const route of ["/api/menu", "/api/orders", "/api/admin/menu"]) assert.match(source, new RegExp(route.replaceAll("/", "\\/")));
});
