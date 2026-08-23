# Fase 7 — Midtrans Payment

`POST /api/v1/orders/{orderNumber}/payment` membuat transaksi Snap melalui backend. Adapter `fake` menjadi default pengembangan/test, sedangkan adapter `http` menggunakan Midtrans Sandbox ketika `MIDTRANS_DRIVER=http`.

Webhook `POST /api/v1/payments/midtrans/webhook` memverifikasi signature sebelum menyimpan event. Event disimpan dengan payload sensitif yang direduksi, diproses secara idempoten, dan transisi out-of-order tidak menurunkan order yang sudah dibayar. Scheduler menandai payment/order kedaluwarsa dan melepas reservasi secara idempoten.
