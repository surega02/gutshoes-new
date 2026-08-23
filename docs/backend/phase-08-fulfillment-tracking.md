# Fase 8 — Fulfillment dan Tracking

Customer terautentikasi hanya dapat membaca riwayat/detail order miliknya. Guest tracking memerlukan kombinasi nomor order publik dan email serta dilindungi rate limiter.

Admin menjalankan transisi terjaga `PAID → PROCESSING → SHIPPED → DELIVERED`. Resi dan timestamp bisnis disimpan pada shipment. Email lifecycle (`order_created`, `payment_success`, `payment_expired`, `shipped`, `delivered`) dikirim melalui queue dan dicatat secara idempoten.
