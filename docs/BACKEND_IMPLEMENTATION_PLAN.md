# GutShoes Backend Implementation Plan

## 1. Target

Membangun REST API Laravel di `apps/backend` untuk melayani storefront dan admin panel GutShoes. Backend menjadi sumber kebenaran untuk autentikasi, harga, voucher, ongkir, stok, pembayaran, status pesanan, refund, dan audit.

## 2. Prinsip Arsitektur

- Laravel REST API dengan prefix `/api/v1`.
- MySQL 8/InnoDB untuk transaksi dan locking.
- Frontend tidak dipercaya untuk harga, diskon, ongkir, total, status pembayaran, maupun stok.
- Midtrans webhook adalah sumber kebenaran pembayaran.
- Proses pembayaran, refund, dan pergerakan inventaris wajib idempotent.
- Side effect seperti email dijalankan melalui queue setelah transaksi database berhasil.
- Satu warehouse untuk MVP, tetapi foreign key tetap mempertahankan kemungkinan multi-warehouse.
- OpenAPI menjadi kontrak antara `apps/storefront` dan `apps/backend`.

## 3. Struktur Backend

```text
apps/backend/
├── app/
│   ├── Domain/
│   │   ├── Catalog/
│   │   ├── Customer/
│   │   ├── Inventory/
│   │   ├── Order/
│   │   ├── Payment/
│   │   ├── Promotion/
│   │   ├── Shipping/
│   │   └── Administration/
│   ├── Http/Controllers/Api/V1/
│   ├── Http/Requests/
│   ├── Http/Resources/
│   ├── Jobs/
│   ├── Listeners/
│   ├── Notifications/
│   └── Policies/
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── routes/api.php
└── tests/
    ├── Feature/
    └── Unit/
```

Domain folders mengelompokkan aturan bisnis; controller tetap tipis dan tidak menyimpan logika transaksi.

## 4. Fase Implementasi

### Fase 0 — Bootstrap dan Quality Gate

- Scaffold Laravel di `apps/backend`.
- Siapkan `.env.example`, koneksi MySQL, cache, queue, mail, Google OAuth, shipping provider, dan Midtrans.
- Tambahkan formatter/static analysis, PHPUnit/Pest, health endpoint, CORS, rate limiting, request ID, dan structured logging.
- Buat pipeline CI untuk backend test serta storefront build.
- Buat `docs/api/openapi.yaml` dan aturan versioning API.

**Selesai ketika:** aplikasi dapat boot, terhubung ke database test, dan CI hijau.

### Fase 1 — Database Foundation

Implementasikan migration berdasarkan ERD dalam urutan dependensi:

1. Users, admins, customer profiles, addresses.
2. Brands, categories, products, product images.
3. Sizes dan product variants: SKU, harga, berat, status.
4. Warehouses dan inventories.
5. Carts dan cart items.
6. Promotions, product discounts, vouchers, applicability, voucher usage.
7. Orders, order items, address/shipping/price snapshots.
8. Payments, webhook logs, shipments.
9. Inventory reservations dan inventory movements.
10. Cancellations, refunds, audit logs, store configurations.

Tambahkan foreign key, unique constraint, index pencarian, decimal precision, enum/check constraint, soft delete, serta timestamps sesuai rancangan database.

**Selesai ketika:** seluruh migration dapat dijalankan ulang dari database kosong dan invariant utama dilindungi constraint.

### Fase 2 — Authentication dan Authorization

- Login Google untuk customer menggunakan authorization code yang divalidasi server.
- Session/token untuk SPA menggunakan mekanisme Laravel yang sesuai deployment.
- Guest checkout tanpa akun.
- Role tunggal `ADMIN` untuk MVP.
- Policies/middleware untuk kepemilikan profil, alamat, pesanan, dan endpoint admin.
- Link guest order ke akun jika email terverifikasi cocok.

**Endpoint utama:** `/auth/google`, `/auth/me`, `/auth/logout`, `/profile`, `/addresses`, dan `/admin/auth/*`.

### Fase 3 — Catalog API

- CRUD admin untuk brand, kategori, produk, gambar, varian, SKU, harga, berat, draft, publish, dan soft delete.
- Public product listing hanya menampilkan produk published.
- Search nama, brand, dan SKU; filter kategori, ukuran tersedia, harga; sorting dan pagination.
- Sold-out product tetap terlihat.
- Resource response stabil untuk storefront.

**Selesai ketika:** admin dapat membentuk produk lengkap dari draft hingga published tanpa manipulasi database.

### Fase 4 — Inventory Engine

- Stok dikelola per warehouse dan size variant.
- Service untuk add, adjust, reserve, release, dan sell.
- Semua perubahan menghasilkan immutable inventory movement.
- Atomic reservation menggunakan transaction dan row locking/conditional update.
- Cegah stok negatif dan overselling.
- Scheduled job melepas reservasi kedaluwarsa secara idempotent.
- Konfigurasi global low-stock threshold.

**Selesai ketika:** concurrent reservation test membuktikan stok tidak dapat menjadi negatif.

### Fase 5 — Cart, Promotion, dan Shipping

- Cart untuk guest dan authenticated customer tanpa expiry otomatis.
- Validasi ulang varian saat cart dibaca dan checkout dilakukan.
- Product discount dengan priority; hanya prioritas tertinggi yang berlaku.
- Voucher `PERCENTAGE`, `FIXED_AMOUNT`, dan `FREE_SHIPPING`.
- Validasi periode, minimum transaksi, usage limit, dan product applicability.
- Product discount dapat ditumpuk dengan satu voucher.
- Shipping provider abstraction berdasarkan origin, destination, berat, jumlah, kurir, dan layanan.

**Selesai ketika:** endpoint quote menghasilkan breakdown subtotal, diskon produk, voucher, ongkir, dan grand total dari data server.

### Fase 6 — Checkout dan Order Creation

- Checkout menerima customer/address input, pilihan shipping, dan voucher—bukan nominal hasil hitung frontend.
- Recalculate seluruh total dan revalidate stok.
- Buat order number yang human-readable dan unik.
- Simpan snapshot produk, varian, harga, alamat, ongkir, diskon, dan voucher.
- Buat inventory reservation 24 jam dalam transaksi yang sama.
- Gunakan idempotency key agar double-submit tidak membuat dua order.
- Status awal `PENDING_PAYMENT`.

**Selesai ketika:** retry request yang sama mengembalikan order yang sama dan transaksi gagal tidak meninggalkan reservasi yatim.

### Fase 7 — Midtrans Payment

- Buat payment transaction/Snap token dari backend.
- Simpan payment record dan expiry 24 jam.
- Endpoint webhook dengan signature verification dan raw webhook log.
- Mapping status Midtrans ke payment status internal.
- Transisi order ke `PAID` hanya dari notifikasi server yang valid.
- Webhook processing idempotent dan tahan urutan event yang tidak ideal.
- Payment expiry membatalkan/menandai order sesuai keputusan implementasi dan melepas reservasi.

**Selesai ketika:** duplicate webhook tidak menggandakan inventory movement, email, atau perubahan order.

### Fase 8 — Fulfillment dan Tracking

- Admin memproses `PAID → PROCESSING`.
- Tambahkan shipment: provider, service, fee, resi, shipped timestamp, delivered timestamp.
- Transisi `PROCESSING → SHIPPED → DELIVERED` dengan transition guard.
- Public guest tracking menggunakan order number + email.
- Authenticated order history/detail hanya mengakses pesanan milik customer.
- Email untuk order created, payment success/expired, shipped, delivered.

### Fase 9 — Cancellation dan Refund

- Customer/admin dapat membatalkan hanya `PENDING_PAYMENT` atau `PAID`.
- `PROCESSING`, `SHIPPED`, dan `DELIVERED` tidak dapat dibatalkan.
- Pembatalan unpaid melepas reservation.
- Pembatalan paid membuat refund terpisah berstatus `PENDING`.
- Admin review dan proses refund melalui Midtrans jika didukung.
- Refund status `PENDING`, `SUCCESS`, atau `FAILED`; bukan order status.
- Audit serta email refund completed.

**Selesai ketika:** seluruh kombinasi status order/payment/refund diuji sebagai state machine.

### Fase 10 — Admin Operations

- Dashboard: sales, revenue, pending payment, processing, shipping, completed, low stock, top products.
- Order search/filter/detail dan tindakan operasional.
- Customer profile, alamat operasional, dan riwayat pesanan.
- Promotion/voucher management lengkap.
- Store configuration: identitas, warehouse origin, dan low-stock threshold.
- Immutable audit log berisi admin, action, entity, target ID, description, timestamp, serta metadata.

### Fase 11 — Hardening dan Release Readiness

- Contract test terhadap OpenAPI dan integrasi storefront.
- Feature test untuk setiap endpoint dan policy.
- Concurrency test inventaris, idempotency test checkout/webhook/refund.
- Test rollback transaksi dan kegagalan provider.
- Rate limit login, tracking guest, voucher, checkout, dan webhook.
- Sanitasi upload produk, validation limits, pagination limits, serta log redaction.
- Database backup/restore rehearsal dan production runbook.
- Seed data development terpisah dari production.

## 5. Urutan Integrasi Frontend

1. Auth, profile, dan addresses.
2. Catalog dan product detail.
3. Cart, checkout quote, voucher, dan shipping.
4. Order creation dan Midtrans.
5. History, detail, tracking, dan payment state.
6. Cancellation/refund.
7. Admin modules secara bertahap sesuai fase backend.

Mock state frontend diganti per modul, bukan sekaligus, agar storefront tetap dapat diuji selama pembangunan backend.

## 6. Definition of Done Global

- Endpoint terdokumentasi di OpenAPI.
- Request tervalidasi dan response memakai API Resource konsisten.
- Policy dan authorization test tersedia.
- Aturan bisnis berada di service/domain action, bukan controller.
- Operasi finansial/inventaris dibungkus transaction dan idempotent.
- Error response tidak membocorkan exception atau data sensitif.
- Unit, feature, dan integration test untuk happy path serta failure path hijau.
- Audit log dan observability tersedia untuk operasi penting.
- Frontend tidak lagi bergantung pada data simulasi untuk modul tersebut.

## 7. Milestone yang Disarankan

| Milestone | Fase | Hasil |
|---|---:|---|
| M1 Foundation | 0–2 | Laravel, database, auth, authorization |
| M2 Commerce Core | 3–5 | Catalog, inventory, cart, promotion, shipping quote |
| M3 Transaction | 6–7 | Checkout, order, reservation, Midtrans |
| M4 Fulfillment | 8–9 | Shipment, tracking, cancellation, refund |
| M5 Operations | 10–11 | Admin lengkap, audit, hardening, release readiness |

