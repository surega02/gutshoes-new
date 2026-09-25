# Infrastruktur Email GutShoes

## Keputusan environment

| Environment | Provider | Transport |
| --- | --- | --- |
| Development | Google SMTP akun pribadi | Laravel SMTP |
| Staging | Google SMTP akun pribadi | Laravel SMTP |
| Production | Resend | Resend SMTP |

Seluruh email dikirim melalui Laravel Mail dari SendOrderEmail. Domain order, payment, shipping, dan recovery guest tidak mengetahui provider aktif. Pergantian provider cukup melalui environment variable.

## Google SMTP development dan staging

Gunakan akun khusus staging. Aktifkan 2-Step Verification dan buat App Password khusus GutShoes.

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=gutshoes.staging@gmail.com
MAIL_PASSWORD=google-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=gutshoes.staging@gmail.com
MAIL_FROM_NAME="GutShoes Staging"
```

App Password disimpan di secret manager atau environment host. Jika password akun Google berubah, uji ulang karena App Password dapat dicabut.

## Resend SMTP produksi

Verifikasi domain pengirim di Resend dan pasang SPF/DKIM yang diberikan. Gunakan subdomain transaksional, misalnya mail.gutshoes.id.

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=resend-api-key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=orders@mail.gutshoes.id
MAIL_FROM_NAME="GutShoes"
```

SMTP Resend tidak membutuhkan SDK. API key diperlakukan sebagai SMTP password dan hanya disimpan di secret manager produksi.

## Aturan operasional

1. QUEUE_CONNECTION memakai Redis pada staging dan produksi.
2. Horizon dan scheduler dijalankan oleh supervisor.
3. Checkout tidak boleh gagal karena email gagal; job email memakai retry dan failed-job monitoring.
4. Pantau email_deliveries, queue gagal, bounce, complaint, dan delivery rate.
5. Jangan mencatat App Password, API key, atau token recovery guest.
6. Smoke test ke Gmail dan provider lain sebelum deployment dinyatakan sehat.
7. Produksi mengaktifkan webhook Resend untuk delivered, bounced, dan complained dengan verifikasi signature.

## Checklist aktivasi

### Development/staging

- akun Gmail khusus tersedia;
- 2-Step Verification aktif;
- App Password masuk secret environment;
- queue worker berjalan;
- email order created dan recovery guest diterima.

### Production

- domain Resend terverifikasi;
- SPF dan DKIM valid, DMARC minimal mode observasi;
- API key hanya memiliki izin yang diperlukan;
- sender memakai domain terverifikasi;
- webhook delivery/bounce/complaint aktif;
- alert queue gagal dan email FAILED aktif;
- recovery guest diuji setelah local storage browser dihapus.
