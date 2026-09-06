# Production Runbook GutShoes

## Deployment

1. Deploy immutable artifact dari commit yang sudah lulus Quality Gate.
2. Isi secret melalui secret manager; jangan salin file environment ke repository.
3. Jalankan composer install --no-dev --classmap-authoritative.
4. Jalankan composer deploy:database. Script ini menjalankan migrasi dan regions:import secara idempoten; deployment harus gagal bila checksum, header, jumlah baris, format kode, kode pos, duplikasi, atau hierarki CSV tidak valid.
5. Jalankan php artisan config:cache, php artisan route:cache, dan php artisan view:cache.
6. Jalankan php artisan horizon:terminate setelah symlink/release berpindah.
7. Supervisor menjalankan Horizon dan schedule:work menggunakan deploy/supervisor/gutshoes.conf.
8. Verifikasi /api/v1/health dan /api/v1/health/ready, master wilayah, lalu smoke test katalog, login, checkout sandbox, dan admin authorization.

Jangan gunakan regions:import --fresh dalam deployment rutin. Opsi tersebut menghapus tabel dari child ke parent, membutuhkan --force di production, dan dapat ditolak foreign key bila wilayah sudah direferensikan alamat. Pembaruan dataset normal dilakukan dengan mengganti CSV beserta database/data/regions/manifest.json, meninjau diff sumber, lalu menjalankan impor idempoten tanpa --fresh.

## Verifikasi master wilayah

Ekspektasi dataset pada artifact saat ini:

| Level | Jumlah |
|---|---:|
| Provinsi | 38 |
| Kota/kabupaten | 514 |
| Kecamatan | 7.285 |
| Kelurahan/desa | 83.762 |

Setelah deployment, cek output composer deploy:database dan lakukan smoke test rantai parent berikut terhadap base URL API production:

~~~bash
curl -fsS "$API_BASE/api/v1/regions/provinces"
curl -fsS "$API_BASE/api/v1/regions/regencies?province_code=31"
curl -fsS "$API_BASE/api/v1/regions/districts?regency_code=31.71"
curl -fsS "$API_BASE/api/v1/regions/villages?district_code=31.71.01"
~~~

Respons harus 200, memiliki envelope data, dan rantai contoh harus memuat:

- 31 — Daerah Khusus Ibukota Jakarta;
- 31.71 — Kota Administrasi Jakarta Pusat;
- 31.71.01 — Gambir;
- 31.71.01.1001 — Gambir, kode pos 10110.

Permintaan child tanpa parent atau dengan parent yang tidak dikenal harus menghasilkan 422. Bila impor gagal, jangan melanjutkan traffic switch. Periksa pesan validasi, cocokkan SHA-256 dan jumlah baris dengan database/data/regions/manifest.json, lalu deploy artifact yang dikoreksi. Jangan mengedit CSV langsung di server.

## Monitoring dan incident

Pantau HTTP 5xx/429, latency provider, queue wait/failed jobs, MySQL connections, Redis memory, low-stock, webhook signature failures, refund FAILED, serta umur order PENDING_PAYMENT. Gunakan request_id untuk korelasi log. Payload signature, token, password, dan data kartu tidak boleh dicatat.

Jika Midtrans/Biteship timeout, hentikan retry manual dari UI; backend mempertahankan transaksi/idempotency key. Periksa status provider sebelum replay webhook/job. Jangan mengubah status order langsung di database.

## Backup dan restore

Jalankan scripts/backup-database.sh ke storage terenkripsi, cek gzip, checksum, retensi, dan akses. Minimal bulanan lakukan restore ke database rehearsal terisolasi menggunakan scripts/restore-database.sh; nilai RESTORE_CONFIRM wajib sama dengan nama database tujuan. Setelah restore, jalankan migration status, integrity query, hitung order/payment/inventory, jalankan php artisan regions:import, verifikasi endpoint wilayah, dan hapus environment rehearsal sesuai kebijakan.

## Rollback

Rollback aplikasi menggunakan artifact sebelumnya. Migration destructive dilarang dalam deploy normal; gunakan forward fix. Data wilayah yang sudah direferensikan alamat dilindungi foreign key dan tidak boleh dihapus manual. Jika perubahan schema terbukti aman dibalik, backup dahulu dan jalankan rollback terarah setelah approval operasional.
