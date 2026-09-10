# Hasil Tahap 1: Keamanan dan Alur Transaksi

Tanggal verifikasi akhir: 7 September 2026. Status: implementasi lokal selesai; belum merupakan persetujuan produksi.

## Perubahan

- Pembayaran dan pembatalan memerlukan kepemilikan akun/admin atau token guest. Email saja tidak lagi memberi akses. Token guest lama tidak dapat melewati kepemilikan setelah order terhubung ke akun. Pembatalan admin tercatat di audit.
- Idempotency checkout dibatasi per pemilik cart. Percobaan checkout menyimpan payload dan kunci yang sama untuk pemulihan setelah respons hilang atau halaman dimuat ulang. Tidak ada pembuatan pesanan demo ketika API gagal.
- Cart customer menggunakan sesi server; claim cart guest hanya sekali. Mutasi cart mengunci baris dan memeriksa status aktif agar tidak mengubah cart yang sudah dikonversi.
- Daftar/detail pesanan akun menggunakan API. Kegagalan pembatalan tidak membuat UI mengaku berhasil. Permintaan frontend memiliki batas waktu 20 detik.
- Intent pembayaran disimpan sebelum panggilan provider. Respons yang tidak pasti memblokir pembuatan token baru secara membabi buta. Deadline Snap mengikuti deadline order.
- Pembatalan/expiry mengonfirmasi status provider sebelum melepas stok. Jika pembayaran lebih dulu berhasil, sistem melakukan rekonsiliasi. Kegagalan satu order tidak menghentikan pemrosesan expiry order lainnya.
- Webhook memeriksa nominal, identitas transaksi, currency, dan penerimaan fraud capture. Pembayaran terlambat atau reservasi tidak lengkap tidak menjual stok yang sudah dilepas; sistem membuat refund PENDING untuk review, tanpa mengirim uang otomatis.
- Dokumentasi kontrak API diperbarui pada docs/api/openapi.yaml.

## Verifikasi

- Pest: **89 tes lulus, 405 assertions**, SQLite in-memory dan provider fake; mencakup otorisasi, retry, amount mismatch, timeout, webhook ulang/terlambat, expiry dan cancellation race.
- PHPStan/Larastan level 6: tidak ada error. Laravel Pint diterapkan.
- Frontend ESLint dan build Vite lulus. Build masih menampilkan peringatan directive use client dari dependensi.
- Simulasi browser pada 1440px dan 390px lulus: cart setelah reload, kegagalan tarif, respons checkout hilang lalu dipulihkan dengan kunci sama, serta pembatalan gagal lalu berhasil. API browser dimock, bukan transaksi provider nyata. Tampilan kedua ukuran diperiksa.
- Belum menguji konkurensi multiproses pada MySQL/Redis atau kontrak Midtrans terhadap sandbox nyata.

## Deployment dan operasional

Migration 2026_09_06_000000_add_payment_initialization_state.php sudah diterapkan pada database lokal. Environment lain harus menjalankan migration sebelum kode baru digunakan; migration menambahkan initialization_state dan redirect_url pada payments. Restart queue worker setelah deployment. Scheduler expiry memakai ExpirePendingOrders; job pelepasan reservasi lama mendelegasikan ke alur tersebut.

Intent berstatus uncertain sengaja menahan retry inisialisasi dan pelepasan stok bila status provider belum bisa dipastikan. Jangan menghapus record pembayaran untuk memaksa retry. Pemulihan intent melalui rekonsiliasi provider adalah pekerjaan tahap 2 dan wajib sebelum produksi. Refund PENDING masih membutuhkan review dan penyelesaian sesuai hasil provider.

## Berikutnya

Lanjutkan Midtrans sandbox: kredensial test, callback HTTPS, verifikasi cancel/expire Snap dan Core, pemulihan intent uncertain, settlement/capture/failure, replay webhook dan refund. Setelah itu verifikasi agregator logistik, lengkapi MVP PRD, staging/UAT, lalu produksi mengikuti checklist. Tidak ada pembayaran, refund, atau pemesanan pengiriman nyata yang dilakukan pada tahap ini.
