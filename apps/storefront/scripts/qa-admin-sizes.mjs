import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

const errors = [];
const sizes = [
  {id: 1, system: "EU", value: "40", label: "EU 40", product_variants_count: 3},
  {id: 2, system: "EU", value: "41", label: "EU 41", product_variants_count: 2},
  {id: 3, system: "EU", value: "42.5", label: "EU 42½", product_variants_count: 0},
  {id: 4, system: "UK", value: "8", label: "UK 8", product_variants_count: 1},
];
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://127.0.0.1:4174",
  "Access-Control-Allow-Credentials": "true",
};

async function openPage(name, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem("gutshoes-admin-session", String(Date.now()));
  });
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith("/api/v1/admin/sizes")) {
      request.respond({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({data: sizes}),
      });
      return;
    }
    if (url.pathname.endsWith("/api/v1/admin/dashboard")) {
      request.respond({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          data: {orders: {pending_payment: 2, paid: 1, processing: 1}},
        }),
      });
      return;
    }
    if (url.pathname.endsWith("/api/v1/auth/me")) {
      request.respond({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          data: {id: 1, name: "Administrator", email: "admin@example.test", role: "ADMIN"},
        }),
      });
      return;
    }
    if (url.pathname.endsWith("/api/v1/products")) {
      request.respond({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({
          data: [],
          meta: {current_page: 1, last_page: 1, per_page: 4, total: 0},
          filters: {brands: [], categories: [], sizes: []},
        }),
      });
      return;
    }
    if (url.pathname.endsWith("/api/v1/profile")) {
      request.respond({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({data: {name: "Administrator", phone: null}}),
      });
      return;
    }
    if (url.pathname.endsWith("/api/v1/addresses")) {
      request.respond({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({data: []}),
      });
      return;
    }
    if (url.pathname.endsWith("/api/v1/cart")) {
      request.respond({
        status: 200,
        contentType: "application/json",
        headers: corsHeaders,
        body: JSON.stringify({data: {items: []}}),
      });
      return;
    }
    request.continue();
  });
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${name}: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
  await page.goto("http://127.0.0.1:4174/#admin/sizes", {
    waitUntil: "networkidle0",
    timeout: 30000,
  });
  await page.waitForSelector(".adm-size-table");
  const title = await page.$eval(".adm-page-head h1", (node) => node.textContent);
  if (title.trim() !== "Ukuran") errors.push(`${name}: judul halaman salah`);
  const shell = await page.evaluate(() => ({
    navGroups: document.querySelectorAll(".adm-nav-group").length,
    hasInertGlobalSearch: Boolean(document.querySelector(".adm-topbar input")),
  }));
  if (shell.navGroups !== 4) errors.push(`${name}: grup navigasi admin tidak lengkap`);
  if (shell.hasInertGlobalSearch) errors.push(`${name}: pencarian global tanpa aksi masih tampil`);
  if (viewport.width <= 720) {
    const mobileTable = await page.evaluate(() => {
      const wrap = document.querySelector(".adm-table-wrap");
      const row = document.querySelector(".adm-size-table tbody tr");
      const action = document.querySelector(".adm-size-table .adm-row-action");
      const actionRect = action.getBoundingClientRect();
      return {
        scrollsInside: wrap.scrollWidth > wrap.clientWidth + 1,
        pageOverflows: document.documentElement.scrollWidth > window.innerWidth + 1,
        rowDisplay: getComputedStyle(row).display,
        rowHeight: row.getBoundingClientRect().height,
        actionVisible: actionRect.left >= 0 && actionRect.right <= window.innerWidth,
        actionSize: Math.min(actionRect.width, actionRect.height),
      };
    });
    if (!mobileTable.scrollsInside) errors.push(`${name}: tabel tidak menyediakan scroll kolom`);
    if (mobileTable.pageOverflows) errors.push(`${name}: tabel melebarkan halaman`);
    if (mobileTable.rowDisplay !== "table-row" || mobileTable.rowHeight > 80) {
      errors.push(`${name}: data ukuran tidak tampil sebagai satu baris ringkas`);
    }
    if (!mobileTable.actionVisible) errors.push(`${name}: aksi edit ukuran tidak terlihat`);
    if (mobileTable.actionSize < 44) errors.push(`${name}: target sentuh aksi kurang dari 44px`);
  }
  await page.screenshot({
    path: `../../.impeccable/review/${name}.png`,
    fullPage: false,
  });
  await page.evaluate(() => {
    [...document.querySelectorAll("button")]
      .find((button) => button.textContent.includes("Tambah ukuran"))
      ?.click();
  });
  await page.waitForSelector(".adm-size-editor");
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (viewport.width <= 720) {
    const drawerGeometry = await page.evaluate(() => {
      const drawer = document.querySelector(".adm-size-editor");
      const input = drawer.querySelector("input");
      const drawerRect = drawer.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      return {
        drawerLeft: drawerRect.left,
        drawerRight: drawerRect.right,
        inputLeft: inputRect.left,
        inputRight: inputRect.right,
      };
    });
    if (Math.abs(drawerGeometry.drawerLeft) > 1 || Math.abs(drawerGeometry.drawerRight - viewport.width) > 1) {
      errors.push(`${name}: drawer tidak memenuhi viewport mobile`);
    }
    if (drawerGeometry.inputLeft < 0 || drawerGeometry.inputRight > viewport.width) {
      errors.push(`${name}: field drawer terpotong`);
    }
  }
  await page.type('.adm-size-editor input[placeholder="42"]', "43");
  const label = await page.$eval(
    '.adm-size-editor input[placeholder="EU 42"]',
    (input) => input.value,
  );
  if (label !== "EU 43") errors.push(`${name}: label otomatis tidak terisi`);
  await page.screenshot({
    path: `../../.impeccable/review/${name}-editor.png`,
    fullPage: false,
  });
  return page;
}

const desktop = await openPage("desktop", {
  width: 1536,
  height: 1024,
  deviceScaleFactor: 1,
});
await desktop.close();
const mobile = await openPage("mobile", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  isMobile: true,
});
await mobile.close();

await browser.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("QA admin ukuran: daftar dan editor lolos pada desktop serta mobile.");
