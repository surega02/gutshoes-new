import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const errors = [];
async function capture(name, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`${name} console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`${name} page: ${error.message}`));
  await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 1500));
  await page.screenshot({ path: `.impeccable/review/${name}.png`, fullPage: false });
  const rootText = await page.$eval('#root', node => node.textContent.trim());
  if (!rootText) errors.push(`${name}: root kosong`);
  return page;
}

const desktop = await capture('desktop', { width: 1536, height: 1024, deviceScaleFactor: 1 });
await desktop.evaluate(() => [...document.querySelectorAll('button')].find(el => el.textContent.includes('Belanja sekarang'))?.click());
await new Promise(resolve => setTimeout(resolve, 250));
if (!await desktop.evaluate(() => location.hash)) errors.push('desktop: navigasi katalog tidak berubah');
await desktop.click('.product-card');
await new Promise(resolve => setTimeout(resolve, 150));
await desktop.click('.size-picker button:not([disabled])');
await desktop.click('.add-button');
await desktop.click('.cart-button');
await new Promise(resolve => setTimeout(resolve, 150));
if (!await desktop.$('.cart-item')) errors.push('desktop: item tidak masuk ke keranjang');
await desktop.click('.checkout-button');
await new Promise(resolve => setTimeout(resolve, 150));
if (!await desktop.$('.checkout-form')) errors.push('desktop: checkout tidak terbuka');
await desktop.close();
const mobile = await capture('mobile', { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true });
await mobile.close();

if (errors.length) {
  console.error(errors.join('\n'));
  await browser.close();
  process.exit(1);
}
console.log('QA browser: desktop/mobile ter-render; katalog, ukuran, keranjang, dan checkout merespons.');
await browser.close();
process.exit(0);
