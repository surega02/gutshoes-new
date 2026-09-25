# Audit Kesiapan Integrasi Payment Gateway dan Logistik — 11 September 2026

## Keputusan

GutShoes **siap untuk development integration**, tetapi **belum siap UAT provider dan produksi**.

Fondasi transaksi internal sudah kuat dan test otomatis lulus. Blocker utama berada pada normalisasi status pembayaran, audit webhook gagal, konsistensi refund, konkurensi voucher, provenance ID area shipping, credential/callback provider, dan bukti pengujian provider nyata.

## Ringkasan hasil

| Area | Status | Temuan |
| --- | --- | --- |
| Katalog | SIAP | Pagination, search nama/brand/SKU, filter, sort terlaris, detail slug, dan stok berasal dari API server. |
| Cart | GAP MINOR | Kuantitas dibatasi available stock. Ganti ukuran langsung belum tersedia. |
| Checkout | SIAP SECARA DOMAIN | Total dihitung ulang server, snapshot dan idempotency tersedia. |
| Inventory | KUAT | Transaksi, row lock, reserve/release/sell, movement dan expiry tersedia. Perlu load test MySQL. |
| Payment intent | KUAT SECARA DESAIN | Snap server-side, satu payment per order, timeout ambigu disimpan sebagai uncertain. |
| Webhook Midtrans | BLOCKER | deny/failure belum dipetakan ke FAILED. Error bisnis dapat rollback bersama audit webhook. Belum ada rekonsiliasi periodik GET Status. |
| Status payment | BLOCKER PRD | Status internal masih bercampur dengan SETTLEMENT/CAPTURE/EXPIRE. Perlu provider_status terpisah. |
| Refund | BLOCKER | Network call terjadi saat DB lock. Keberhasilan hanya berdasar status_code dan belum ada retry/reconcile. |
| Shipping abstraction | SIAP STRUKTUR | RajaOngkir, Biteship, fake, area mapper, tracker, dan shipping_options dinamis tersedia. |
| RajaOngkir | BLOCKER KONFIGURASI | Driver masih fake dan API key kosong. Shipping Cost memakai data live. |
| Mapping area | HARDENING | Destination dicocokkan unik. ID area gudang belum menyimpan namespace provider. |
| Tracking | PARSIAL | Resi manual dan fallback lokal tersedia. Tidak semua kurir tarif mendukung AWB. |
| Fulfillment | SESUAI MVP | PAID → PROCESSING → SHIPPED → DELIVERED dijaga dan resi wajib. |
| Voucher | BLOCKER BISNIS | Cart campuran dapat mendiskon seluruh subtotal; usage limit belum aman terhadap race. |
| Guest | HARDENING | Detail/payment memakai token; tracking masih memakai order number + email. Conversion belum ada. |
| Operasional | BELUM DIBUKTIKAN | Staging Linux dengan Redis, Horizon, scheduler, SMTP dan monitoring wajib diuji. |

## Blocker P0 sebelum UAT provider

1. Pisahkan payment status internal PENDING/SUCCESS/FAILED dari provider_status, termasuk deny/cancel/expire/failure.
2. Simpan webhook valid beserta hasil/error meskipun validasi bisnis gagal.
3. Tambahkan rekonsiliasi Midtrans GET Status untuk uncertain, webhook hilang, dan event out-of-order.
4. Jadikan refund state machine idempoten dengan retry dan rekonsiliasi status final.
5. Kunci voucher dan hitung ulang usage limit dalam transaksi; diskon hanya item eligible.
6. Simpan namespace provider pada provider_area_id dan tolak ID yang tidak cocok.
7. Isi API key RajaOngkir dan petakan origin gudang.
8. Sediakan callback Midtrans HTTPS publik dan credential sandbox valid.
9. Uji pada staging Linux dengan MySQL, Redis, queue, scheduler, dan SMTP.

## Matriks pengujian wajib

### Midtrans

- create/reuse Snap;
- settlement dan capture + fraud accept;
- pending, deny, cancel, expire, failure;
- signature dan nominal/currency/order mismatch;
- duplicate dan out-of-order webhook;
- timeout, late settlement, serta cancel race;
- refund per metode, retry, reconcile, dan GET Status.

### RajaOngkir

- mapping unik/ambigu;
- single dan multi-item;
- beberapa kurir/service;
- service hilang antara quote dan order;
- timeout, 401, 422, quota dan respons kosong;
- AWB valid/tidak valid dan kurir tanpa dukungan tracking;
- fee/service quote sama dengan snapshot order.

## Bukti verifikasi

- Backend: **101 test / 461 assertion lulus** setelah driver test diisolasi dari .env.
- PHPStan lulus, tetapi masih level 0.
- Laravel Pint sudah merapikan format.
- Frontend ESLint dan production build lulus.
- MySQL tersambung dan seluruh migrasi Ran.
- Health, readiness, dan katalog lulus pada port 8010.
- Midtrans sandbox check gagal: credential sandbox belum tersedia dan callback masih localhost.
- Contract test RajaOngkir berbasis HTTP fake lulus; provider nyata belum diuji.

## Gap PRD non-integrasi

1. Ganti ukuran cart.
2. Guest order conversion.
3. Diskon kategori, brand, dan global.
4. Batas persentase 100 serta aturan voucher per-user bila dipakai.
5. Top products dan metrik dashboard lengkap.
6. Workspace payment/refund/shipment.
7. Verifikasi email refund dan lifecycle SMTP.

## Go/No-Go

| Tahap | Keputusan |
| --- | --- |
| Development fake provider | GO |
| Adapter dan contract test | GO |
| Midtrans Sandbox | NO-GO sampai credential dan callback HTTPS tersedia |
| RajaOngkir controlled smoke test | NO-GO sampai API key dan origin ID tersedia |
| UAT end-to-end | NO-GO sampai P0 dan staging selesai |
| Produksi | NO-GO |
