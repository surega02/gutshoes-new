# Arsitektur Frontend GutShoes

Frontend dibagi berdasarkan tanggung jawab agar perubahan dan problem solving tidak terpusat di satu file besar.

## Struktur

```text
src/
├── assets/
│   └── styles/       Stylesheet storefront, akun, hardening, dan admin
├── admin/
│   ├── components/   Komponen UI dan editor khusus admin
│   ├── hooks/        Pengambilan resource admin
│   ├── lib/          Helper transformasi data admin
│   └── pages/        Halaman operasional admin
├── components/
│   ├── catalog/      Komponen katalog yang dapat digunakan ulang
│   ├── checkout/     Komponen ringkasan transaksi
│   ├── forms/        Field dan pemilih wilayah
│   ├── layout/       Header, footer, dan shell akun
│   └── ui/           Primitive UI bersama
├── lib/              Routing dan helper domain storefront
├── pages/            Halaman storefront
│   └── account/      Halaman profil, alamat, dan pesanan customer
├── AdminPanel.jsx    Shell dan routing section admin
└── App.jsx           State dan orchestration utama storefront
```

## Panduan Problem Solving

- Masalah pada satu halaman storefront diperiksa di `pages/`.
- Masalah profil, alamat, atau riwayat pesanan diperiksa di `pages/account/`.
- Masalah UI yang muncul di beberapa halaman diperiksa di `components/`.
- Masalah styling diperiksa di `assets/styles/` sesuai domain stylesheet.
- Masalah cart mapping, guest-order storage, atau hash routing diperiksa di `lib/`.
- Masalah satu modul admin diperiksa di `admin/pages/` dan editor terkait di `admin/components/`.
- `App.jsx` dan `AdminPanel.jsx` hanya mengatur state tingkat aplikasi, navigasi, dan komposisi halaman.

## Aturan Pengembangan

1. Satu komponen utama disimpan dalam satu file.
2. Komponen khusus halaman tetap dekat dengan domainnya; jangan dipindahkan ke shared UI sebelum digunakan berulang.
3. Primitive UI tidak berisi keputusan bisnis.
4. Pemanggilan API tetap berada di page, hook, atau domain component yang memilikinya.
5. Jalankan `npm run lint` dan `npm run build` setelah memindahkan atau menambah komponen.

## Katalog API dan verifikasi

`lib/useCatalog.js` mengikat respons ke query/slug aktif dan membatalkan request saat berubah. Katalog meminta 12 produk per halaman dengan pencarian (debounce 300 ms), brand, kategori, harga, ukuran, serta sort server. Metadata `filters` berisi seluruh pilihan katalog, terpisah dari hasil halaman aktif. Detail memanggil `/products/{slug}` sendiri; kartu memiliki tautan yang dapat dibuka di tab baru.

Dari `apps/storefront`, jalankan `node scripts/verify-catalog.mjs` dengan backend lokal dan Vite aktif serta minimal lima produk terpublikasi. Skrip memakai Chrome headless, tidak menulis database, dan memperkecil `per_page` menjadi 2 khusus fase pagination agar dataset demo dapat menguji beberapa halaman. Fase lainnya memakai request normal. Override lingkungan tersedia: `STOREFRONT_URL`, `CATALOG_API_URL`, dan `CHROME_PATH`.

Cakupan: render setelah fetch, pencarian SKU, brand, terlaris, pagination/reset, detail dari halaman lanjut dan URL langsung/reload, 404, hasil kosong, retry kegagalan API, respons terlambat, serta filter dan sort mobile. Screenshot desktop/mobile disimpan ke folder sementara `gutshoes-catalog-qa`.
