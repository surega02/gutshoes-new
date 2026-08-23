# Cart, Promotion, and Shipping

Guest cart memakai UUID opaque pada header `X-Guest-Cart-Token`; customer cart dikaitkan ke session user. Harga selalu dihitung ulang oleh `PricingService` dari variant aktif.

Product promotion aktif dengan priority tertinggi diterapkan per line, lalu paling banyak satu voucher dapat ditumpuk. Voucher memvalidasi periode, minimum transaksi, batas penggunaan global/per-user, dan product applicability.

`ShippingProvider` memisahkan domain dari Biteship. Development dan test menggunakan `FakeShippingProvider`; production mengatur `SHIPPING_DRIVER=biteship` dan secret API hanya melalui environment.
