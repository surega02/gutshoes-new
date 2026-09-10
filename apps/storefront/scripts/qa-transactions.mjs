import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
const base = process.env.QA_URL || 'http://localhost:5173';
const owner = {id: 7, name: 'Pembeli Uji', email: 'buyer@example.test', role: 'CUSTOMER'};
const address = {id: 1, label: 'Rumah', recipient_name: owner.name, phone: '081234567890', address_line: 'Jalan Uji 1', city: 'Jakarta Pusat', province: 'DKI Jakarta', district: 'Gambir', province_code: '31', regency_code: '31.71', district_code: '31.71.01', village_code: '31.71.01.1001', postal_code: '10110', is_default: true};
const item = {id: 12, quantity: 2, variant: {id: 9, sku: 'SKU-42', price: '100000.00', size: {label: '42'}, inventories: [{on_hand: 10, reserved: 0}], product: {id: 3, slug: 'runner', name: 'Sepatu Uji', brand: {name: 'GutShoes'}, images: []}}};
const snapshot = {id: 1, product_name: 'Sepatu Uji', brand_name: 'GutShoes', size_label: '42', sku: 'SKU-42', quantity: 3, line_total: '300000.00'};
try {
 await fs.mkdir('.impeccable/review', {recursive: true});
 for (const width of [1440, 390]) {
  const page = await browser.newPage();
  await page.setViewport({width, height: 1000});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let quantity = 2, converted = false, quoteCalls = 0, cancelCalls = 0, patchCalls = 0;
  const attempts = [];
  let order = {id: 10, order_number: 'GS-QA-0001', user_id: owner.id, customer_email: owner.email, grand_total: '318000.00', subtotal: '300000.00', shipping_fee: '18000.00', product_discount: '0.00', voucher_discount: '0.00', status: 'PENDING_PAYMENT', created_at: '2026-09-06T01:00:00Z', items: [snapshot], addresses: [{...address, type: 'SHIPPING'}], payment: {status: 'PENDING'}, refunds: [], shipment: {courier: 'jne', service: 'REG', tracking_number: null}};
  await page.setRequestInterception(true);
  page.on('request', async request => {
   const url = new URL(request.url());
   if (!url.pathname.startsWith('/api/v1/') && !url.pathname.startsWith('/sanctum/')) return request.continue();
   const headers = {'access-control-allow-origin': new URL(base).origin, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': request.headers()['access-control-request-headers'] || '*', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'};
   const respond = (data, status = 200) => request.respond({status, headers, contentType: 'application/json', body: JSON.stringify(data)});
   if (request.method() === 'OPTIONS') return respond(null, 204);
   const path = url.pathname.replace('/api/v1', '');
   if (path === '/auth/me') return respond({data: owner});
   if (path === '/profile') return respond({data: {phone: address.phone}});
   if (path === '/addresses') return respond({data: [address]});
   if (path === '/products') return respond({data: []});
   if (path.startsWith('/regions/')) {
    const data = {provinces: [{code:'31',name:'DKI Jakarta'}],regencies:[{code:'31.71',name:'Jakarta Pusat'}],districts:[{code:'31.71.01',name:'Gambir'}],villages:[{code:'31.71.01.1001',name:'Gambir',postal_code:'10110'}]};
    return respond({data: data[path.split('/').pop()]});
   }
   if (path === '/cart/items/12' && request.method() === 'PATCH') {
    patchCalls++;
    assert.equal(request.headers()['x-guest-cart-token'], undefined);
    quantity = JSON.parse(request.postData()).quantity;
    return respond({data: {guest_token: null, items: [{...item, quantity}]}});
   }
   if (path === '/cart') return respond({data: {guest_token: null, items: converted ? [] : [{...item, quantity}]}});
   if (path === '/checkout/quote') {
    quoteCalls++;
    if (quoteCalls === 1) return respond({message:'Ongkir sementara tidak tersedia'}, 503);
    return respond({data: {pricing: {subtotal:'300000.00', product_discount:'0.00', voucher_discount:'0.00', shipping_fee:'18000.00', grand_total:'318000.00'}, shipping: {provider:'FAKE',courier:'jne',service:'REG',fee:'18000.00'}}});
   }
   if (path === '/orders' && request.method() === 'POST') {
    attempts.push({key:request.headers()['idempotency-key'],payload:request.postData()});
    assert.equal(request.headers()['x-guest-cart-token'], undefined);
    converted = true;
    if (attempts.length === 1) return request.abort('failed');
    return respond({data: order});
   }
   if (path.endsWith('/payment')) return respond({data:{redirect_url:'https://example.test/payment'}});
   if (path.endsWith('/cancel')) {
    cancelCalls++;
    if(cancelCalls === 1) return respond({message:'Pembatalan belum terkonfirmasi'}, 503);
    order = {...order,status:'CANCELLED'};
    return respond({data:{cancellation:{order},refund:null}},201);
   }
   if (path === '/orders/GS-QA-0001') return respond({data:order});
   if (path === '/orders') return respond({data:[order],meta:{current_page:1,last_page:1}});
   return respond({data:null});
  });
  const clickText = async text => {
   await page.waitForFunction(text => [...document.querySelectorAll('button')].some(b => b.textContent.includes(text) && !b.disabled), {}, text);
   await page.evaluate(text => [...document.querySelectorAll('button')].find(b=>b.textContent.includes(text) && !b.disabled).click(), text);
  };
  await page.goto(base+'/#cart', {waitUntil:'domcontentloaded'});
  await page.waitForSelector('.cart-item');
  await page.click('[aria-label="Tambah jumlah"]');
  await page.waitForFunction(()=>document.querySelector('.quantity span')?.textContent === '3');
  assert.equal(patchCalls,1);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.quantity span')?.textContent === '3');
  await clickText('Lanjut ke checkout');
  await page.waitForSelector('[name="savedAddress"]');
  await clickText('Validasi & pilih pengiriman');
  await page.waitForFunction(()=>document.body.textContent.includes('Ongkir sementara tidak tersedia'));
  assert.equal(await page.$('.shipping-options'),null);
  assert.equal(await page.evaluate(()=>document.body.textContent.includes('simulasi lokal')),false);
  await clickText('Validasi & pilih pengiriman');
  await page.waitForSelector('.shipping-options');
  await clickText('Tinjau pembayaran');
  await clickText('Buat order & lanjut bayar');
  await page.waitForFunction(()=>document.body.textContent.includes('Status pembuatan pesanan belum pasti'));
  await page.reload({waitUntil:'domcontentloaded'});
  await clickText('Periksa pesanan');
  await page.waitForFunction(()=>location.hash === '#payment' && document.body.textContent.includes('Buka pembayaran Midtrans'));
  assert.equal(attempts.length,2);
  assert.deepEqual(attempts[0],attempts[1]);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('gutshoes-checkout-7')),null);
  await page.evaluate(()=>{location.hash='#orders';});
  await page.waitForSelector('.history-item');
  await clickText('Lihat detail');
  await clickText('Ajukan pembatalan');
  await clickText('Ya, batalkan');
  await page.waitForFunction(()=>document.body.textContent.includes('Pembatalan belum terkonfirmasi'));
  assert.equal(await page.$eval('.order-detail-head .order-state',el=>el.textContent),'PENDING_PAYMENT');
  await clickText('Ajukan pembatalan');
  await clickText('Ya, batalkan');
  await page.waitForFunction(()=>document.querySelector('.order-detail-head .order-state')?.textContent === 'CANCELLED');
  await page.screenshot({path:'.impeccable/review/transaction-'+width+'.png'});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({width,sessionCart:'passed',quoteFailure:'passed',lostResponseReload:'passed',serverCancellation:'passed'}));
  await page.close();
 }
} finally { await browser.close(); }

