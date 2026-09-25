# Arsitektur Pengiriman MVP GutShoes

## Keputusan MVP

MVP menggunakan **RajaOngkir Shipping Cost** untuk dua kemampuan eksternal:

1. menghitung pilihan tarif pengiriman saat checkout; dan
2. membaca pelacakan berdasarkan nomor resi.

Pembuatan order ke kurir, pickup, pencetakan label, pembatalan pengiriman, dan rekonsiliasi tagihan kurir tetap dilakukan secara manual oleh admin operasional. Admin memasukkan nomor resi dan memperbarui status pengiriman melalui modul fulfillment yang sudah ada.

## Batas antarmuka

Integrasi dipisahkan berdasarkan kemampuan agar proses bisnis tidak bergantung pada bentuk respons satu vendor.

| Kemampuan | Abstraksi | Implementasi MVP | Implementasi kedua |
| --- | --- | --- | --- |
| Tarif | `ShippingProvider` | `RajaOngkirShippingProvider` | `BiteshipShippingProvider` |
| Pemetaan wilayah | `ShippingAreaMapper` | `RajaOngkirShippingAreaMapper` | `BiteshipShippingAreaMapper` |
| Pelacakan | `ShipmentTracker` | `RajaOngkirShipmentTracker` | `NullShipmentTracker` |

`FakeShippingProvider` dan `FakeShippingAreaMapper` dipakai untuk pengembangan dan pengujian tanpa memanggil vendor. `NullShipmentTracker` menjaga proses fulfillment lokal tetap bekerja ketika tracking eksternal dimatikan.

## Alur utama

### Tarif checkout

1. Pelanggan memilih alamat internal GutShoes.
2. Server memvalidasi relasi provinsi, kota/kabupaten, kecamatan, dan kode pos.
3. `ShippingAreaMapper` mencari ID tujuan milik provider. Hasil hanya diterima jika tepat satu kandidat cocok dengan kecamatan dan kode pos; hasil kosong atau ambigu ditolak.
4. `ShippingProvider` meminta tarif berdasarkan ID asal gudang, ID tujuan, berat total, jumlah, dan kurir.
5. Server menormalisasi hasil menjadi daftar `ShippingQuote`, memilih layanan yang diminta atau tarif termurah, lalu mengirim `shipping_options` dan pilihan aktif ke storefront.
6. Saat order dibuat, server menghitung ulang tarif. Harga pengiriman dari browser tidak dipercaya.

### Fulfillment manual

1. Order yang sudah siap diproses muncul pada admin operasional.
2. Admin memesan pengiriman di portal/kanal operasional kurir.
3. Admin memasukkan nomor resi dan mengubah status shipment.
4. Perubahan status tetap tercatat pada timeline internal sebagai sumber audit proses bisnis.

### Tracking pelanggan

1. Endpoint tracking membaca order dan shipment milik pelanggan.
2. Jika nomor resi tersedia, `ShipmentTracker` meminta riwayat ke RajaOngkir.
3. Respons vendor dinormalisasi dan ditampilkan bersama timeline internal.
4. Jika vendor gagal atau timeout, endpoint tetap mengembalikan status lokal dengan penanda `tracking_unavailable`; kegagalan vendor tidak menghilangkan riwayat operasional.

## Pengamanan data wilayah

`provider_area_id` adalah ID eksternal dan tidak portabel antar-provider. Aturan operasionalnya:

- alamat pelanggan selalu dipetakan ulang oleh mapper aktif sebelum quote dan pembuatan order;
- ID asal gudang harus berasal dari provider yang sedang aktif;
- pergantian `SHIPPING_DRIVER` mewajibkan pemetaan ulang ID wilayah gudang sebelum traffic checkout dialihkan;
- kecocokan tujuan harus unik berdasarkan kecamatan dan kode pos; aplikasi tidak mengambil kandidat pertama;
- API key hanya berada di environment backend dan tidak dikirim ke frontend atau disimpan pada order.

Untuk migrasi provider tanpa downtime, siapkan dan validasi ID gudang provider baru di staging, aktifkan konfigurasi pada satu deployment, lakukan smoke test quote, kemudian alihkan traffic. Jangan menyalin ID wilayah dari provider lama.

## Konfigurasi produksi MVP

```dotenv
SHIPPING_DRIVER=rajaongkir
TRACKING_DRIVER=rajaongkir
RAJAONGKIR_URL=https://rajaongkir.komerce.id/api/v1
RAJAONGKIR_API_KEY=replace-with-secret
RAJAONGKIR_COURIERS=jne:sicepat:jnt:ninja:tiki:anteraja:pos
```

Simpan API key pada secret manager deployment. Atur timeout HTTP, retry terbatas hanya untuk operasi baca yang aman, log correlation ID tanpa API key atau data pribadi lengkap, dan pasang alert untuk lonjakan kegagalan mapping, quote, serta tracking.

## Kriteria siap integrasi

- ID wilayah gudang RajaOngkir telah diisi dan berhasil menghasilkan quote.
- Seluruh alamat uji utama dapat dipetakan secara unik.
- Pilihan layanan dan biaya dari server tampil dinamis di checkout.
- Order menghitung ulang tarif dan stok dalam transaksi server.
- Admin dapat memasukkan resi tanpa membuat shipment melalui API vendor.
- Pelanggan dapat melihat tracking provider; kegagalan provider tetap menampilkan timeline lokal.
- API key produksi tidak berada di repository atau bundle frontend.
- Build, pemeriksaan statis, contract test provider, dan smoke test browser checkout/order/tracking lulus pada environment dengan ekstensi PHP proyek yang lengkap.

## Jalur peningkatan setelah MVP

Jika kemudian diperlukan booking shipment, pickup, label, webhook status, multi-origin, COD, atau asuransi, tambahkan capability baru seperti `ShipmentBooker` dan `ShipmentWebhookHandler`. Jangan memperbesar `ShippingProvider` karena tarif, booking, dan tracking memiliki siklus kegagalan serta kebutuhan idempotensi yang berbeda.
