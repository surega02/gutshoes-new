import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 768 });
await page.goto('http://127.0.0.1:4174/#login', { waitUntil: 'networkidle0' });
await page.click('.google-button');
await new Promise(resolve => setTimeout(resolve, 900));

const avatar = await page.$eval('.account-avatar', element => {
  const rect = element.getBoundingClientRect();
  return {
    display: getComputedStyle(element).display,
    text: element.textContent.trim(),
    width: rect.width,
    height: rect.height,
  };
});

const profileLayout = await page.$eval('.account-layout', element => ({
  columns: getComputedStyle(element).gridTemplateColumns,
  navDirection: getComputedStyle(element.querySelector('.account-nav')).flexDirection,
}));
await page.screenshot({ path: '.impeccable/review/profile-tablet-1024.png', fullPage: false });

await browser.close();

if (avatar.display === 'none' || !avatar.text || avatar.width < 28 || avatar.height < 28) {
  console.error(`Avatar tablet gagal: ${JSON.stringify(avatar)}`);
  process.exit(1);
}

if (profileLayout.navDirection !== 'row' || profileLayout.columns.includes('240px')) {
  console.error(`Layout profil tablet gagal: ${JSON.stringify(profileLayout)}`);
  process.exit(1);
}

console.log(`QA profil 1024px berhasil: ${JSON.stringify({ avatar, profileLayout })}`);
