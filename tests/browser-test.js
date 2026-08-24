const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.join(__dirname, "..");
const port = 4185;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
};

function serveFile(req, res) {
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  const filePath = path.join(root, pathname === "/" ? "index.html" : pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

async function main() {
  const server = http.createServer(serveFile);
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  let browser;

  try {
    try {
      browser = await chromium.launch({ headless: true });
    } catch (error) {
      if (String(error.message || error).includes("Executable doesn't exist")) {
        console.log("Browser test skipped: Playwright is installed, but the Chromium browser binary is not available.");
        return;
      }
      throw error;
    }

    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`http://127.0.0.1:${port}/#/kiosk`);
    await page.getByRole("button", { name: /Latte/i }).click();
    await page.getByRole("button", { name: /Iced/i }).click();
    await page.getByRole("button", { name: /Vanilla/i }).click();
    await page.getByRole("button", { name: /Add to Order/i }).click();
    await page.getByPlaceholder("Enter your name").fill("Dom");
    await page.getByRole("button", { name: /Send to Barista/i }).click();

    await page.goto(`http://127.0.0.1:${port}/#/barista`);
    await page.getByText("Dom").waitFor();
    await page.getByRole("button", { name: "Start" }).click();
    await page.getByText("In Progress").waitFor();

    await page.goto(`http://127.0.0.1:${port}/#/menu`);
    await page.getByText("She Brews").waitFor();
    await page.getByText("Regular Coffee").waitFor();

    await page.goto(`http://127.0.0.1:${port}/#/admin`);
    await page.getByText("Menu Admin").waitFor();
    await page.getByText("Payment Readiness").waitFor();

    console.log("Browser test passed: order flow, barista status, menu board, and admin route render.");
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
