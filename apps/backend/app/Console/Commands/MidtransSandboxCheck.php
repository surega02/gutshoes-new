<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class MidtransSandboxCheck extends Command
{
    protected $signature = 'midtrans:sandbox-check';

    protected $description = 'Periksa konfigurasi sandbox tanpa menampilkan kunci atau membuat transaksi';

    public function handle(): int
    {
        $errors = [];
        if (config('services.midtrans.driver') !== 'http') {
            $errors[] = 'MIDTRANS_DRIVER harus http.';
        }
        if (! str_starts_with((string) config('services.midtrans.server_key'), 'SB-Mid-server-')) {
            $errors[] = 'Server Key sandbox belum tersedia.';
        }
        foreach (['snap_url' => 'https://app.sandbox.midtrans.com/snap/v1/transactions', 'api_url' => 'https://api.sandbox.midtrans.com/v2'] as $key => $url) {
            if (rtrim((string) config('services.midtrans.'.$key), '/') !== $url) {
                $errors[] = $key.' harus memakai endpoint sandbox resmi.';
            }
        }
        foreach ($errors as $error) {
            $this->error($error);
        }
        $this->line('Callback: '.rtrim((string) config('app.url'), '/').'/api/v1/payments/midtrans/webhook');
        $this->line('Callback harus dapat diakses Midtrans melalui HTTPS publik. Tidak ada request provider dikirim.');

        return $errors ? self::FAILURE : self::SUCCESS;
    }
}
