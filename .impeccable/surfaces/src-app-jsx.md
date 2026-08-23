---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: []
---

# Storefront GutShoes

- Scope: alur customer storefront React dari beranda, katalog, detail produk, keranjang, checkout, pembayaran, hingga pelacakan; mode Persuade beralih ke Operate.
- Audience/job: pembeli Indonesia yang peka harga dan pembeli sepatu olahraga umum; menemukan produk, memahami harga serta stok ukuran, membeli sebagai tamu, lalu melacak pesanan.
- Chosen direction: standar toko sepatu modern dengan craft benchmark Foot Locker dan Department; logo asli, bidang putih, tinta gelap, cyan GutShoes, fotografi produk bersih, serta harga dan ukuran sebagai informasi dominan.
- Approved comp: `.impeccable/mocks/storefront/option-balanced.png`; literalize struktur header–hero–kategori–rak produk, tetapi jangan menganggap nama, harga, merek, atau klaim pada comp sebagai data produksi.
- Memorable moment: sepatu hero navy melayang di atas geometri cyan logo, lalu kategori aktivitas mengubah persuasi menjadi navigasi katalog.
- Constraints: data komersial pada implementasi adalah demo berlabel; backend tetap menghitung total, memvalidasi stok dan voucher, serta webhook Midtrans menjadi sumber kebenaran pembayaran.

## Comp inventory

| Ingredient | Grammar/commitment | Medium |
|---|---|---|
| Navigation | logo, search dominan, tracking/account/cart, garis tipis | semantic HTML + authored SVG icons |
| Hero | split 43/57, headline besar, CTA kiri, produk dan marka cyan kanan | HTML/CSS + generated transparent WebP |
| Product imagery | packshot seragam, objek tunggal, latar transparan | generated WebP with provenance |
| Category rail | enam tujuan aktivitas, satu baris desktop, horizontal scroll mobile | semantic buttons |
| Product shelf | empat kolom desktop, dua kolom mobile, harga tabular | semantic cards |
| Component grammar | radius 10–14px, border #e2e7eb, elevation hanya untuk CTA/panel penting | CSS |
| Typography | Manrope variable; display rapat, body lapang | self-hosted WOFF2 |
| Page ground | #ffffff; dominant soft field #f5f7f8; ink #101820; cyan #02a9df/#007db6 | CSS tokens |

Open decision: API Laravel, shipping provider, Google OAuth, dan kredensial Midtrans belum tersedia sehingga integrasi network nyata tidak boleh diciptakan oleh frontend.
