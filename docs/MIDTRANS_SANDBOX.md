# Integrasi Midtrans Sandbox

Status 7 September 2026: adapter HTTP Snap dan webhook tersedia; alat pemulihan dan pemeriksaan ditambahkan. Uji provider nyata belum dilakukan: Server Key lokal kosong, driver fake, APP_URL masih localhost.

## Konfigurasi backend

Isi apps/backend/.env secara lokal, jangan memasukkan kunci ke Git atau chat:

~~~dotenv
MIDTRANS_DRIVER=http
MIDTRANS_SERVER_KEY=<Server Key sandbox dari dashboard Midtrans>
MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/v1/transactions
MIDTRANS_API_URL=https://api.sandbox.midtrans.com/v2
MIDTRANS_REDIRECT_BASE_URL=https://app.sandbox.midtrans.com/snap/v4/redirection
APP_URL=https://<backend-publik>
STOREFRONT_URL=https://<storefront>
~~~

Mode yang dipakai adalah Snap Redirect; Client Key tidak dibutuhkan untuk membuka redirect_url. MIDTRANS_IS_PRODUCTION pada contoh env lama tidak dibaca kode; endpoint URL menentukan environment. Jangan mengganti endpoint sandbox ke live untuk pengujian ini.

Dari apps/backend jalankan php artisan config:clear lalu php artisan midtrans:sandbox-check. Pemeriksaan ini tidak mengirim request dan tidak mencetak kunci. Driver lokal tetap fake sampai kunci siap agar checkout tidak rusak karena konfigurasi setengah terpasang.

## Dashboard sandbox

Set Payment Notification URL ke https://<backend-publik>/api/v1/payments/midtrans/webhook. URL harus HTTPS publik dan tidak membutuhkan login. Set Finish/Unfinish/Error Redirect URL ke halaman storefront. Status query pada redirect bukan bukti pembayaran; keputusan status tetap dari webhook terverifikasi atau status API. Jalankan queue worker dan scheduler pada environment pengujian. Gunakan data pembeli sintetis dan mail catcher.

## Pemulihan intent

Perintah php artisan midtrans:sandbox-recover NOMOR-ORDER hanya berjalan dengan kunci dan endpoint sandbox. Perintah mengunci order/payment dan meminta status provider. Settlement atau capture accept direkonsiliasi dengan pemeriksaan nominal dan reservasi. Jika Core belum menemukan charge, intent tanpa token lebih tua dari dua menit dan order masih aktif dapat memperoleh token baru menggunakan order_id yang sama. Sesuai dokumentasi Snap, token baru menggantikan token lama yang belum digunakan. Timeout tetap tidak melepas stok. Perintah tidak mencetak token.

Status pending atau terminal non-sukses yang ditemukan tidak memicu token baru. Operator perlu melihat dashboard dan alur pembatalan/expiry. Intent yang sudah melewati deadline dan kehilangan token masih membutuhkan review provider; tidak dipulihkan otomatis. Perintah ini dijalankan operator, belum berupa rekonsiliasi terjadwal.

Deny/failure dapat berasal dari satu percobaan metode pembayaran dalam sesi Snap. Webhook tersebut kini tidak melepas reservasi atau mengunci identitas transaksi final. Penutupan HTTP juga tidak menganggap deny/failure sebagai konfirmasi sesi sudah ditutup; stok ditahan sampai cancel/expire terkonfirmasi atau review selesai.

## Matriks uji provider yang masih wajib

- Buat checkout guest/customer dan buka redirect_url sandbox yang sebenarnya.
- Selesaikan pembayaran melalui simulator, pastikan webhook mengubah order menjadi PAID sekali saja.
- Tolak satu percobaan lalu bayar menggunakan metode lain pada order sama.
- Uji pending, pembatalan sebelum/sesudah memilih metode, expiry, dan callback berulang.
- Putuskan respons inisialisasi dan jalankan pemulihan; validasi token lama tidak dapat digunakan setelah diganti.
- Uji pembayaran terlambat menjadi refund PENDING dan verifikasi dukungan refund per metode tanpa menganggap pencatatan lokal sebagai refund berhasil.
- Uji callback publik, queue/email, MySQL/Redis dan race nyata sebelum produksi.

Tes lokal menggunakan Http::fake dan Http::preventStrayRequests. Tidak ada transaksi Midtrans nyata dibuat dalam pengerjaan ini. Tahap 2 tetap terbuka sampai matriks sandbox nyata selesai.

Referensi resmi: [integrasi Snap](https://docs.midtrans.com/docs/snap-snap-integration-guide), [retry dan pembuatan ulang token](https://docs.midtrans.com/docs/snap-advanced-feature), [webhook](https://docs.midtrans.com/docs/https-notification-webhooks).
