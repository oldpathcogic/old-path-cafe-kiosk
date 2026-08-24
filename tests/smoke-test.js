const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "index.html",
  "src/app.js",
  "src/styles.css",
  "server.js",
  "README.md",
  "docs/build-plan.md",
  "data/menu-template.csv",
  "data/addons-template.csv",
  "tests/browser-test.js",
  "tests/server-test.js"
];

const requiredAppSnippets = [
  "paymentRequired",
  "paymentProvider",
  "parseMenuCsv",
  "renderKiosk",
  "renderBarista",
  "renderMenuBoard",
  "syncSheet",
  "BroadcastChannel"
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, "..", file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const appJs = fs.readFileSync(path.join(__dirname, "..", "src/app.js"), "utf8");
for (const snippet of requiredAppSnippets) {
  if (!appJs.includes(snippet)) {
    throw new Error(`Missing app feature snippet: ${snippet}`);
  }
}

const css = fs.readFileSync(path.join(__dirname, "..", "src/styles.css"), "utf8");
for (const snippet of ["Fredericka the Great", "Patrick Hand", ".chalkboard", ".board-frame"]) {
  if (!css.includes(snippet)) {
    throw new Error(`Missing chalkboard styling snippet: ${snippet}`);
  }
}

console.log("Smoke test passed: kiosk, barista board, menu board, sheet sync, and payment-ready fields are present.");
