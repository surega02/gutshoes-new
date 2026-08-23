# Security and Secret Handling

## Aturan Repository

- Jangan commit `.env` atau konfigurasi environment yang berisi nilai nyata.
- Hanya `.env.example` dengan placeholder aman yang boleh dilacak.
- Credential Google OAuth, Midtrans, database, mail, shipping provider, dan cloud disimpan melalui environment/secret manager.
- Private key, certificate, service-account JSON, credential export, dan browser profile tidak boleh masuk Git.
- Jangan menaruh secret di source code, migration, seeder, test fixture, screenshot, log, dokumentasi, atau command history yang disalin ke repository.
- Data demo harus fiktif dan tidak boleh menggunakan data pelanggan sebenarnya.

## Pemeriksaan Sebelum Commit

Aktifkan hook setelah clone:

```powershell
git config core.hooksPath scripts/git-hooks
```

Hook memblokir nama file credential umum dan pola secret berisiko tinggi pada staged diff. Pemeriksaan ini merupakan lapisan tambahan, bukan pengganti GitHub secret scanning atau review manusia.

## Jika Secret Terlanjur Terpapar

1. Cabut dan rotasi credential pada provider terkait.
2. Bersihkan riwayat Git jika diperlukan.
3. Periksa log dan aktivitas penggunaan credential.
4. Dokumentasikan insiden tanpa menyalin nilai secret.
