# Fase 10 — Admin Operations

API admin mencakup dashboard/revenue, order, payment, shipment, cancellation, refund, customer, promotion, voucher, inventory, dan konfigurasi toko. Query listing mendukung filter ter-whitelist, sorting, pagination, dan batas `per_page` maksimum 100.

Threshold low stock dibaca dari `store_configurations`. Semua mutasi pada prefix admin melewati middleware audit yang mencatat aktor, request ID, IP, route, dan metadata tereduksi. Audit log tidak menyediakan endpoint update/delete.
