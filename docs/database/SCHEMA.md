# Database Foundation

Fase 1 menetapkan 34 tabel domain. Tabel cache, jobs, sessions, password reset, dan personal access token merupakan infrastruktur Laravel dan tidak dihitung sebagai tabel domain.

## Kelompok tabel

- Identity: `users`, `admin_profiles`, `customer_profiles`, `addresses`.
- Catalog: `brands`, `categories`, `products`, `category_product`, `product_images`, `sizes`, `product_variants`.
- Inventory: `warehouses`, `inventories`, `inventory_reservations`, `inventory_movements`.
- Cart and promotion: `carts`, `cart_items`, `promotions`, `promotion_products`, `vouchers`, `voucher_products`, `voucher_usages`.
- Order: `orders`, `order_items`, `order_addresses`, `order_status_histories`, `order_cancellations`.
- Payment and fulfillment: `payments`, `payment_webhooks`, `shipments`, `refunds`.
- Operations: `audit_logs`, `store_configurations`, `email_deliveries`.

## Invariant utama

- SKU, nomor pesanan, idempotency key, voucher code, dan provider event ID bersifat unik.
- Harga dan seluruh nilai finansial memakai `DECIMAL(15,2)` serta currency `CHAR(3)`.
- Stok dikelola per kombinasi warehouse dan variant.
- MySQL check constraint mencegah reserved stock melebihi on-hand serta kuantitas transaksi nol/negatif.
- Snapshot order tidak bergantung pada master data yang dapat berubah.
- Master data yang memiliki referensi historis menggunakan soft delete.

## Rollback

Migration domain dapat di-rollback sebagai satu unit tanpa menghapus tabel infrastruktur Laravel. Urutan drop merupakan kebalikan urutan foreign key. Untuk development gunakan `php artisan migrate:fresh --seed`; jangan gunakan perintah tersebut pada production.
