# GutShoes

Monorepo aplikasi e-commerce GutShoes.

## Struktur

```text
apps/
  storefront/   React + Vite
  backend/      Laravel REST API (tahap berikutnya)
```

Dokumen PRD, konteks produk, desain UI, dan rancangan database disimpan di root sebagai sumber kebenaran bersama.

## Storefront

```powershell
cd apps/storefront
npm install
npm run dev
```

Build produksi:

```powershell
cd apps/storefront
npm run build
```

## Backend

Backend Laravel akan ditempatkan di `apps/backend` dan berkomunikasi dengan storefront melalui REST API yang terversi.

