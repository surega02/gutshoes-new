# Auth & Account — Surface Brief

- **Job and audience:** Pembeli dapat masuk melalui simulasi Google, menyimpan profil dan alamat, melihat pesanan, lalu keluar; guest checkout tetap tersedia.
- **Outcome and proof:** Rute terlindungi mengalihkan tamu ke login dan mengembalikan mereka ke tujuan. Email Google terkunci. Alamat mendukung tambah, edit, hapus, dan default. Pesanan demo diberi label.
- **Direction:** Mode Operate dalam dunia storefront GutShoes—Manrope, putih/cyan/ink, garis tipis, bidang abu dingin, geometri rute miring pada login, dan account shell berbasis navigasi samping/tab.
- **Scope and states:** `#login`, `#profile`, `#addresses`, `#orders`; loading login, empty address, validasi, success feedback, destructive confirmation, protected-route redirect, dan logout.
- **Session contract:** Sesi dan data demo memakai `localStorage`, sehingga bertahan setelah refresh serta ketika browser dibuka kembali pada perangkat yang sama. Produksi harus menggantinya dengan sesi dan otorisasi server.
- **Responsive contract:** Login split menjadi tumpukan pada seluler; sidebar akun menjadi tab horizontal. Kontrol minimal 44 px, state aktif memakai `aria-current`, dan dialog native mengisolasi fokus serta mendukung Escape.
