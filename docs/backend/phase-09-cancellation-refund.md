# Fase 9 — Cancellation dan Refund

Pembatalan hanya diterima untuk order `PENDING_PAYMENT` dan `PAID`. Order unpaid melepaskan reservasi; order paid membuat refund terpisah berstatus `PENDING`. Status fulfillment dan terminal ditolak oleh state machine.

Refund menggunakan `idempotency_key` unik. Adapter fake dipakai pada test, sedangkan adapter HTTP mengirim `refund_key` yang sama ke Midtrans untuk retry aman. Status refund adalah `PENDING`, `SUCCESS`, atau `FAILED`.
