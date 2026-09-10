# Audit Kesiapan MVP GutShoes — 6 September 2026

## Keputusan

Bisa memulai pekerjaan integrasi Midtrans sandbox dan Biteship test mode, tetapi belum siap mengaktifkan transaksi produksi. Adapter HTTP sudah ada; implementasi masih mempunyai celah kontrak provider, otorisasi, dan kelengkapan alur frontend. Mengisi API key saja belum cukup.

Audit ini membandingkan PRD v1.0 dengan kode working tree saat diperiksa, termasuk perubahan lokal yang belum di-commit. Dokumen penyelesaian backend sebelumnya tidak dipakai sebagai bukti kelengkapan MVP.

## Bukti verifikasi dan batasan

- Dijalankan ulang: `php vendor/bin/pest --compact` dengan APP_ENV=testing, SQLite :memory:, MIDTRANS_DRIVER=fake, SHIPPING_DRIVER=fake. Hasil: **64 passed, 306 assertions**, 10,56 detik.
- Build dan lint frontend berhasil pada pekerjaan navigasi sebelumnya dalam sesi ini; tidak dijalankan ulang untuk audit tanpa perubahan aplikasi.
- Inspeksi PRD, router, controller, service domain, frontend, tes, konfigurasi contoh, CI, dan runbook.
- Dokumentasi resmi Midtrans/Biteship diperiksa pada tanggal audit.
- Tidak melakukan transaksi provider, mengirim email, mengubah konfigurasi/rahasia, atau memodifikasi data bisnis.
- Belum dibuktikan: akun provider aktif, konfigurasi lingkungan aktual, UAT Google OAuth nyata, sandbox end-to-end, race test MySQL, antrean produksi, backup/restore aktual, dan status CI remote.
- Kelulusan tes yang ada bukan sertifikasi production-ready: belum ditemukan tes HTTP adapter Biteship/Midtrans menggunakan fixture kontrak provider maupun tes transaksi serentak MySQL.

## Matriks fitur PRD

| Area / PRD | Status berdasarkan kode | Kekurangan / pekerjaan |
|---|---|---|
| Landing dan navigasi, §51–52 | Ada | Perbaikan jeda selesai; UAT konten/data produk nyata tetap diperlukan. |
| Katalog, pencarian/filter/sort/paginasi, §11/70 | Parsial | Frontend hanya mengambil 48 produk pertama; filter/search lokal tidak menjangkau halaman berikut. Filter merek khusus dan sort terlaris belum ada. `useMemo` hasil filter tidak bergantung pada `products`, sehingga hasil bisa tertinggal setelah fetch selesai. |
| Detail produk, §6–12 | Parsial | Route mencari produk di array katalog, belum mengambil endpoint detail berdasarkan slug; tautan produk di luar 48 hasil dapat gagal. Informasi diskon tidak dikirim resource katalog. |
| Produk/brand/kategori/size/admin, §7–10/54 | Fondasi CRUD ada | Upload belum membatasi maksimum 5 gambar; urutan otomatis saat upload, belum ada operasi reorder gambar yang ditemukan. Verifikasi end-to-end publication, varian, soft delete dan gambar. |
| Google login dan guest linking, §13/50 | Backend ada | Socialite, email verified, dan pengaitan order sesuai email ada. OAuth nyata belum diuji; data foto Google belum dipersistensikan di callback. |
| Profil, §14 | Belum tersambung penuh | Form hanya `setUser`, tidak memanggil `api.updateProfile`; tanggal pembaruan hard-coded. Data akan hilang saat sesi dimuat ulang. |
| Multi-alamat dan snapshot, §15–16 | Fondasi ada | API dan wilayah berhierarki ada; penyelarasan ID wilayah agregator masih kurang. |
| Cart guest/customer, §17 | Parsial, blocker customer | UI reload/checkout bergantung pada guest token, sementara cart customer server memiliki guest_token null. Ubah ukuran dalam cart belum ada. API membatasi 20 item, bertentangan dengan PRD yang hanya membatasi sesuai stok. |
| Checkout dan snapshot, §18–19/35 | Fondasi ada | Kalkulasi backend, snapshot, idempotency dan reservasi ada. Jalur customer login serta fallback demo perlu dituntaskan. Jangan otomatis melanjutkan simulasi checkout pada kegagalan API di produksi. |
| Ongkir/provider/gudang, §20–21 | Adapter awal | ID area, auth header, berat, daftar layanan, dan konfigurasi gudang belum siap untuk kontrak nyata. Tarif regional di luar Jabodetabek menyimpang dari perhitungan provider; cakupan beberapa provinsi ditolak. |
| Shipment/tracking, §22 | Manual | Shipment lokal, input resi dan status admin ada. Booking/pickup/label provider serta webhook/polling tracking belum ada. PRD tidak eksplisit mewajibkan booking otomatis; untuk MVP minimal pastikan resi dan pelacakan nyata dapat diakses pelanggan. |
| Midtrans/payment/webhook, §23–28 | Adapter dan domain ada | Belum uji sandbox. Expiry, timeout ambigu, rekonsiliasi, event terlambat, failure/refund, dan konsistensi status perlu diperbaiki. |
| Order lifecycle/cancellation, §29–31 | Parsial, blocker keamanan | State machine ada. Pembatalan tanpa sesi hanya mengandalkan nomor order+email; harus meminta ownership atau token akses guest. Pembatalan pending belum membatalkan tagihan provider. |
| Refund, §32 | Fondasi ada | Review/proses admin dan HTTP provider ada; hasil tidak boleh disimpulkan hanya dari status_code. Belum ada rekonsiliasi/notifikasi refund provider lengkap. |
| Inventory/reservation, §36–39 | Fondasi dan tes ada | Lock, transaksi, movement, reserve/release/sell tersedia. Job release reservasi dan expiry order terpisah perlu koordinasi dengan webhook; perlu race test pada MySQL. |
| Diskon, §41–42 | Parsial | Pricing hanya menarget produk. Target kategori/brand serta resolusi prioritas Product > Category > Brand > Global belum tersedia. |
| Voucher/free shipping, §43–47 | Dasar ada | Minimum, masa berlaku, batas global, restriction produk dan gratis ongkir ada. Keranjang campuran perlu memperjelas apakah diskon berlaku pada item eligible atau seluruh order; saat ini satu produk eligible membuat seluruh subtotal mendapat persentase. Batasi persentase <=100 dan uji batas penggunaan serentak. |
| Riwayat dan guest tracking, §48–50 | Fondasi ada | Endpoint guest token/recovery, nomor+email untuk tracking, customer list/detail ada. Pastikan pagination UI dan pemulihan setelah redirect provider. |
| Customer admin, §57 | Parsial | Baru daftar pelanggan; belum ada detail profil, pesanan, dan alamat pelanggan. |
| Dashboard, §59 | Parsial | Ada total pendapatan, pending/paid/processing dan low stock. Belum semua metrik hari ini, shipped/completed, top products, dan ringkasan pendapatan sesuai PRD. |
| Audit, §60 | Parsial | Middleware mencatat mutasi admin, tetapi entity ID/type belum konsisten. Pembatalan via route umum di luar middleware audit admin. |
| Konfigurasi, §61 | Parsial | CRUD key/value ada; belum ditemukan pengelolaan origin gudang yang tersambung ke Warehouse dan konsumsi pengaturan publik storefront secara lengkap. |
| Email, §62–63 | Parsial | Job after-commit, log dan beberapa event ada. Cancel/refund completed belum mengirim; expiry dari scheduler tidak mengirim email. SMTP/queue nyata belum diuji. Daftar jenis email di PRD bersifat rekomendasi. |
| Operasional/nonfungsional, §64/70 | Fondasi ada | Sanctum, policy, throttle, supervisor/runbook/CI ada. Perlu staging HTTPS, konfigurasi aman provider nyata, monitoring, backup restore dan UAT tanpa manipulasi DB. |

## Prioritas P0: sebelum uji transaksi end-to-end dinyatakan lulus

### 1. Ownership pembayaran/pembatalan

Bukti: `apps/backend/routes/api.php`, `app/Http/Controllers/Api/V1/CancellationRefundController.php`, `PaymentController.php`.

Route umum tidak membutuhkan auth dan hanya mengecek ownership jika user hadir. Nomor order + email cukup bagi pengunjung tanpa sesi untuk menjalankan pembatalan, termasuk order customer. Ini berbeda dengan tracking dasar yang memang diminta PRD menggunakan nomor+email. Terapkan policy customer/admin dan token guest untuk aksi sensitif; arahkan payment ke endpoint token guest yang sudah ada. Tambah tes anonymous, customer lain, token salah, dan admin. Pastikan admin cancellation masuk AuditLog.

### 2. Keranjang dan checkout pengguna login

Bukti: `apps/storefront/src/App.jsx` (`ensureServerCart`, `reloadCart`), `pages/Checkout.jsx` (`!guestCartToken`), `apps/backend/app/Domain/Cart/CartResolver.php`.

Jangan gunakan keberadaan guest token sebagai tanda satu-satunya cart server. Cart login menggunakan cookie sesi; muat ulang setelah sesi selesai dan saat login/logout. Uji login tanpa token guest, refresh, logout, guest-to-customer, serta checkout kedua setelah cart dikonversi. Jangan menyamakan fallback demo dengan order nyata; produksi harus berhenti dengan error yang bisa dicoba lagi.

### 3. Kontrak ongkir Biteship

Bukti: `BiteshipShippingProvider.php`, `RegionAddressResolver.php`, `CheckoutQuoteController.php`, `CreateOrderService.php`, `pages/Checkout.jsx`.

- Kode kelurahan internal dipakai sebagai provider_area_id. Biteship membutuhkan Area ID dari Maps API atau pilihan koordinat/kode pos yang didukung.
- `withToken` membentuk header Bearer; contoh autentikasi resmi mengirim API key langsung pada Authorization. Selaraskan dan tes.
- Controller sudah menjumlahkan berat × quantity, tetapi adapter memasukkan total berat itu sebagai berat satu item lalu memasukkan total quantity lagi. Contoh 2 sepatu × 500g: total 1000g dikirim dengan quantity 2, berisiko dihitung 2000g. Kirim setiap item dengan berat satuan, atau total paket dengan quantity 1 sesuai model provider.
- Frontend mematok JNE REG/YES; API hanya mengembalikan layanan terpilih. Tambahkan endpoint daftar tarif dan pilihan courier+service dinamis; kode provider seperti `reg` tidak sama dengan `REG` pada pencocokan ketat sekarang.
- ETA string seperti `1 - 2 days` dipotong menjadi integer; simpan rentang/satuan.
- Konfigurasi origin gudang harus berasal dari data valid provider. Jangan diam-diam mengirim nilai placeholder.
- Tinjau kebijakan `ShippingRateResolver`: provider hanya untuk Jabodetabek, wilayah lain tarif per item. Jika ini perubahan bisnis yang disetujui terpisah, dokumentasikan pengecualian PRD; jika tidak, kembalikan ke ongkir berbasis provider dan cakupan eksplisit.

### 4. Expiry, pembatalan dan pembayaran terlambat

Bukti: `HttpMidtransProvider.php`, `CreatePaymentService.php`, `ProcessMidtransWebhook.php`, `ExpirePendingOrders.php`, `ReleaseExpiredInventoryReservations.php`, `CancelOrderService.php`.

Order berakhir 24 jam setelah dibuat, tetapi Snap mulai 24 jam sejak token dibuat. Token yang dibuat lebih lambat membuat tagihan aktif setelah stok dilepas. Pakai deadline order yang sama. Cancel pending saat ini hanya mengubah DB lokal, belum meminta cancel/expire provider. Webhook settlement untuk order CANCELLED/EXPIRED tidak ditangani sebagai kasus rekonsiliasi.

Job release reservasi terpisah bisa melepas stok saat order masih pending; handler success kemudian dapat menandai paid tanpa menemukan reservasi aktif. Koordinasikan expiry, stok dan status provider dalam satu kebijakan transaksi. Uji expiry bersamaan webhook, pembayaran terlambat, duplicate dan out-of-order events.

CreatePayment memanggil API jaringan di dalam transaksi DB. Jika provider sukses tetapi respons timeout, rollback lokal tidak membatalkan transaksi remote. Tambahkan pemulihan status/token/idempotency provider; tes saat provider sukses namun respons hilang.

Validasi amount/currency terhadap order, recheck status setelah lock, tangani `failure`, fraud status, serta alur refund. Status internal sekarang menggunakan SETTLEMENT/CAPTURE/EXPIRE dll; PRD meminta PENDING/SUCCESS/FAILED. Pisahkan status internal dari status mentah provider atau setujui pemetaan eksplisit.

## Prioritas P1: lengkapi fitur sebelum rilis MVP

1. Profil disimpan ke API, foto Google dan timestamp nyata.
2. Pagination/search/filter/sort server-side; filter brand, terlaris, detail berdasarkan slug; perbaiki dependency memo katalog.
3. Ganti ukuran cart dan hapus batas artifisial 20, tetap validasi stok server.
4. Diskon kategori/brand dengan prioritas; batas persentase; tampilan harga/diskon konsisten.
5. Maksimal lima gambar, reorder, pengaturan gudang yang terhubung, konfigurasi publik.
6. Detail customer admin, dashboard sesuai PRD, pagination daftar besar, entity metadata audit.
7. Status pembayaran/refund dari backend, pemulihan setelah browser ditutup/redirect, email dan tracking nyata.

## Urutan implementasi yang disarankan

| Tahap | Pekerjaan | Kriteria selesai |
|---|---|---|
| A — Perbaikan inti | Ownership, cart customer, fallback demo, expiry/cancel/stok | Tes kasus gagal dan regresi lulus; customer dan guest bisa membuat order server secara benar. |
| B — Midtrans sandbox | Kredensial sandbox melalui environment, HTTP adapter, callback HTTPS, webhook, rekonsiliasi, refund | Payment success hanya dari backend; duplikasi tidak menjual stok dua kali; gagal/expiry/cancel/timeout/late settlement tertangani. |
| C — Logistik test | Konfirmasi provider (kode sekarang Biteship), ID area/origin, berat, layanan dinamis, tarif | Tarif sesuai request provider untuk 1/multi item dan tujuan yang didukung; quote dan order konsisten. |
| D — Fulfillment | Admin processing/input resi atau booking API sesuai scope, pelacakan aktual | Order dapat dikirim dan ditandai delivered dengan sumber status jelas; pelanggan melihat resi/status. |
| E — Kelengkapan PRD | Semua P1, SMTP dan konfigurasi bisnis | Semua operasi normal bisa dilakukan melalui UI; tidak perlu edit database. |
| F — Staging/UAT | MySQL+Redis, queue/scheduler, OAuth, SMTP, observabilitas dan restore | UAT guest/customer/admin lengkap, uji stock race dan webhook replay; bukti hasil disimpan. |
| G — Go live | Akun provider produksi, secret/domain production, smoke test terkendali | Seluruh blocker selesai dan UAT disetujui; lingkungan fake tidak bisa aktif diam-diam di produksi. |

Tahap sandbox dapat dipersiapkan sekarang. Credential test saja bukan bukti integrasi selesai. Booking otomatis/pickup/label merupakan keputusan scope tambahan bila operasi manual resi memang dipilih untuk MVP; tracking nyata tetap harus dijelaskan dan diuji.

## Yang perlu disiapkan pemilik aplikasi

- Akun Midtrans dan akses sandbox; metode bayar yang akan diuji, URL staging HTTPS untuk notifikasi dan finish/error/unfinish sesuai konfigurasi integrasi.
- Konfirmasi agregator: kode sudah mengarah ke Biteship, PRD belum mengunci provider. Test key dan layanan kurir yang tersedia pada akun.
- Data origin gudang nyata: alamat lengkap, kontak, kode pos, area provider, serta berat tiap varian.
- Google OAuth client/callback staging dan SMTP pengirim email.
- Hosting staging dengan PHP sesuai composer, MySQL, Redis, worker antrean, scheduler dan storage gambar.
- Produk/brand/foto/harga/stok nyata serta keputusan tarif regional bila akan dipertahankan.

Rahasia diisi lewat environment/secret manager, tidak perlu dikirim dalam percakapan. Tidak ada kredensial yang diminta atau dibaca pada audit ini.

## Referensi resmi integrasi

- [Midtrans — HTTP notification/webhooks](https://docs.midtrans.com/docs/https-notification-webhooks): signature, status dan perilaku notifikasi.
- [Midtrans — Snap advanced feature](https://docs.midtrans.com/docs/snap-advanced-feature): expiry start_time/duration.
- [Midtrans — Technical FAQ](https://docs.midtrans.com/docs/technical-faq): status_code bukan status transaksi; gunakan transaction_status.
- [Midtrans — Refund transactions](https://docs.midtrans.com/reference/refund-transaction): kontrak refund yang harus diverifikasi per metode pembayaran.
- [Biteship — Rates](https://biteship.com/en/docs/api/rates/retrieve): area, berat per item, quantity, courier/service dan ETA.
- [Biteship — Authentication](https://biteship.com/id/docs/api/authentication): bentuk Authorization API key.
- [Biteship — Base URL](https://biteship.com/en/docs/api/base_url): key menentukan test/live mode.


> Pembaruan 7 September 2026: baseline audit ini mendahului perbaikan tahap 1. Lihat [hasil keamanan dan transaksi](TRANSACTION_SAFETY_PHASE1.md) dan [checklist implementasi](MVP_IMPLEMENTATION_CHECKLIST.md). Daftar/detail pesanan akun kini memakai API; status kesiapan produksi tetap menunggu sandbox dan UAT.
