# Fase 6 — Checkout dan Order Creation

Endpoint `POST /api/v1/orders` menghitung ulang seluruh nilai di server, menyimpan snapshot order, alamat, dan pengiriman, serta mereservasi stok selama 24 jam dalam satu transaksi database.

Header `Idempotency-Key` wajib. Retry dengan payload sama mengembalikan order yang sama; payload berbeda menghasilkan HTTP 409. Kegagalan stok atau validasi menggulung order item, snapshot, voucher usage, dan reservasi.
