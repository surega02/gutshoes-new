import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const base = process.env.STOREFRONT_URL || 'http://localhost:5173';
const api = process.env.CATALOG_API_URL || 'http://localhost:8000/api/v1';
const catalog = await fetch(`${api}/products?per_page=48&sort=newest`).then(r => r.json());
assert(catalog.data.length >= 5, 'Browser smoke test needs at least five published products.');
const browser = await puppeteer.launch({executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
const page = await browser.newPage();
const errors = [];
const requests = [];
let mode = 'live';
let releaseSlow;
let slowSeen;
page.on('pageerror', error => errors.push(error.message));
await page.setViewport({width: 1440, height: 1000});
await page.setRequestInterception(true);
page.on('request', async request => {
  try {
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/api/v1/products')) return await request.continue();
    requests.push(url.href);
    const list = url.pathname === '/api/v1/products';
    if (mode === 'error' && list && url.searchParams.get('per_page') === '12') {
      return await request.respond({status: 503, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Credentials': 'true'}, body: JSON.stringify({message: 'Uji gangguan katalog'})});
    }
    if (mode === 'slow' && list && url.searchParams.get('search') === catalog.data[0].name) {
      slowSeen?.();
      await new Promise(resolve => { releaseSlow = resolve; });
      return await request.continue();
    }
    // Exercise real server pagination using a smaller page for the six-product demo.
    if (mode === 'pagination' && list && url.searchParams.get('per_page') === '12') {
      url.searchParams.set('per_page', '2');
      return await request.continue({url: url.href});
    }
    await request.continue();
  } catch (error) {
    if (!/handled|closed|Invalid InterceptionId/i.test(error.message)) errors.push(error.message);
  }
});
const ready = () => page.waitForFunction(() => document.querySelector('[aria-label="Hasil katalog"]')?.getAttribute('aria-busy') === 'false');
const names = () => page.$$eval('.product-grid--catalog h3', nodes => nodes.map(n => n.textContent));
const clickText = async (selector, text) => {
  const clicked = await page.$$eval(selector, (nodes, label) => {
    const node = nodes.find(n => n.textContent.trim() === label);
    if (!node) return false;
    node.click(); return true;
  }, text);
  assert(clicked, `Control not found: ${text}`);
};
const search = async value => {
  await page.click('[aria-label="Cari produk"]');
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  if (value) await page.type('[aria-label="Cari produk"]', value);
};
const expectNames = async expected => {
  await page.waitForFunction(wanted => JSON.stringify([...document.querySelectorAll('.product-grid--catalog h3')].map(n => n.textContent)) === JSON.stringify(wanted) && document.querySelector('[aria-label="Hasil katalog"]')?.getAttribute('aria-busy') === 'false', {}, expected);
};
try {
  await page.goto(`${base}/#catalog`);
  await ready();
  assert.deepEqual(await names(), catalog.data.slice(0, 12).map(p => p.name));
  console.log('PASS initial asynchronous catalog render');

  const target = catalog.data.at(-1);
  await search(target.variants[0].sku);
  await expectNames([target.name]);
  assert(requests.some(url => new URL(url).searchParams.get('search') === target.variants[0].sku));
  await clickText('button', 'Reset semua filter');
  await expectNames(catalog.data.slice(0, 12).map(p => p.name));
  await clickText('.filters label', target.brand.name);
  const branded = await fetch(`${api}/products?brand=${target.brand.slug}&sort=newest`).then(r => r.json());
  await expectNames(branded.data.map(p => p.name));
  assert.equal(await page.$$eval('input[name="brand"]', nodes => nodes.length), catalog.filters.brands.length + 1);
  console.log('PASS server SKU search, reset and brand filtering');

  await page.select('.catalog-actions select', 'best_selling');
  const ranked = await fetch(`${api}/products?brand=${target.brand.slug}&sort=best_selling`).then(r => r.json());
  await expectNames(ranked.data.map(p => p.name));
  assert(requests.some(url => new URL(url).searchParams.get('sort') === 'best_selling'));
  await clickText('button', 'Reset semua filter');
  await ready();
  await page.select('.catalog-actions select', 'newest');
  await expectNames(catalog.data.slice(0, 12).map(p => p.name));
  console.log('PASS server best-selling sort');

  mode = 'pagination';
  await page.reload();
  await expectNames(catalog.data.slice(0, 2).map(p => p.name));
  await clickText('.catalog-pagination button', 'Berikutnya');
  await expectNames(catalog.data.slice(2, 4).map(p => p.name));
  await clickText('.catalog-pagination button', 'Berikutnya');
  await expectNames(catalog.data.slice(4, 6).map(p => p.name));
  const href = await page.$eval('.product-grid--catalog .product-name-button', el => el.getAttribute('href'));
  const product = catalog.data[4];
  await page.click('.product-grid--catalog .product-name-button');
  await page.waitForFunction(name => document.querySelector('.purchase-panel h1')?.textContent === name, {}, product.name);
  assert(requests.some(url => new URL(url).pathname.endsWith(`/products/${product.slug}`)));
  await page.reload();
  await page.waitForFunction(name => document.querySelector('.purchase-panel h1')?.textContent === name, {}, product.name);
  const direct = await browser.newPage();
  await direct.goto(`${base}/${href}`);
  await direct.waitForFunction(name => document.querySelector('.purchase-panel h1')?.textContent === name, {}, product.name);
  await direct.close();
  assert.equal(await page.title(), `${product.name} — GutShoes`);
  console.log('PASS real API pages 2/3, product link, reload and direct URL outside preview');

  await page.goto(`${base}/#catalog`);
  await expectNames(catalog.data.slice(0, 2).map(p => p.name));
  await clickText('.catalog-pagination button', 'Berikutnya');
  await expectNames(catalog.data.slice(2, 4).map(p => p.name));
  await search(target.variants[0].sku);
  await expectNames([target.name]);
  const lastSearch = requests.filter(url => new URL(url).searchParams.get('search') === target.variants[0].sku).at(-1);
  assert.equal(new URL(lastSearch).searchParams.get('page'), '1');
  console.log('PASS filter changes reset pagination');

  mode = 'live';
  await page.goto(`${base}/#product/does-not-exist-catalog-test`);
  await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Produk tidak ditemukan');
  await page.goto(`${base}/#catalog`);
  await search('no-match-gutshoes-93824');
  await page.waitForFunction(() => document.querySelector('.empty h2')?.textContent === 'Produk belum ditemukan');
  await clickText('button', 'Reset pencarian dan filter');
  await expectNames(catalog.data.slice(0, 12).map(p => p.name));
  mode = 'error';
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent.includes('Uji gangguan katalog'));
  mode = 'live';
  await clickText('button', 'Coba muat lagi');
  await expectNames(catalog.data.slice(0, 12).map(p => p.name));
  console.log('PASS missing slug, empty search and API error retry');

  mode = 'slow';
  const seen = new Promise(resolve => { slowSeen = resolve; });
  await search(catalog.data[0].name);
  await seen;
  await search(target.variants[0].sku);
  await expectNames([target.name]);
  releaseSlow();
  await page.waitForNetworkIdle({idleTime: 500});
  assert.deepEqual(await names(), [target.name]);
  console.log('PASS late response cannot overwrite latest search');

  mode = 'live';
  await clickText('button', 'Reset semua filter');
  await expectNames(catalog.data.slice(0, 12).map(p => p.name));
  const output = path.join(os.tmpdir(), 'gutshoes-catalog-qa');
  await fs.mkdir(output, {recursive: true});
  await page.waitForFunction(() => [...document.querySelectorAll('.product-card img')].every(image => image.complete));
  assert(await page.$eval('.product-card__image', el => el.getBoundingClientRect().height > 100));
  await page.screenshot({path: path.join(output, 'desktop.png'), fullPage: true});
  await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true});
  await expectNames(catalog.data.slice(0, 12).map(p => p.name));
  assert(await page.$eval('.catalog-actions select', el => el.getBoundingClientRect().width > 0));
  await clickText('button', 'Filter');
  await page.waitForSelector('.filter-drawer.open');
  await clickText('.filters label', target.brand.name);
  await expectNames(branded.data.map(p => p.name));
  await page.click('.filters__head button');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.waitForFunction(() => [...document.querySelectorAll('.product-card img')].every(image => image.complete));
  await page.screenshot({path: path.join(output, 'mobile.png'), fullPage: true});
  assert.deepEqual(errors, []);
  console.log(`PASS mobile filter/sort, no horizontal overflow, no JS errors; screenshots: ${output}`);
} catch (error) {
  console.error(JSON.stringify({errors, requests, body: await page.$eval("body", el => el.innerText)}, null, 2));
  throw error;
} finally {
  releaseSlow?.();
  await browser.close();
}
