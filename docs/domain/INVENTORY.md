# Inventory Engine

Semua mutasi stok harus melalui `InventoryService` dalam transaksi database dengan `lockForUpdate`. Nilai tersedia dihitung sebagai `on_hand - reserved`.

- `add`: penerimaan stok positif.
- `adjust`: koreksi stok dengan invariant `on_hand >= reserved >= 0`.
- `reserve`: membuat/menambah reservation aktif dan movement `RESERVE` secara atomik.
- `release`: idempotent; hanya reservation aktif yang mengurangi reserved stock.
- `sell`: idempotent; mengurangi on-hand dan reserved lalu menambah sold.

`inventory_movements` bersifat immutable pada layer model. Job `ReleaseExpiredInventoryReservations` dijadwalkan setiap menit dengan `withoutOverlapping` dan aman dijalankan ulang.
