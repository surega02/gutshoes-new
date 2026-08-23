# Fase 11 — Hardening dan Release Readiness

Fase ini menambahkan contract/failure/queue retry tests, readiness check database/cache, rate limit health, production runbook, konfigurasi supervisor Horizon/scheduler, serta script backup/restore dengan guard eksplisit.

Storefront kini memiliki API client first-party berbasis cookie/CSRF. Login admin hard-coded telah dihapus, login admin memakai Sanctum, customer diarahkan ke Google OAuth, sesi/profil/alamat diinisialisasi dari backend, dan guest tracking diverifikasi oleh API. Asset data statis tetap digunakan sebagai fallback visual saat API lokal tidak tersedia; harga, stok, checkout, pembayaran, cancellation, dan mutasi admin tetap harus berasal dari server.
