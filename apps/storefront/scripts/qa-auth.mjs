import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const errors = [];
const desktop = await browser.newPage();
await desktop.setViewport({ width: 1440, height: 900 });
desktop.on('pageerror', error => errors.push(`desktop: ${error.message}`));
await desktop.goto('http://127.0.0.1:4174/#login', { waitUntil: 'networkidle0' });
await desktop.screenshot({ path: '.impeccable/review/auth-login-desktop.png', fullPage: false });
await desktop.setViewport({ width: 390, height: 844, isMobile: true });
await desktop.screenshot({ path: '.impeccable/review/auth-login-mobile.png', fullPage: false });
await desktop.setViewport({ width: 1440, height: 900 });
await desktop.click('.google-button');
await new Promise(resolve => setTimeout(resolve, 900));
if (!await desktop.$('.account-page')) errors.push('login tidak membuka area akun');
await desktop.screenshot({ path: '.impeccable/review/auth-account-desktop.png', fullPage: false });
await desktop.reload({ waitUntil: 'networkidle0' });
if (!await desktop.$('.account-page')) errors.push('sesi demo tidak bertahan setelah refresh');
await desktop.evaluate(() => { location.hash = '#addresses'; });
await new Promise(resolve => setTimeout(resolve, 200));
await desktop.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Tambah alamat')?.click());
await desktop.type('textarea[name="address"]', 'Jl. QA Privasi No. 8');
await desktop.type('input[name="postal"]', '12120');
await desktop.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Simpan alamat')?.click());
await new Promise(resolve => setTimeout(resolve, 150));
await desktop.click('.address-item .danger-link');
if (!await desktop.$('dialog.confirm-dialog[open]')) errors.push('hapus alamat tidak membuka dialog native');
await desktop.keyboard.press('Escape');
if (await desktop.$('dialog.confirm-dialog[open]')) errors.push('Escape tidak menutup dialog hapus alamat');
await desktop.evaluate(() => { location.hash = '#profile'; });
await new Promise(resolve => setTimeout(resolve, 150));
await desktop.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Keluar')?.click());
await desktop.evaluate(() => [...document.querySelectorAll('dialog[open] button')].find(button => button.textContent.includes('Ya, keluar'))?.click());
await new Promise(resolve => setTimeout(resolve, 200));
await desktop.evaluate(() => { location.hash = '#login'; });
await new Promise(resolve => setTimeout(resolve, 100));
await desktop.click('.google-button');
await new Promise(resolve => setTimeout(resolve, 800));
await desktop.evaluate(() => { location.hash = '#addresses'; });
await new Promise(resolve => setTimeout(resolve, 150));
if (!await desktop.$('.address-list .empty')) errors.push('alamat pelanggan masih tersisa setelah logout dan login ulang');

const mobile = await browser.newPage();
await mobile.setViewport({ width: 390, height: 844, isMobile: true });
mobile.on('pageerror', error => errors.push(`mobile: ${error.message}`));
await mobile.goto('http://127.0.0.1:4174/#addresses', { waitUntil: 'networkidle0' });
await new Promise(resolve => setTimeout(resolve, 250));
await mobile.screenshot({ path: '.impeccable/review/auth-account-mobile.png', fullPage: false });
if (!await mobile.$('.account-nav')) errors.push('navigasi akun seluler tidak muncul');

await browser.close();
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('QA autentikasi: login, persistensi sesi, rute terlindungi, dan area akun seluler merespons.');
