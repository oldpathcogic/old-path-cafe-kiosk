const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const port = 4186;

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  const filePath = path.join(root, pathname === "/" ? "index.html" : pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});

function request(pathname) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${pathname}`, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => resolve({ status: res.statusCode, body }));
    }).on("error", reject);
  });
}

async function main() {
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  try {
    const index = await request("/");
    const app = await request("/src/app.js");
    const css = await request("/src/styles.css");

    if (index.status !== 200 || !index.body.includes("She Brews Cafe")) {
      throw new Error("Index route failed.");
    }
    if (app.status !== 200 || !app.body.includes("renderMenuBoard")) {
      throw new Error("App script route failed.");
    }
    if (css.status !== 200 || !css.body.includes(".chalkboard")) {
      throw new Error("Styles route failed.");
    }

    console.log("Server test passed: static routes serve the app shell and assets.");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
