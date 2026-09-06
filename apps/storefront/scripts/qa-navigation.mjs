import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({width, height: 900});
    await page.goto(process.env.QA_URL || 'http://localhost:5173', {waitUntil: 'domcontentloaded'});
    await page.waitForSelector('.nav button');
    const timings = await page.evaluate(async () => {
      const timings = [];
      for (let i = 0; i < 4; i++) {
        const expected = i % 2 ? '#home' : '#catalog';
        window.scrollTo({top: 500, behavior: 'instant'});
        const start = performance.now();
        document.querySelectorAll('.nav button')[i % 2 ? 0 : 1].click();
        await new Promise((resolve, reject) => {
          const deadline = setTimeout(() => reject(new Error('Navigation exceeded 1500 ms')), 1500);
          const check = () => {
            if (location.hash === expected && document.querySelector('.nav [aria-current="page"]')?.textContent.trim() === (i % 2 ? 'Beranda' : 'Semua sepatu')) {
              clearTimeout(deadline);
              resolve();
            } else requestAnimationFrame(check);
          };
          requestAnimationFrame(check);
        });
        if (window.scrollY !== 0) throw new Error('Navigation did not reset scroll');
        timings.push(Math.round(performance.now() - start));
      }
      return timings;
    });
    await page.evaluate(() => document.querySelector('.cart-button').click());
    await page.waitForSelector('.cart-page');
    await page.goBack();
    await page.waitForFunction(() => location.hash === '#home' && document.querySelector('.hero'));
    await page.goForward();
    await page.waitForSelector('.cart-page');
    assert.equal(await page.evaluate(() => location.hash), '#cart');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({width, navigationMs: timings, lazyCartAndHistory: 'passed'}));
    await page.close();
  }
} finally {
  await browser.close();
}
