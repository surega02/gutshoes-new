# GutShoes Backend

API GutShoes menggunakan Laravel 12 dan PHP 8.4. Infrastruktur lokal tersedia melalui MySQL 8.4, Redis 7.4, dan Mailpit.

## Menjalankan lokal

```bash
docker compose up -d
cd apps/backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan regions:import
php artisan serve
```

Mailpit tersedia di `http://localhost:8025`. Horizon dijalankan pada host Linux/container menggunakan `php artisan horizon`.

## Quality gate

```bash
composer test
composer analyse
composer format:check
composer audit --locked
```

Jangan masukkan `.env`, key, token, dump database, log, atau data pelanggan nyata ke Git.
