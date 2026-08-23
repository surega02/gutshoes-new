# Production Runbook GutShoes

## Deployment

1. Deploy immutable artifact dari commit yang sudah lulus Quality Gate.
2. Isi secret melalui secret manager; jangan salin `.env` ke repository.
3. Jalankan `composer install --no-dev --classmap-authoritative`, `php artisan config:cache`, `route:cache`, `view:cache`, dan `migrate --force`.
4. Jalankan `php artisan horizon:terminate` setelah symlink/release berpindah.
5. Supervisor menjalankan Horizon dan `schedule:work` menggunakan `deploy/supervisor/gutshoes.conf`.
6. Verifikasi `/api/v1/health` dan `/api/v1/health/ready`, lalu smoke test katalog, login, checkout sandbox, dan admin authorization.

## Monitoring dan incident

Pantau HTTP 5xx/429, latency provider, queue wait/failed jobs, MySQL connections, Redis memory, low-stock, webhook signature failures, refund `FAILED`, serta umur order `PENDING_PAYMENT`. Gunakan `request_id` untuk korelasi log. Payload signature, token, password, dan data kartu tidak boleh dicatat.

Jika Midtrans/Biteship timeout, hentikan retry manual dari UI; backend mempertahankan transaksi/idempotency key. Periksa status provider sebelum replay webhook/job. Jangan mengubah status order langsung di database.

## Backup dan restore

Jalankan `scripts/backup-database.sh` ke storage terenkripsi, cek `gzip -t`, checksum, retensi, dan akses. Minimal bulanan lakukan restore ke database rehearsal terisolasi menggunakan `scripts/restore-database.sh`; nilai `RESTORE_CONFIRM` wajib sama dengan nama database tujuan. Setelah restore, jalankan migration status, integrity query, hitung order/payment/inventory, dan hapus environment rehearsal sesuai kebijakan.

## Rollback

Rollback aplikasi menggunakan artifact sebelumnya. Migration destructive dilarang dalam deploy normal; gunakan forward fix. Jika perubahan schema terbukti aman dibalik, backup dahulu dan jalankan rollback terarah setelah approval operasional.
