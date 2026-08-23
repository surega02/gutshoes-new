---
name: "GutShoes"
description: "Sistem storefront sepatu modern yang membuat produk, harga, dan ukuran mudah dipindai."
colors:
  ink: "#101820"
  muted-ink: "#59636d"
  gutshoes-cyan: "#02a9df"
  action-cyan: "#007db6"
  cyan-mist: "#e9f8fd"
  canvas: "#ffffff"
  soft-field: "#f5f7f8"
  hairline: "#e2e7eb"
  danger: "#b42318"
  success: "#087a55"
typography:
  display:
    fontFamily: "Manrope Variable, Manrope, sans-serif"
    fontSize: "clamp(2.6rem, 4.3vw, 5rem)"
    fontWeight: 750
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Manrope Variable, Manrope, sans-serif"
    fontSize: "clamp(2rem, 3vw, 3.25rem)"
    fontWeight: 750
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Manrope Variable, Manrope, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 750
    lineHeight: 1.3
  body:
    fontFamily: "Manrope Variable, Manrope, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Manrope Variable, Manrope, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 750
    lineHeight: 1.3
rounded:
  sm: "8px"
  control: "9px"
  button: "10px"
  field: "12px"
  surface: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.action-cyan}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.button}"
    padding: "12px 18px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "#006b9d"
    textColor: "{colors.canvas}"
    rounded: "{rounded.button}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "12px 18px"
    height: "48px"
  search-field:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 16px"
    height: "50px"
  product-card-image:
    backgroundColor: "#f7f8f8"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "16px"
  size-option:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "58px"
  size-option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.control}"
    height: "58px"
  account-avatar:
    backgroundColor: "{colors.action-cyan}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.pill}"
    size: "68px"
  account-nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "0 6px"
    height: "58px"
---

# Design System: GutShoes

## Overview

**Creative North Star: "Toko Sepatu Modern yang Jelas"**

GutShoes memakai bahasa visual retail olahraga yang terang, lugas, dan mudah dipercaya: bidang putih, tinta gelap, cyan merek, garis tipis, serta fotografi produk bersih. Rujukan craft-nya adalah ketegasan katalog Foot Locker dan Department, diterjemahkan menjadi pengalaman lokal yang mengutamakan pencarian, aktivitas, harga, dan ketersediaan ukuran.

Komposisi bergerak dari persuasi ke operasi. Hero memberi satu momen ekspresif—sepatu navy melayang di atas geometri cyan—lalu kategori, rak produk, detail ukuran, keranjang, checkout, pembayaran, pelacakan, autentikasi, dan pengelolaan akun kembali ke struktur yang tenang dan mudah dipindai. Login meneruskan geometri merek sebagai garis perjalanan “Temukan—Beli—Ikuti”; halaman akun memakai divider dan nav berorientasi tugas. Data komersial demo selalu diperlakukan sebagai demo; sistem visual tidak boleh membuat klaim promosi atau autentisitas baru.

**Key Characteristics:**

- Bidang putih dominan dengan lapisan abu-abu sangat lembut.
- Tinta nyaris hitam untuk hierarki kuat dan cyan untuk aksi serta orientasi.
- Harga memakai angka tabular; ukuran tampil sebagai kontrol keputusan yang nyata.
- Sudut lembut 8–14px, garis tipis, dan bayangan yang jarang.
- Fotografi packshot objek tunggal dengan latar transparan atau bidang netral.
- Tata letak responsif yang mempertahankan CTA, kategori, dan awal rak produk pada viewport mobile pertama.
- Surface akun yang operasional: state sesi jelas, navigasi stabil, form langsung, dan konfirmasi destruktif yang eksplisit.

## Colors

Palet terasa bersih dan teknis tanpa menjadi klinis: cyan memberi energi atletik, sementara putih dan abu-abu menahan kepadatan katalog.

### Primary

- **Cyan GutShoes:** warna identitas pada geometri hero, badge keranjang, dan aksen aktif.
- **Cyan Aksi:** cyan yang lebih dalam untuk CTA, tautan, status aktif, dan indikator pilihan agar tetap terbaca di atas putih.

### Neutral

- **Tinta Utama:** teks utama, judul, pilihan ukuran aktif, dan kontras struktural.
- **Tinta Redup:** deskripsi, metadata, placeholder, dan informasi sekunder.
- **Kanvas Putih:** dasar halaman, header, kontrol, dan sebagian besar permukaan.
- **Bidang Lembut:** latar gambar produk, ringkasan, dan pengelompokan konten tanpa bayangan.
- **Garis Rambut:** pembatas navigasi, kartu, field, dan section.

### Secondary

- **Kabut Cyan:** latar hover, informasi terpilih, dan panel review yang perlu terasa terkait dengan aksi utama.
- **Merah Bahaya:** pesan error dan tindakan destruktif.
- **Hijau Berhasil:** status berhasil, diskon, dan konfirmasi pembayaran.
- **Warna state akun:** `#aebbc2` untuk garis rute, `#2a5ca8` untuk identitas Google demo, `#fff0ed`/`#73443e` untuk bidang dan teks konfirmasi destruktif, serta `#e9f8f2` untuk bidang berhasil.

### Named Rules

**The Cyan Means Progress Rule.** Gunakan cyan terutama untuk merek, aksi, pilihan, dan status navigasi; jangan menyebarkannya sebagai dekorasi pada seluruh permukaan.

**The Commercial Truth Rule.** Warna tidak boleh menyamarkan data demo sebagai promo, harga pembanding, atau jaminan yang sudah terverifikasi.

## Typography

**Display Font:** Manrope Variable (dengan Manrope dan sans-serif sebagai fallback)  
**Body Font:** Manrope Variable (dengan Manrope dan sans-serif sebagai fallback)

**Character:** Satu keluarga sans-serif geometris menjaga storefront terasa modern dan konsisten. Display rapat dan berat menciptakan energi retail; body lebih lapang menjaga detail produk dan transaksi tetap nyaman dibaca.

### Hierarchy

- **Display:** bobot kuat, ukuran fluida, line-height sangat rapat; dipakai pada hero, detail produk, dan halaman status.
- **Headline:** ukuran fluida dengan tracking negatif; dipakai untuk judul section dan halaman.
- **Title:** sekitar 1.05rem dan tebal; dipakai pada nama produk serta judul kartu.
- **Body:** 1rem dengan line-height 1.6; dipakai pada copy hero, deskripsi, dan instruksi transaksi, umumnya dibatasi sekitar 60–65ch.
- **Label:** sekitar 0.76rem dan tebal; dipakai pada merek, stok, metadata, status, dan label field.
- **Rentang akun:** label sekunder 0.7–0.84rem, dialog 1.25rem, heading panel 1.7–2.4rem, heading halaman fluida 2.3–4rem, dan display login fluida 3–5.4rem.

### Named Rules

**The Price and Size First Rule.** Harga memakai `font-variant-numeric: tabular-nums`, sedangkan label ukuran harus terbaca sebagai kontrol utama, bukan metadata dekoratif.

## Layout

Header desktop memakai tiga zona—logo, pencarian dominan, dan utilitas—diikuti nav horizontal. Hero desktop berupa split sekitar 47/53, kategori enam kolom, dan rak produk empat kolom. Section menggunakan padding horizontal fluida dari 24px hingga 80px; jarak dasar berulang pada 8px, 16px, 24px, dan 48px.

Pada lebar hingga 1050px, rak dan katalog menjadi dua kolom serta kategori menjadi tiga kolom. Pada 760px ke bawah, header menjadi dua baris, pencarian selebar layar, hero ditumpuk, kategori menjadi rail horizontal snap, rak tetap dua kolom, dan layout detail/keranjang/checkout/pelacakan menjadi satu kolom. Pada mobile 390×844, komposisi aktual mempertahankan CTA, dua kategori utuh, heading dan copy “Pilihan untukmu”, serta awal kartu produk di viewport pertama. Target sentuh utama dijaga minimal 44px.

Surface login memakai split 1.1/0.9 antara copy bermotif rute dan panel tindakan putih; pada 900px split menjadi satu kolom. Halaman akun memakai header identitas, nav samping 240px, dan konten maksimum 850px. Di bawah 900px nav berubah menjadi tab horizontal yang dapat digulir; di bawah 600px padding menyempit ke 16px, judul bertumpuk, metadata profil menjadi satu kolom, dan item riwayat pesanan tidak lagi memaksa dua kolom.

**The Scan Before Scroll Rule.** Viewport pertama harus menjelaskan produk, menawarkan aksi, dan membuka jalur kategori serta rak tanpa menunda informasi belanja utama.

## Elevation & Depth

Sistem datar secara default dan mengandalkan perbedaan tonal, border tipis, clipping, serta ruang kosong untuk memisahkan lapisan. Bayangan dipakai selektif sebagai penegasan aksi atau panel penting, sementara gambar sepatu memakai drop-shadow agar objek terasa hadir tanpa mengubah kartu menjadi permukaan berat.

### Shadow Vocabulary

- **Panel Ambient:** `0 14px 40px rgba(13,34,51,.09)` untuk kartu pelacakan dan panel penting.
- **CTA Lift:** `0 8px 18px rgba(0,125,182,.2)` untuk tombol utama.
- **Product Float:** `drop-shadow(0 30px 25px rgba(7,31,45,.18))` untuk gambar hero.
- **Selection Ring:** `0 0 0 2px #c8eef8` untuk opsi pengiriman atau pembayaran terpilih.
- **Account Identity:** `0 10px 24px rgba(0,125,182,.18)` hanya untuk avatar profil utama.
- **Dialog Focus:** `0 22px 65px rgba(7,31,45,.22)` hanya untuk dialog konfirmasi yang mengisolasi fokus.

**The Flat-by-Default Rule.** Permukaan biasa menggunakan warna dan garis; elevasi hanya muncul untuk aksi, state, dan panel yang benar-benar membutuhkan prioritas.

## Shapes

Bahasa bentuk menggunakan sudut lembut dan praktis. Radius 14px menandai hero, kartu gambar, panel, serta kontainer utama; 9–12px dipakai pada field dan kontrol; 8px pada kontrol kecil; pill penuh dipakai hanya untuk badge, status, dan avatar akun. Border satu piksel menjaga struktur katalog serta daftar akun tetap ringan. Geometri miring cyan pada hero dan login adalah siluet khas, sedangkan garis horizontal tipis membentuk motif perjalanan serta struktur nav akun.

**The One Signature Angle Rule.** Pertahankan geometri miring sebagai momen khas produk pada hero atau galeri; jangan mengulangnya pada kartu dan form transaksi.

## Components

### Buttons

- **Shape:** persegi panjang kompak dengan sudut lembut dan tinggi minimum 48px; mobile hero mempertahankan minimum 44px.
- **Primary:** cyan aksi dengan teks putih, padding 12px × 18px, bobot 750, dan bayangan CTA.
- **Hover / Focus:** hover naik 1px dan menjadi cyan lebih dalam; focus-visible memakai outline cyan muda 3px dengan offset 3px.
- **Secondary / Ghost:** secondary putih dengan border abu-abu; ghost transparan untuk aksi rendah dan navigasi balik.

### Cards / Containers

- **Corner Style:** permukaan utama 14px; kartu gambar mobile menyesuaikan ke 11px.
- **Background:** gambar produk berada pada bidang netral lembut, sedangkan metadata tetap di kanvas putih.
- **Shadow Strategy:** tanpa bayangan saat diam; gambar membesar menjadi 1.045 pada hover desktop.
- **Border:** satu piksel menggunakan garis rambut.
- **Internal Padding:** 16px pada kartu gambar desktop dan sekitar 7px pada mobile.

### Inputs / Fields

- **Style:** kanvas putih, border abu-abu satu piksel, radius 9–12px, dan padding sekitar 14px.
- **Focus:** search berubah ke border cyan dengan ring cyan muda 3px; semua kontrol memperoleh outline focus-visible global.
- **Error / Disabled:** error memakai bidang merah pucat dan teks merah; opsi ukuran disabled memakai coretan, bidang netral, dan tinta redup.

### Navigation

Header menempatkan logo resmi di kiri, search sebagai elemen dominan, lalu utilitas pesanan, akun, dan keranjang. Saat belum masuk, utilitas menampilkan ikon dan label “Masuk”; saat sesi aktif, ikon berubah menjadi avatar inisial cyan dan label nama depan tanpa mengubah posisi tujuan. Nav utama aktif memakai teks cyan aksi, bobot tebal, dan garis bawah cyan 3px. Pada mobile, utilitas disederhanakan ke keranjang, search pindah ke baris kedua, dan nav menjadi strip horizontal.

### Login Panel

Halaman login memisahkan konteks dan tindakan. Sisi copy memakai bidang lembut, headline display, aksen geometri cyan transparan, serta garis rute “Temukan—Beli—Ikuti”; panel putih menampilkan logo resmi, penjelasan identitas Google, status demo, dan satu tombol Google selebar panel. Pada mobile, kedua sisi bertumpuk dan dekorasi miring disembunyikan agar alur tetap langsung.

### Account Navigation

Desktop memakai daftar vertikal 240px dengan item setinggi 58px dan divider. Tab aktif berubah menjadi cyan aksi serta menggeser chevron 3px; aksi keluar dipisahkan dengan merah bahaya. Di bawah 900px daftar menjadi rail horizontal, chevron disembunyikan, dan item mempertahankan target sentuh setidaknya 52px pada layar sempit.

### Profile, Address, and Order Surfaces

Profil memakai form satu kolom hingga 680px, field email disabled berbidang netral, metadata dua kolom, dan feedback sukses inline. Alamat memakai form 14px di atas bidang lembut, daftar tanpa kartu berbayang, badge “Utama”, serta konfirmasi hapus merah pucat. Riwayat pesanan memakai baris dua kolom dengan nomor dan total tabular, badge cyan untuk proses, badge hijau untuk selesai, dan tautan langsung ke pelacakan. Semua state demo diberi keterangan eksplisit.

### Category Rail

Kategori memakai thumbnail packshot, nama aktivitas, label “Lihat pilihan”, dan ikon arah. Desktop menampilkan enam tujuan dalam satu baris; mobile menjadi kartu 185px dengan scroll snap dan memperlihatkan dua kategori utuh pada viewport 390px.

### Size Picker

Opsi ukuran adalah grid tombol setinggi 58px. State default putih berborder, state aktif memakai tinta utama dengan teks putih, dan state habis dicoret serta diredupkan. Informasi stok kecil tetap berada di dalam kontrol ketika tersedia.

### Product Card

Packshot tunggal berada pada bidang netral rasio 4:3. Metadata merek dan stok muncul sebelum nama, kemudian harga tebal dengan angka tabular dan preview ukuran. Pada mobile rak tetap dua kolom, sementara metadata stok dan preview ukuran dapat disembunyikan demi keterbacaan.

## Do's and Don'ts

### Do:

- **Do** gunakan logo GutShoes resmi dan pertahankan proporsinya.
- **Do** jadikan harga, ukuran, stok, pencarian, dan status transaksi mudah dipindai.
- **Do** gunakan cyan aksi untuk progres, pilihan, dan orientasi.
- **Do** gunakan packshot bersih dan bidang netral agar produk menjadi fokus.
- **Do** pertahankan CTA dan jalur menuju kategori serta rak produk pada viewport mobile pertama.
- **Do** tampilkan state sesi di posisi utilitas akun yang konsisten dan tandai tab akun aktif dengan cyan.
- **Do** gunakan konfirmasi eksplisit sebelum keluar atau menghapus alamat.

### Don't:

- **Don't** menciptakan promo, perbandingan harga, jaminan, atau klaim autentisitas yang tidak didukung data.
- **Don't** memberi bayangan pada setiap kartu atau mengubah katalog menjadi tumpukan panel mengambang.
- **Don't** mengganti cyan merek dengan banyak aksen bersaing.
- **Don't** memakai geometri miring khas hero sebagai pola dekoratif di setiap komponen.
- **Don't** menyembunyikan ukuran dan harga di balik interaksi sekunder pada alur pembelian.
- **Don't** membuat login terlihat seperti form kata sandi lokal; implementasi saat ini hanya menyediakan jalur Google demonstratif.
- **Don't** menampilkan riwayat, profil, atau alamat sebagai data tervalidasi server ketika masih berasal dari sesi demo.
